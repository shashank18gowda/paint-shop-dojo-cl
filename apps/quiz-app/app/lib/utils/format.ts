export function formatDuration(secs: number | null | undefined): string {
  if (secs === null || secs === undefined) return "—";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
