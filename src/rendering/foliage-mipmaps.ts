export interface RgbaLevel { data: Uint8Array; width: number; height: number }

function coverage(data: Uint8Array, scale = 1) {
  let opaque = 0;
  for (let i = 3; i < data.length; i += 4) if (Math.round(data[i] * scale) >= 128) opaque++;
  return opaque / (data.length / 4);
}

/** One-time CPU mip preparation for alphaTest=.5; zero-alpha pixels remain transparent. */
export function buildFoliageMipmaps(base: RgbaLevel): RgbaLevel[] {
  if (!Number.isInteger(base.width) || !Number.isInteger(base.height) || base.width < 1 || base.height < 1 || base.data.length !== base.width * base.height * 4) throw new Error('Invalid foliage RGBA dimensions');
  const target = coverage(base.data);
  const levels = [{ ...base, data: base.data.slice() }];
  let raw = base;
  while (raw.width > 1 || raw.height > 1) {
    const width = Math.max(1, Math.floor(raw.width / 2)), height = Math.max(1, Math.floor(raw.height / 2));
    const data = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      let alpha = 0, red = 0, green = 0, blue = 0, samples = 0;
      // Include all source rows/columns at odd sizes (e.g. 4×3 → 2×1).
      for (let sy = Math.floor(y * raw.height / height); sy < Math.floor((y + 1) * raw.height / height); sy++) {
        for (let sx = Math.floor(x * raw.width / width); sx < Math.floor((x + 1) * raw.width / width); sx++) {
          const source = (sy * raw.width + sx) * 4, a = raw.data[source + 3];
          alpha += a; red += raw.data[source] * a; green += raw.data[source + 1] * a; blue += raw.data[source + 2] * a; samples++;
        }
      }
      const offset = (y * width + x) * 4;
      data[offset] = alpha ? Math.round(red / alpha) : 0;
      data[offset + 1] = alpha ? Math.round(green / alpha) : 0;
      data[offset + 2] = alpha ? Math.round(blue / alpha) : 0;
      data[offset + 3] = Math.round(alpha / samples);
    }
    // Filter the unscaled chain, avoiding accumulated alpha inflation and colour bias.
    raw = { data, width, height };
    let lower = 0, upper = 256;
    for (let iteration = 0; iteration < 18; iteration++) {
      const middle = (lower + upper) / 2;
      if (coverage(data, middle) < target) lower = middle; else upper = middle;
    }
    const scale = Math.abs(coverage(data, lower) - target) <= Math.abs(coverage(data, upper) - target) ? lower : upper;
    const corrected = data.slice();
    for (let i = 3; i < corrected.length; i += 4) corrected[i] = Math.min(255, Math.round(data[i] * scale));
    levels.push({ data: corrected, width, height });
  }
  return levels;
}
