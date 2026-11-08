/** Only same-site relative paths; blocks open redirects like //evil.com or /\evil.com. */
export function safeNext(next: unknown, fallback = "/account"): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")
    ? next
    : fallback;
}
