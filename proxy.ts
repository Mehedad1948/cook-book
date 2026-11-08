import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect ONLY: if there is no session cookie at all, send the visitor to /login.
 * This is a convenience, not authorization: pages and actions re-check through lib/dal.ts.
 * No database calls here.
 */
export function proxy(req: NextRequest) {
  if (!req.cookies.has("rs_session")) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/account/:path*", "/favorites", "/shopping-list"] };
