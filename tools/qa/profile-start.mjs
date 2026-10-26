// Diagnostic of the first play transition, with profiling active BEFORE the click.
// Profiling overhead is retained; results are not an FPS gate.
import { chromium, devices } from '@playwright/test';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const output = process.env.START_PROFILE_OUTPUT
  ? path.resolve(process.env.START_PROFILE_OUTPUT)
  : fileURLToPath(new URL('../../docs/performance/start-diagnostic/', import.meta.url));
const plan = { url: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4185',
  output, device: 'Pixel 7', cpuRate: 4, durationMs: 5000,
  categories: ['v8', 'v8.wasm', 'disabled-by-default-v8.wasm', 'gpu', 'devtools.timeline', 'blink.user_timing', 'toplevel'] };
if (process.argv.includes('--dry-run')) console.log(JSON.stringify({ ...plan, launchesBrowser: false }, null, 2));
else await run();

async function run() {
  await mkdir(output, { recursive: true });
  const save = (name, data) => writeFile(path.join(output, name), JSON.stringify(data));
  let browser;
  try {
    browser = await chromium.launch();
    const browserCdp = await browser.newBrowserCDPSession();
    await save('renderer.json', await browserCdp.send('SystemInfo.getInfo'));
    const context = await browser.newContext({ ...devices[plan.device] });
    const page = await context.newPage(), cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: plan.cpuRate });
    await cdp.send('Performance.enable');
    await cdp.send('Profiler.enable');
    await page.goto(plan.url);
    await page.waitForFunction(() => window.__game?.ready, undefined, { timeout: 60_000 });
    await page.getByTestId('safety').check();
    const beforeGame = await page.evaluate(() => window.__game);
    await page.evaluate(durationMs => {
      window.__startCapture = new Promise(resolve => {
        document.querySelector('[data-testid="start"]').addEventListener('click', () => {
          const start = performance.now();
          performance.mark('start-diagnostic-click');
          const frames = [];
          let previous;
          function capture(now) {
            const callbackElapsedMs = performance.now() - start;
            // RAF timestamps belong to the rendering cycle and can precede the
            // click in that same cycle. Retain the timestamp, not a false negative duration.
            frames.push({ rafTimestampMs: now, elapsedMs: now - start, callbackElapsedMs,
              intervalMs: previous === undefined ? null : now - previous });
            previous = now;
            if (callbackElapsedMs >= durationMs) {
              performance.mark('start-diagnostic-end');
              resolve({ clickMs: start, frames });
            } else requestAnimationFrame(capture);
          }
          requestAnimationFrame(capture);
        }, { once: true });
      });
    }, plan.durationMs);
    await browserCdp.send('Tracing.start', { transferMode: 'ReturnAsStream', streamFormat: 'json',
      traceConfig: { recordMode: 'recordAsMuchAsPossible', includedCategories: plan.categories } });
    const before = await cdp.send('Performance.getMetrics');
    await cdp.send('Profiler.start');
    await page.getByTestId('start').click();
    await page.getByTestId('pedal').dispatchEvent('pointerdown', { pointerId: 2 });
    const capture = await page.evaluate(() => window.__startCapture);
    const { profile } = await cdp.send('Profiler.stop');
    const after = await cdp.send('Performance.getMetrics');
    const afterGame = await page.evaluate(() => window.__game);
    const completion = once(browserCdp, 'Tracing.tracingComplete', { signal: AbortSignal.timeout(30_000) });
    await browserCdp.send('Tracing.end');
    const [completed] = await completion;
    const chunks = [];
    try {
      for (;;) {
        const chunk = await browserCdp.send('IO.read', { handle: completed.stream });
        chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8'));
        if (chunk.eof) break;
      }
    } finally { await browserCdp.send('IO.close', { handle: completed.stream }); }
    await writeFile(path.join(output, 'trace.json'), Buffer.concat(chunks));
    await save('startup.cpuprofile', profile);
    const counts = new Map();
    for (let i = 0; i < profile.samples.length; i++) {
      const id = profile.samples[i]; counts.set(id, (counts.get(id) || 0) + profile.timeDeltas[i]);
    }
    const top = profile.nodes.map(node => ({ id: node.id, ...node.callFrame, selfMs: (counts.get(node.id) || 0) / 1000 }))
      .sort((a, b) => b.selfMs - a.selfMs).slice(0, 60);
    const metricDelta = Object.fromEntries(after.metrics.map(metric => [metric.name,
      metric.value - (before.metrics.find(previous => previous.name === metric.name)?.value ?? 0)]));
    const report = { ...plan, beforeGame, afterGame, capture, metricDelta, top,
      traceDataLoss: completed.dataLossOccurred ?? false,
      note: 'Profiler and trace active before start click. First callback records time since click and raw RAF timestamp; interval is null until a preceding RAF exists. All later intervals retained. Captured game metrics retain existing runtime semantics; no pass/fail FPS assertion.' };
    await save('report.json', report);
    if (completed.dataLossOccurred) throw new Error('Startup trace lost events');
    console.log(JSON.stringify({ output, frames: capture.frames.length, firstFrames: capture.frames.slice(0, 12),
      gameMetrics: afterGame.performance, top: top.slice(0, 12) }, null, 2));
  } catch (error) {
    await save('error.json', { message: String(error), stack: error?.stack }); throw error;
  } finally { await browser?.close(); }
}
