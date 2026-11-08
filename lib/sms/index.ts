/**
 * SMS adapter. A real provider is a new file lib/sms/<name>.ts plus one line below.
 * This project deliberately ships without a real SMS provider: the dev "inline" provider
 * returns the code to the UI (docs/app-guide section 6.3). Because of that it is an
 * account-takeover hole by design; lib/guard.ts refuses unsafe combinations in production.
 */
export interface SmsProvider {
  /** Real providers return void. Only the dev "inline" provider returns the code. */
  sendOtp(phone: string, code: string): Promise<{ devCode?: string } | void>;
}

const inline: SmsProvider = {
  async sendOtp(_phone, code) {
    return { devCode: code };
  },
};

export function smsProviderName(env: NodeJS.ProcessEnv = process.env): string {
  return env.SMS_PROVIDER || "inline";
}

export function getSmsProvider(): SmsProvider {
  const name = smsProviderName();
  if (name === "inline") return inline;
  throw new Error(`SMS provider "${name}" is not implemented. Add lib/sms/${name}.ts and register it in lib/sms/index.ts.`);
}

export const isInlineSms = () => smsProviderName() === "inline";
