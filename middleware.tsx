import { NextResponse, NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Get the access token from cookies
  const accessToken = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  // Handle root route
  if (pathname === '/') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Handle dashboard and its child routes
  if (pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Handle login and register routes
  if (pathname === '/login' || pathname === '/register') {
    if (accessToken) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Allow other routes to proceed
  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login', '/register'], // Match root, dashboard, login, and register routes
}