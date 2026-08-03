import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Server-side auth guard: logged-out requests to protected routes are
// redirected to /login BEFORE the page renders (returns a 3xx, not a 200).
// This closes the client-side-only auth gap.

const SESSION_COOKIE = "acc.session";

export function middleware(req: NextRequest) {
  const session = req.cookies.get(SESSION_COOKIE)?.value;
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("from", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Only protected routes; /login, /, and static assets are untouched.
  matcher: ["/calendar/:path*", "/content/:path*"],
};
