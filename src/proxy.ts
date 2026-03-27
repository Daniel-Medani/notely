import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login', '/register', '/invite']
const AUTH_ROUTES = ['/login', '/register']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isSecure = request.nextUrl.protocol === 'https:'
  const sessionCookie = isSecure
    ? request.cookies.get('__Secure-better-auth.session_token') ||
      request.cookies.get('better-auth.session_token')
    : request.cookies.get('better-auth.session_token')

  const isPublicRoute = PUBLIC_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r))
  const isAuthenticated = !!sessionCookie?.value

  // Unauthenticated users can only access public routes
  if (!isPublicRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Authenticated users should not see auth pages — redirect to workspace
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
