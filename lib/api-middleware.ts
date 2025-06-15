import { NextRequest, NextResponse } from 'next/server';
import { setGlobalTenantContext } from './tenant-context';

// API middleware to set tenant context for all requests
export async function withTenantContext(
  request: NextRequest,
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  try {
    // Get session from cookies or headers
    const session = await getSessionFromRequest(request);
    
    if (session?.user?.id) {
      // Set global tenant context for this request
      setGlobalTenantContext({
        userId: session.user.id,
        companyId: session.user.companyId || undefined,
        isAdmin: session.user.role === 'ADMIN'
      });
    } else {
      // Clear context for unauthenticated requests
      setGlobalTenantContext(null);
    }

    // Execute the handler
    const response = await handler(request);
    
    // Clear context after request
    setGlobalTenantContext(null);
    
    return response;
  } catch (error) {
    console.error('API middleware error:', error);
    // Clear context on error
    setGlobalTenantContext(null);
    
    // Continue with the request even if context setting fails
    return await handler(request);
  }
}

// Helper function to extract session from request
async function getSessionFromRequest(request: NextRequest) {
  try {
    // For now, we'll use a simple approach
    // In a real app, this would integrate with your auth system
    
    // Check for user ID in headers (for testing)
    const userId = request.headers.get('x-user-id');
    const companyId = request.headers.get('x-company-id');
    const isAdmin = request.headers.get('x-is-admin') === 'true';
    
    if (userId) {
      return {
        user: {
          id: userId,
          companyId: companyId,
          role: isAdmin ? 'ADMIN' : 'USER'
        }
      };
    }
    
    // TODO: Implement proper session extraction from cookies
    // This would typically involve:
    // 1. Extract session token from cookies
    // 2. Validate session token
    // 3. Get user data from session
    
    return null;
  } catch (error) {
    console.error('Error extracting session:', error);
    return null;
  }
}

// Higher-order function to wrap API routes
export function withMultiTenant(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async (req: NextRequest) => {
    return withTenantContext(req, handler);
  };
} 