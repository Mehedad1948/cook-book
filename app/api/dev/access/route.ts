import { NextResponse, type NextRequest } from "next/server";
import { DEV_ACCESS_COOKIE } from "@/lib/dal";

/**
 * Dev-only: preview the page as anonymous / free / subscriber before real auth exists (phase 2).
 *   /api/dev/access?as=subscriber&next=/recipes/beryani-isfahani
 * Returns 404 in production. Delete when real login ships.
 */
export function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const as = req.nextUrl.searchParams.get("as") ?? "anonymous";
  const next = req.nextUrl.searchParams.get("next") ?? "/";
  const res = NextResponse.redirect(new URL(next.startsWith("/") ? next : "/", req.url));
  if (as === "subscriber" || as === "free") {
    res.cookies.set(DEV_ACCESS_COOKIE, as, { path: "/", httpOnly: true, sameSite: "lax" });
  } else {
    res.cookies.delete(DEV_ACCESS_COOKIE);
  }
  return res;
}
