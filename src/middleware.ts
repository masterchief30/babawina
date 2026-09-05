import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname === "/" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/apple-touch-icon") ||
    pathname === "/site.webmanifest"
  ) {
    return NextResponse.next()
  }

  return NextResponse.redirect(new URL("/", request.url))
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
}
