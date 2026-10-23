export function parseHumor(raw: unknown): string[] {
  const lines = (raw as { lines?: unknown })?.lines;
  if (
    !Array.isArray(lines) ||
    !lines.length ||
    lines.some(
      (line) => typeof line !== "string" || !line.trim() || line.length > 160,
    )
  )
    throw new Error("JSON de humor inválido");
  return [...lines];
}
export function humorLine(
  lines: string[],
  index: number,
  enabled: boolean,
): string {
  return enabled && lines.length ? lines[Math.abs(index) % lines.length] : "";
}
