import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { NextRequest } from 'next/server'
import { rateLimitMiddleware } from '@/lib/rate-limiter-middleware'
import { applySecurityHeaders } from '@/lib/security-headers'

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Public routes that don't require authentication
    const publicRoutes = [
      '/',
      '/auth/login',
      '/auth/register',
      '/auth/error',
    ]

    // API routes that require special handling
    const apiRoutes = pathname.startsWith('/api/')
    
    // Dashboard routes that require authentication
    const protectedRoutes = pathname.startsWith('/dashboard')

    // Allow public routes
    if (publicRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // Handle API routes with JWT validation
    if (apiRoutes && !publicRoutes.includes(pathname)) {
      // Skip auth API routes
      if (pathname.startsWith('/api/auth/')) {
        return NextResponse.next()
      }

      // For other API routes, validate token
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Enhanced token validation
      if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        )
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', token.id as string)
      requestHeaders.set('x-user-role', token.role as string)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // Handle protected dashboard routes
    if (protectedRoutes) {
      if (!token) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Check token expiry for dashboard routes
      if (token.exp && token.exp < Math.floor(Date.now() / 1000)) {
        return NextResponse.redirect(new URL('/auth/login', req.url))
      }

      // Check if token needs refresh (this will be handled by NextAuth automatically)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0)
      if (tokenAge > 3600) { // 1 hour
        console.log('Token needs refresh for user:', token.id)
      }

      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes are always authorized
        const publicRoutes = [
          '/',
          '/auth/login',
          '/auth/register',
          '/auth/error',
        ]

        if (publicRoutes.includes(pathname)) {
          return true
        }

        // Protected routes require a valid token
        return !!token
      }
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export async function middleware(request: NextRequest) {
  // Apply rate limiting first
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) {
    // Apply security headers even to rate limited responses
    return applySecurityHeaders(request, rateLimitResponse)
  }

  // Create response and apply security headers
  const response = NextResponse.next()
  return applySecurityHeaders(request, response)
} 