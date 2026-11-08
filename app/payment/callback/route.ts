import { NextResponse, type NextRequest } from "next/server";
import { completePayment } from "@/lib/billing/service";

/**
 * Gateway return URL. The query string is untrusted: we only use it to look the payment up and
 * ask the provider to verify it server-side. A replayed callback is harmless (idempotent).
 */
export async function GET(req: NextRequest) {
  const authority = req.nextUrl.searchParams.get("authority") ?? "";
  const status = req.nextUrl.searchParams.get("status") ?? "";
  const res = authority ? await completePayment(authority, status) : ({ status: "unknown" } as const);
  return NextResponse.redirect(new URL(`/payment/result?r=${res.status}`, req.url));
}
