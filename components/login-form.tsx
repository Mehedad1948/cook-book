"use client";

import { useActionState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { requestOtpAction, verifyOtpAction, type LoginState } from "@/app/login/actions";
import { toFaDigits } from "@/lib/format";
import { maskPhone } from "@/lib/auth/phone";

const initial: LoginState = { step: "phone" };

/** Two steps in one form: phone -> code. The dev banner shows only when the server returns a devCode. */
export function LoginForm() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/account";
  const [req, requestAction, requesting] = useActionState(requestOtpAction, initial);
  const [ver, verifyAction, verifying] = useActionState(verifyOtpAction, initial);
  const codeRef = useRef<HTMLInputElement>(null);

  // after a code was requested we are on the code step; a failed verify keeps us there
  const onCode = req.step === "code";
  const error = (onCode ? ver.error : undefined) ?? req.error;

  if (!onCode) {
    return (
      <form action={requestAction} className="grid gap-4 text-start">
        <input type="hidden" name="next" value={next} />
        <label className="grid gap-1.5">
          <span className="font-bold">شمارهٔ موبایل</span>
          <input
            name="phone"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            autoComplete="tel"
            placeholder="09123456789"
            required
            className="h-14 rounded-2xl border border-line bg-surface px-4 text-center text-lg tracking-wide"
          />
        </label>
        {error && <p role="alert" className="text-sm font-bold text-[#b3261e]">{error}</p>}
        <button className="btn btn-primary" disabled={requesting}>{requesting ? "در حال ارسال…" : "دریافت کد ورود"}</button>
        <p className="text-sm text-muted">فقط شمارهٔ موبایل لازم است. شمارهٔ تو نمایش داده یا به اشتراک گذاشته نمی‌شود.</p>
      </form>
    );
  }

  return (
    <form action={verifyAction} className="grid gap-4 text-start">
      <input type="hidden" name="next" value={req.next ?? next} />
      <input type="hidden" name="phone" value={req.phone} />
      <p>کد ۶ رقمی برای <bdi className="font-bold">{maskPhone(req.phone!)}</bdi> ارسال شد. تا ۲ دقیقه معتبر است.</p>
      {req.devCode && (
        <div role="note" className="rounded-2xl border border-dashed border-brand bg-brand-soft p-3 text-sm">
          <strong>حالت آزمایشی:</strong> پیامک واقعی فعال نیست. کد ورود: <bdi className="text-lg font-extrabold">{toFaDigits(req.devCode)}</bdi>
          <button type="button" className="chip ms-2" onClick={() => { if (codeRef.current) codeRef.current.value = req.devCode!; }}>
            پر کردن
          </button>
        </div>
      )}
      <label className="grid gap-1.5">
        <span className="font-bold">کد ورود</span>
        <input
          ref={codeRef}
          name="code"
          inputMode="numeric"
          dir="ltr"
          autoComplete="one-time-code"
          maxLength={6}
          required
          className="h-14 rounded-2xl border border-line bg-surface px-4 text-center text-2xl tracking-[0.5em]"
        />
      </label>
      {error && <p role="alert" className="text-sm font-bold text-[#b3261e]">{error}</p>}
      <button className="btn btn-primary" disabled={verifying}>{verifying ? "در حال بررسی…" : "ورود"}</button>
      <a href={`/login?next=${encodeURIComponent(next)}`} className="text-center text-sm text-brand-ink underline">شمارهٔ دیگری وارد کن</a>
    </form>
  );
}
