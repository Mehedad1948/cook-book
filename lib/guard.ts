/**
 * Production safety guard (docs/app-guide section 6.3). Pure so it can be unit-tested; it is
 * enforced at server start by instrumentation.ts. Set ALLOW_INSECURE_LOCAL=1 to run
 * `next start` locally with demo settings.
 */
export function configProblems(env: Record<string, string | undefined>): string[] {
  if (env.NODE_ENV !== "production") return [];
  if (env.ALLOW_INSECURE_LOCAL === "1") return [];

  const problems: string[] = [];
  const sms = env.SMS_PROVIDER || "inline";
  const pay = env.PAYMENT_PROVIDER || "fake";

  if (sms === "inline" && pay !== "fake") {
    problems.push("SMS_PROVIDER=inline returns login codes to the browser; it must not run next to a real payment provider.");
  }
  if (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32) {
    problems.push("AUTH_SECRET must be set to a random string of at least 32 characters.");
  }
  if (!env.DATABASE_URL && !(env.DATABASE_HOST && env.DATABASE_NAME)) {
    problems.push("Database settings are missing (DATABASE_URL or DATABASE_HOST/PORT/USERNAME/PASSWORD/NAME).");
  }
  return problems;
}

export function assertConfig(env: Record<string, string | undefined> = process.env): void {
  const problems = configProblems(env);
  if (problems.length) {
    throw new Error(`Refusing to start with unsafe configuration:\n - ${problems.join("\n - ")}`);
  }
}
