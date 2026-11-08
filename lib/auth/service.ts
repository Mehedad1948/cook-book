import { normalizePhone } from "./phone";
import { generateOtp, hashOtp, hashToken, newSessionToken, safeEqualHex } from "./crypto";
import { getSmsProvider } from "../sms";
import {
  claimOtpAttempt,
  consumeOtp,
  countRecentOtpsByIp,
  countRecentOtpsByPhone,
  createOtp,
  findActiveOtp,
} from "../db/otp";
import { upsertUserByPhone, type User } from "../db/users";
import { insertSession } from "../db/sessions";

/** Framework-free auth flow: OTP request and verification. Server actions are thin wrappers around this. */

export const OTP_TTL_SECONDS = 120;
export const OTP_MAX_ATTEMPTS = 5;
export const PHONE_LIMIT = { count: 5, minutes: 10 };
export const IP_LIMIT = { count: 20, minutes: 60 };
export const SESSION_DAYS = 30;

export type RequestOtpResult =
  | { ok: true; phone: string; devCode?: string }
  | { ok: false; error: string };

export async function requestOtp(rawPhone: string, ip: string | null): Promise<RequestOtpResult> {
  const phone = normalizePhone(rawPhone);
  if (!phone) return { ok: false, error: "شمارهٔ موبایل درست نیست. مثلاً ۰۹۱۲۳۴۵۶۷۸۹" };

  if ((await countRecentOtpsByPhone(phone, PHONE_LIMIT.minutes)) >= PHONE_LIMIT.count) {
    return { ok: false, error: "تعداد درخواست‌ها زیاد است. چند دقیقه صبر کن و دوباره امتحان کن." };
  }
  if (ip && (await countRecentOtpsByIp(ip, IP_LIMIT.minutes)) >= IP_LIMIT.count) {
    return { ok: false, error: "تعداد درخواست‌ها زیاد است. کمی بعد دوباره امتحان کن." };
  }

  const code = generateOtp();
  await createOtp(phone, hashOtp(phone, code), ip, OTP_TTL_SECONDS);
  const sent = await getSmsProvider().sendOtp(phone, code);
  return { ok: true, phone, devCode: sent?.devCode };
}

export type VerifyResult =
  | { ok: true; user: User; token: string }
  | { ok: false; error: string };

export async function verifyOtp(rawPhone: string, rawCode: string, userAgent: string | null): Promise<VerifyResult> {
  const phone = normalizePhone(rawPhone);
  const code = rawCode.replace(/[^0-9۰-۹٠-٩]/g, "");
  if (!phone || code.length !== 6) return { ok: false, error: "کد شش‌رقمی را کامل وارد کن." };

  const otp = await findActiveOtp(phone);
  if (!otp) return { ok: false, error: "کد منقضی شده یا درخواست نشده. دوباره کد بگیر." };
  if (!(await claimOtpAttempt(otp.id, OTP_MAX_ATTEMPTS))) {
    return { ok: false, error: "تعداد تلاش‌ها زیاد بود. دوباره کد بگیر." };
  }

  const latin = code.replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0)).replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  if (!safeEqualHex(otp.codeHash, hashOtp(phone, latin))) return { ok: false, error: "کد درست نیست." };
  if (!(await consumeOtp(otp.id))) return { ok: false, error: "این کد قبلاً استفاده شده است." };

  const user = await upsertUserByPhone(phone);
  const token = newSessionToken();
  await insertSession(user.id, hashToken(token), SESSION_DAYS, userAgent);
  return { ok: true, user, token };
}
