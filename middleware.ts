import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import { NextRequest } from 'next/server'
// import { rateLimitMiddleware } from './lib/rate-limiter-middleware'
import { applySecurityHeaders } from './lib/security-headers'

export default withAuth(
  async function middleware(req) {
    // Rate limiting geçici olarak devre dışı
    // const rateLimitResponse = await rateLimitMiddleware(req)
    // if (rateLimitResponse) {
    //   return applySecurityHeaders(req, rateLimitResponse)
    // }

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
      const response = NextResponse.next()
      return applySecurityHeaders(req, response)
    }

    // Handle API routes with JWT validation
    if (apiRoutes && !publicRoutes.includes(pathname)) {
      // Skip auth API routes
      if (pathname.startsWith('/api/auth/')) {
        const response = NextResponse.next()
        return applySecurityHeaders(req, response)
      }

      // For other API routes, validate token
      if (!token) {
        const response = NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
        return applySecurityHeaders(req, response)
      }

      // Enhanced token validation
      if (token.exp && (token.exp as number) < Math.floor(Date.now() / 1000)) {
        const response = NextResponse.json(
          { error: 'Token expired' },
          { status: 401 }
        )
        return applySecurityHeaders(req, response)
      }

      // Add user info to request headers for API routes
      const requestHeaders = new Headers(req.headers)
      requestHeaders.set('x-user-id', token.id as string)
      requestHeaders.set('x-user-role', token.role as string)
      if (token.companyId) {
        requestHeaders.set('x-company-id', token.companyId as string)
      }
      requestHeaders.set('x-is-admin', (token.role === 'ADMIN').toString())

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
      return applySecurityHeaders(req, response)
    }

    // Handle protected dashboard routes
    if (protectedRoutes) {
      if (!token) {
        const response = NextResponse.redirect(new URL('/auth/login', req.url))
        return applySecurityHeaders(req, response)
      }

      // Check token expiry for dashboard routes
      if (token.exp && (token.exp as number) < Math.floor(Date.now() / 1000)) {
        const response = NextResponse.redirect(new URL('/auth/login', req.url))
        return applySecurityHeaders(req, response)
      }

      // Check if token needs refresh (this will be handled by NextAuth automatically)
      const tokenAge = Math.floor(Date.now() / 1000) - (token.iat as number || 0)
      if (tokenAge > 3600) { // 1 hour
        console.log('Token needs refresh for user:', token.id)
      }

      const response = NextResponse.next()
      return applySecurityHeaders(req, response)
    }

    const response = NextResponse.next()
    return applySecurityHeaders(req, response)
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