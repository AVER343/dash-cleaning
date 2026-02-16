import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth/session";

const LOGIN_PAGE = "/admin/login";
const LOGIN_API = "/api/admin/auth/login";

function isProtectedPath(pathname: string) {
  return pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
}

function isPublicPath(pathname: string) {
  return pathname === LOGIN_PAGE || pathname === LOGIN_API;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const isAdmin = await verifyAdminSession(token);

  if (pathname === LOGIN_PAGE && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (isAdmin) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL(LOGIN_PAGE, request.url);
  const nextPath = `${pathname}${search}`;
  loginUrl.searchParams.set("next", nextPath);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"]
};
