/** A purchase starts when the current period ends (or now, if there is none): renewing never loses paid days. */
export function nextPeriod(currentEnd: Date | null, now: Date, days: number): { start: Date; end: Date } {
  const start = currentEnd && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  return { start, end: new Date(start.getTime() + days * 24 * 60 * 60 * 1000) };
}
