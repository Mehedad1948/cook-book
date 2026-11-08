"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requestOtp, verifyOtp, SESSION_DAYS } from "@/lib/auth/service";
import { SESSION_COOKIE } from "@/lib/dal";
import { safeNext } from "@/lib/auth/next";

export type LoginState = {
  step: "phone" | "code";
  phone?: string;
  devCode?: string;
  error?: string;
  next?: string;
};

async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || null;
}

export async function requestOtpAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  const next = safeNext(form.get("next"));
  const res = await requestOtp(String(form.get("phone") ?? ""), await clientIp());
  if (!res.ok) return { step: "phone", error: res.error, next };
  return { step: "code", phone: res.phone, devCode: res.devCode, next };
}

export async function verifyOtpAction(prev: LoginState, form: FormData): Promise<LoginState> {
  const next = safeNext(form.get("next"));
  const phone = String(form.get("phone") ?? "");
  const h = await headers();
  const res = await verifyOtp(phone, String(form.get("code") ?? ""), h.get("user-agent"));
  if (!res.ok) return { ...prev, step: "code", phone, error: res.error, next };

  (await cookies()).set(SESSION_COOKIE, res.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && process.env.ALLOW_INSECURE_LOCAL !== "1",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
  redirect(next);
}
