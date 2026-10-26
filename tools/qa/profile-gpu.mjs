// Diagnostic only. Trace overhead is real; this never substitutes the FPS gate.
import { chromium, devices } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, open, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const composited = process.argv.includes('--composited');
const output = path.join(root, `docs/performance/gpu-diagnostic${composited ? '-composited' : ''}`);
const plan = {
  url: 'http://127.0.0.1:4191', output, durationMs: 6000,
  variant: composited ? 'composited-swiftshader' : 'default-headless',
  launchArgs: composited ? ['--enable-gpu', '--use-angle=swiftshader'] : [],
  device: 'Pixel 7', cpuThrottlingRate: 4, phase: 'stationary',
  categories: ['gpu', 'viz', 'cc', 'devtools.timeline', 'blink.user_timing', 'toplevel'],
  note: 'Six seconds playing at distance 0, inside the artistic slice. All sampled RAF intervals retained. No screenshots, video or pixel readback.',
};
if (process.argv.includes('--dry-run')) {
  console.log(JSON.stringify({ ...plan, dryRun: true, launchesBrowser: false }, null, 2));
} else {
  await run();
}

async function run() {
  await mkdir(output, { recursive: true });
  const serverLog = [];
  const server = spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'),
    '--host', '127.0.0.1', '--port', '4191', '--strictPort'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
  server.stdout.on('data', data => serverLog.push(data.toString()));
  server.stderr.on('data', data => serverLog.push(data.toString()));
  let serverError;
  server.on('error', error => { serverError = error; });
  let browser;
  try {
    let listening = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (serverError) throw serverError;
      if (server.exitCode !== null) throw new Error(`Vite exited: ${server.exitCode}`);
      try { listening = (await fetch(plan.url, { signal: AbortSignal.timeout(500) })).ok; } catch {}
      if (listening) break;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!listening) throw new Error('Diagnostic Vite server did not become ready');
    browser = await chromium.launch({ args: plan.launchArgs });
    const browserCdp = await browser.newBrowserCDPSession();
    const systemInfo = await browserCdp.send('SystemInfo.getInfo');
    const browserVersion = await browserCdp.send('Browser.getVersion');
    await writeJson('renderer.json', { browserVersion, systemInfo });
    if (composited) {
      const gpu = systemInfo.gpu;
      const isSwiftShader = gpu.devices.some(device => /swiftshader/i.test(device.deviceString ?? ''));
      if (gpu.featureStatus?.gpu_compositing !== 'enabled' || !isSwiftShader) {
        throw new Error('Composited diagnostic requires gpu_compositing=enabled and an actual SwiftShader renderer; see renderer.json');
      }
    }
    const context = await browser.newContext({ ...devices[plan.device] });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: plan.cpuThrottlingRate });
    await cdp.send('Performance.enable');
    await page.goto(plan.url);
    await page.waitForFunction(() => window.__game?.ready, undefined, { timeout: 60_000 });
    await page.getByTestId('safety').check();
    await page.getByTestId('start').click();
    const beforeGame = await page.evaluate(() => window.__game);
    // Before the first trace, Chromium can enumerate no categories. Request the
    // intended categories and check the actual captured events after collection.
    const enumeratedCategories = (await browserCdp.send('Tracing.getCategories')).categories;
    const categories = plan.categories;
    await browserCdp.send('Tracing.start', { transferMode: 'ReturnAsStream', streamFormat: 'json',
      traceConfig: { recordMode: 'recordAsMuchAsPossible', includedCategories: categories } });
    const before = await cdp.send('Performance.getMetrics');
    const frames = await page.evaluate(durationMs => new Promise(resolve => {
      const samples = [];
      let start, previous;
      performance.mark('gpu-diagnostic-start');
      function frame(now) {
        if (start === undefined) start = previous = now;
        else { samples.push(now - previous); previous = now; }
        if (now - start >= durationMs) {
          performance.mark('gpu-diagnostic-end');
          resolve({ samples, elapsedMs: now - start });
        } else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }), plan.durationMs);
    const after = await cdp.send('Performance.getMetrics');
    const afterGame = await page.evaluate(() => window.__game);
    const completion = once(browserCdp, 'Tracing.tracingComplete', { signal: AbortSignal.timeout(30_000) });
    await browserCdp.send('Tracing.end');
    const [completed] = await completion;
    if (!completed.stream) throw new Error('Chromium did not return the trace stream');
    const tracePath = path.join(output, 'trace.json');
    const traceFile = await open(tracePath, 'w');
    try {
      for (;;) {
        const chunk = await browserCdp.send('IO.read', { handle: completed.stream });
        await traceFile.write(Buffer.from(chunk.data, chunk.base64Encoded ? 'base64' : 'utf8'));
        if (chunk.eof) break;
      }
    } finally {
      await traceFile.close();
      await browserCdp.send('IO.close', { handle: completed.stream });
    }
    const trace = JSON.parse(await readFile(tracePath, 'utf8'));
    const summary = summarizeTrace(trace.traceEvents ?? []);
    const metricDelta = Object.fromEntries(after.metrics.map(metric => [metric.name,
      metric.value - (before.metrics.find(previous => previous.name === metric.name)?.value ?? 0)]));
    await writeJson('summary.json', { ...plan, requestedCategories: categories, enumeratedCategories,
      dataLossOccurred: completed.dataLossOccurred ?? false,
      metricDelta, beforeGame, afterGame, frames,
      fpsWithTraceOverhead: frames.samples.length * 1000 / frames.samples.reduce((sum, ms) => sum + ms, 0),
      ...summary,
      interpretation: 'Durations of complete X events are inclusive and may overlap. TaskOtherDuration and V8 (program) do not isolate GPU time. No FPS pass/fail assertion; use the unmodified E2E gate.',
    });
    if (completed.dataLossOccurred) throw new Error('Chromium reported trace data loss; evidence is incomplete');
    if (summary.missingRequiredCategories.length) {
      throw new Error(`Required categories absent from captured events: ${summary.missingRequiredCategories.join(', ')}`);
    }
    console.log(JSON.stringify({ output, requestedCategories: categories, observedCategories: summary.observedCategories,
      events: summary.eventCount, sampledFrames: frames.samples.length,
      startDistance: beforeGame.state.distance, endDistance: afterGame.state.distance }, null, 2));
  } catch (error) {
    await writeJson('error.json', { message: String(error), stack: error?.stack });
    throw error;
  } finally {
    try { await browser?.close(); }
    finally { server.kill(); await writeFile(path.join(output, 'server.log'), serverLog.join('')); }
  }
}

