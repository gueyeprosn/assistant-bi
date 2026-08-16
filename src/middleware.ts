import { NextRequest, NextResponse } from "next/server";
import { cookieLooksSigned } from "@/lib/auth/cookie-format";
import { rateLimit } from "@/lib/rate-limit";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("ab_session")?.value;
  const { pathname } = req.nextUrl;
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname.startsWith("/app") || pathname.startsWith("/admin")) {
    const sid = token?.slice(0, 24) || "anon";
    const hit = rateLimit(`dash:${sid}`, 120, 60_000);
    if (!hit.ok) {
      return NextResponse.json(
        { success: false, error: { code: "RATE_LIMITED", message: "Trop de requêtes." } },
        { status: 429 },
      );
    }
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
