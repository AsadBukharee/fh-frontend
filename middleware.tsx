import { NextResponse, NextRequest } from 'next/server'
import API_URL from './app/utils/ENV'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  let accessToken = request.cookies.get('access_token')?.value
  const refreshToken = request.cookies.get('refresh_token')?.value

  // Function to decode JWT payload
  const decodeJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8')
      return JSON.parse(jsonPayload)
    } catch (error) {
      console.error('JWT decode error:', error)
      return null
    }
  }

  // Function to check if token is expired
  const isTokenExpired = (token: string | undefined) => {
    if (!token) return true
    const payload = decodeJwt(token)
    if (!payload || !payload.exp) return true
    return new Date().getTime() / 1000 > payload.exp
  }

  // Function to refresh tokens
  const refreshTokens = async () => {
    if (!refreshToken) return null

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshToken}`,
         },
        body: JSON.stringify({ refreshToken }),
      })

      if (!response.ok) throw new Error('Failed to refresh token')

      const data = await response.json()
      const newAccessToken = data.accessToken
      const newRefreshToken = data.refreshToken
      const newPayload = decodeJwt(newAccessToken)
      const newExpiry = newPayload?.exp ? newPayload.exp * 1000 : Date.now() + 3600 * 1000 // Convert to ms

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiry: newExpiry,
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      return null
    }
  }

  // Check if token is expired and refresh if necessary
  if (accessToken && isTokenExpired(accessToken)) {
    const newTokens = await refreshTokens()
    if (newTokens) {
      accessToken = newTokens.accessToken
      const response = NextResponse.next()

      // Update cookies with new tokens
      response.cookies.set('access_token', newTokens.accessToken)
      response.cookies.set('refresh_token', newTokens.refreshToken)
      // Store expiry in milliseconds for consistency
      response.cookies.set('token_expiry', newTokens.expiry.toString())

      return response
    } else {
      // If refresh fails, clear tokens and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('access_token')
      response.cookies.delete('refresh_token')
      response.cookies.delete('token_expiry')
      return response
    }
  }

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
  matcher: ['/', '/dashboard/:path*', '/login', '/register'],
}