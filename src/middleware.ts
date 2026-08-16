import { NextRequest, NextResponse } from "next/server";
import { cookieLooksSigned } from "@/lib/auth/cookie-format";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("ab_session")?.value;
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
    if (!cookieLooksSigned(token)) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/app", "/app/:path*", "/admin", "/admin/:path*"],
};
