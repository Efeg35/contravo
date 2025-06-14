import jwt from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
// JWT Token utilities for enhanced management
export class JWTManager {
  private static readonly JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret';
  private static readonly TOKEN_EXPIRY = '24h';
  private static readonly REFRESH_THRESHOLD = 60 * 60; // 1 hour in seconds

  /**
   * Validate JWT token structure and expiry
   */
       
    static validateToken(token: string): { valid: boolean; payload?: any; error?: string } {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET);
      return { valid: true, payload };
    } catch (_error) {
      if (_error instanceof jwt.TokenExpiredError) {
        return { valid: false, error: 'Token expired' };
      } else if (_error instanceof jwt.JsonWebTokenError) {
        return { valid: false, error: 'Invalid token' };
      }
      return { valid: false, error: 'Token validation failed' };
    }
  }

  /**
   * Check if token needs refresh
   */
  static needsRefresh(tokenIssuedAt: number): boolean {
    const now = Math.floor(Date.now() / 1000);
    const tokenAge = now - tokenIssuedAt;
    return tokenAge > this.REFRESH_THRESHOLD;
  }

  /**
   * Get token expiry information
   */
  static getTokenExpiry(tokenExpiresAt: number): {
    isExpired: boolean;
    expiresIn: number;
    expiresInHuman: string;
  } {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = tokenExpiresAt - now;
    const isExpired = expiresIn <= 0;

    let expiresInHuman: string;
    if (isExpired) {
      expiresInHuman = 'Expired';
    } else if (expiresIn < 60) {
      expiresInHuman = `${expiresIn} seconds`;
    } else if (expiresIn < 3600) {
      expiresInHuman = `${Math.floor(expiresIn / 60)} minutes`;
    } else {
      expiresInHuman = `${Math.floor(expiresIn / 3600)} hours`;
    }

    return { isExpired, expiresIn, expiresInHuman };
  }

  /**
   * Create a custom JWT token with additional claims
   */
     
  static createCustomToken(userId: string, additionalClaims: Record<string, unknown> = {}): string {
    const payload = {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 1 day
      ...additionalClaims,
    };

    return jwt.sign(payload, this.JWT_SECRET);
  }

  /**
   * Blacklist a token (store in database for checking)
   */
  static async blacklistToken(tokenId: string, reason: string = 'logout'): Promise<void> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      await prisma.tokenBlacklist.create({
        data: {
          tokenId,
          reason,
        }
      });
      
      await prisma.$disconnect();
    } catch (_error) {
      console.error('Failed to blacklist token:');
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      const blacklistedToken = await prisma.tokenBlacklist.findUnique({
        where: { tokenId }
      });
      
      await prisma.$disconnect();
      return !!blacklistedToken;
    } catch (_error) {
      console.error('Failed to check token blacklist:');
      return false;
    }
  }

  /**
   * Clean up expired blacklisted tokens
   */
  static async cleanupExpiredTokens(): Promise<void> {
    try {
      const { PrismaClient } = await import('@prisma/client');
      const prisma = new PrismaClient();
      
      // Remove tokens older than 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const deleted = await prisma.tokenBlacklist.deleteMany({
        where: {
          createdAt: {
            lt: thirtyDaysAgo
          }
        }
      });
      
      console.log(`Cleaned up ${deleted.count} expired blacklisted tokens`);
      await prisma.$disconnect();
    } catch (_error) {
      console.error('Failed to cleanup expired tokens:');
    }
  }

  /**
   * Get current session with enhanced token information
   */
  static async getEnhancedSession() {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return null;
    }

    const tokenInfo = {
      isValid: true,
      needsRefresh: false,
      expiryInfo: null as { isExpired: boolean; expiresIn: number; expiresInHuman: string } | null,
    };

    if (session.tokenIssuedAt) {
      tokenInfo.needsRefresh = this.needsRefresh(session.tokenIssuedAt);
    }

    if (session.tokenExpiresAt) {
      tokenInfo.expiryInfo = this.getTokenExpiry(session.tokenExpiresAt);
    }

    return {
      ...session,
      tokenInfo,
    };
  }

  /**
   * Validate session and refresh if needed
   */
  static async validateAndRefreshSession() {
    const enhancedSession = await this.getEnhancedSession();
    
    if (!enhancedSession) {
      return { valid: false, session: null, action: 'redirect_to_login' };
    }

    if (enhancedSession.tokenInfo.expiryInfo?.isExpired) {
      return { valid: false, session: null, action: 'redirect_to_login' };
    }

    if (enhancedSession.tokenInfo.needsRefresh) {
      // Token will be refreshed automatically by NextAuth callbacks
      return { valid: true, session: enhancedSession, action: 'refresh_token' };
    }

    return { valid: true, session: enhancedSession, action: 'continue' };
  }
}

/**
 * Middleware helper for JWT validation
 */
export async function validateJWTMiddleware(request: Request): Promise<{
  valid: boolean;
   
  user?: any;
  error?: string;
}> {
  try {
    const authHeader = (request as any).headers.get('authorization');
    
    if (!authHeader?.startsWith('Bearer ')) {
      return { valid: false, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.substring(7);
    const validation = JWTManager.validateToken(token);

    if (!validation.valid) {
      return { valid: false, error: validation.error };
    }

    // Additional validation - check if token is blacklisted
    const tokenPayload = validation.payload as any;
    if (tokenPayload && tokenPayload.jti && await JWTManager.isTokenBlacklisted(tokenPayload.jti)) {
      return { valid: false, error: 'Token has been revoked' };
    }

    return { valid: true, user: tokenPayload };
  } catch (_error) {
    return { valid: false, error: 'Token validation failed' };
  }
}

/**
 * Rate limiting for authentication endpoints
 */
export class AuthRateLimit {
  private static attempts = new Map<string, { count: number; resetTime: number }>();
  private static readonly MAX_ATTEMPTS = 5;
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  static checkAttempt(identifier: string): { allowed: boolean; remainingAttempts: number; resetTime?: Date } {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier);

    if (!userAttempts || now > userAttempts.resetTime) {
      // Reset or create new attempt tracking
      this.attempts.set(identifier, { count: 1, resetTime: now + this.WINDOW_MS });
      return { allowed: true, remainingAttempts: this.MAX_ATTEMPTS - 1 };
    }

    if (userAttempts.count >= this.MAX_ATTEMPTS) {
      return { 
        allowed: false, 
        remainingAttempts: 0, 
        resetTime: new Date(userAttempts.resetTime) 
      };
    }

    userAttempts.count++;
    return { 
      allowed: true, 
      remainingAttempts: this.MAX_ATTEMPTS - userAttempts.count 
    };
  }

  static resetAttempts(identifier: string): void {
    this.attempts.delete(identifier);
  }
} 