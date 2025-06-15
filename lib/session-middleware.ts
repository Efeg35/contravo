import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from './session-manager';

export class SessionMiddleware {
  /**
   * Enhanced session middleware that integrates with our custom session tracking
   */
  static async handleRequest(request: NextRequest, response: NextResponse): Promise<NextResponse> {
    try {
      const sessionId = (request as any).headers.get('x-session-id');
      const userId = (request as any).headers.get('x-user-id');
      
      // If we have a session ID and user ID, update activity
      if (sessionId && userId) {
        await SessionManager.updateActivity();
        
        // Add session info to response headers for debugging
        response.headers.set('x-session-activity-updated', 'true');
      }

      // Check for suspicious activity patterns
      if (userId && Math.random() < 0.01) { // 1% chance to check
        const security = await SessionManager.checkSuspiciousActivity();
        if (security.suspiciousLogins || security.multipleLocations || security.unusualDevices) {
          console.log(`Suspicious activity detected for user ${userId}:`, security);
          // In production, you might want to add security headers or trigger alerts
          response.headers.set('x-security-alert', 'true');
        }
      }

      return response;
    } catch (error) {
      console.error('Session middleware error:');
      return response;
    }
  }

  /**
   * Session cleanup middleware for API routes
   */
  static async performCleanup(): Promise<void> {
    try {
      const cleaned = await SessionManager.cleanupExpiredSessions();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} expired sessions`);
      }
    } catch (error) {
      console.error('Session cleanup error:');
    }
  }

  /**
   * Extract session information from NextAuth token
   */
   
  static extractSessionInfo(token: any): { sessionId?: string; userId?: string } {
    return {
      sessionId: token && (token as any).sessionId,
      userId: token && (token as any).id || token && (token as any).sub,
    };
  }

  /**
   * Create session tracking on login
   */
  static async createSessionOnLogin(userId: string, deviceInfo: { userAgent: string; ip: string; device: string; browser: string; os: string }): Promise<string> {
    try {
      const session = await SessionManager.createSession(userId, deviceInfo);
      return session.id;
    } catch (error) {
      console.error('❌ Session creation error:', error);
      throw error;
    }
  }

  /**
   * Invalidate session on logout
   */
  static async invalidateSessionOnLogout(): Promise<void> {
    try {
      await SessionManager.invalidateSession();
    } catch (error) {
      console.error('Failed to invalidate session on logout:');
    }
  }
}

// Auto-cleanup service
export function startSessionCleanupService(): void {
  // Run cleanup every hour
  const cleanup = async () => {
    await SessionMiddleware.performCleanup();
  };

  // Initial cleanup
  setTimeout(cleanup, 10000); // 10 seconds after startup

  // Recurring cleanup
  setInterval(cleanup, 60 * 60 * 1000); // Every hour

  console.log('Session cleanup service started');
}

// Session security helpers
export const SessionSecurity = {
  /**
   * Check if session needs security verification
   */
  async needsSecurityCheck(): Promise<boolean> {
    const security = await SessionManager.checkSuspiciousActivity();
    return security.suspiciousLogins || security.multipleLocations || security.unusualDevices;
  },

  /**
   * Get security recommendations for a user
   */
  async getSecurityRecommendations(): Promise<string[]> {
    const security = await SessionManager.checkSuspiciousActivity();
    return security.recommendations;
  },

  /**
   * Force password reset for suspicious activity
   */
  async shouldForcePasswordReset(): Promise<boolean> {
    const security = await SessionManager.checkSuspiciousActivity();
    // Force password reset if multiple security flags are triggered
    const flagCount = [
      security.suspiciousLogins,
      security.multipleLocations,
      security.unusualDevices
    ].filter(Boolean).length;
    
    return flagCount >= 2;
  }
}; 