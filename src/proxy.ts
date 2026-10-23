import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/server/session";

/**
 * Fast anonymous-user redirect. This is deliberately not the authorization
 * check: every page and action calls requireUser or requireRole itself.
 */
export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const payload = token ? await verifySessionToken(token) : null;

  if (payload) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.search = "";

  const response = NextResponse.redirect(loginUrl);
  if (token) {
    response.cookies.delete(SESSION_COOKIE);
  }
  return response;
}

export const config = {
  matcher: [
    "/",
    "/counter/:path*",
    "/orders/:path*",
    "/customers/:path*",
    "/dashboard/:path*",
    "/receivables/:path*",
    "/expenses/:path*",
    "/stock/:path*",
    "/reports/:path*",
    "/settings/:path*",
    "/audit/:path*",
  ],
};
