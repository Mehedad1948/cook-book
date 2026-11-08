import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "ورود",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="container-page grid min-h-[60vh] place-items-center py-12">
      <div className="card w-full max-w-md p-6 sm:p-8">
        <h1 className="mb-1 text-2xl font-extrabold">ورود با شمارهٔ موبایل</h1>
        <p className="mb-6 text-muted">با کد یک‌بارمصرف وارد شو؛ نیازی به رمز عبور نیست.</p>
        <Suspense fallback={<div className="skeleton h-48" />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
