import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/auth/jwt";
import { SESSION_COOKIE } from "@/lib/auth/cookies";

/**
 * Edge middleware: cheap redirects only. It verifies the cookie signature so
 * signed-out visitors are sent to /login and non-admins away from /admin.
 * Real authorisation happens again in every route handler against the DB.
 */
const PROTECTED = ["/account", "/orders", "/checkout", "/saved"];
const AUTH_PAGES = ["/login", "/register"];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const claims = token ? await verifySession(token) : null;

  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");

  if ((needsAuth || isAdmin) && !claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  if (isAdmin && claims?.role !== "admin") {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (AUTH_PAGES.includes(pathname) && claims) {
    const url = req.nextUrl.clone();
    url.pathname = "/account";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/orders/:path*", "/checkout/:path*", "/saved/:path*", "/admin/:path*", "/login", "/register"],
};