function summarizeTrace(events) {
  const names = new Map(), threads = new Map(), totals = new Map();
  const observed = new Set();
  for (const event of events) {
    const threadKey = `${event.pid}:${event.tid}`;
    if (event.ph === 'M') {
      if (event.name === 'process_name') names.set(event.pid, event.args?.name);
      if (event.name === 'thread_name') threads.set(threadKey, event.args?.name);
      continue;
    }
    for (const category of (event.cat ?? '').split(',')) if (category.trim()) observed.add(category.trim());
    const key = JSON.stringify([event.pid, event.tid, event.cat, event.name, event.ph]);
    const entry = totals.get(key) ?? { pid: event.pid, tid: event.tid, category: event.cat,
      name: event.name, phase: event.ph, count: 0, completeDurationMs: 0, maxCompleteDurationMs: 0 };
    entry.count++;
    if (event.ph === 'X' && Number.isFinite(event.dur)) {
      entry.completeDurationMs += event.dur / 1000;
      entry.maxCompleteDurationMs = Math.max(entry.maxCompleteDurationMs, event.dur / 1000);
    }
    totals.set(key, entry);
  }
  const aggregates = [...totals.values()].sort((a, b) => b.completeDurationMs - a.completeDurationMs);
  return { eventCount: events.length, observedCategories: [...observed].sort(),
    missingRequiredCategories: ['gpu', 'viz', 'devtools.timeline'].filter(category => !observed.has(category)),
    processes: [...names].map(([pid, name]) => ({ pid, name })),
    threads: [...threads].map(([key, name]) => { const [pid, tid] = key.split(':').map(Number); return { pid, tid, name }; }),
    aggregates };
}

function writeJson(name, value) {
  return writeFile(path.join(output, name), JSON.stringify(value, null, 2));
}
