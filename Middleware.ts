import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_ROUTES = ["/login"]

const ROLE_ROUTES: Record<string, string> = {
  admin: "/dashboard/admin",
  regente: "/dashboard/regente",
  estudiante: "/dashboard/estudiante",
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) return NextResponse.next()

  // Allow dashboard routes - auth is handled client-side with sessionStorage
  // For production, replace with Supabase JWT cookie validation
  if (pathname.startsWith("/dashboard")) return NextResponse.next()

  // Redirect root to login
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}