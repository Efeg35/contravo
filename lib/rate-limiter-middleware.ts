import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, RateLimitRequest, RateLimitResult } from './rate-limiter';
export interface RateLimiterMiddlewareConfig {
  enabled: boolean;
  skipPaths: string[];
  skipMethods: string[];
  customRules: Record<string, string[]>; // path pattern -> rule IDs
  headerPrefix: string;
  blockOnFailure: boolean;
  logViolations: boolean;
}

export class RateLimiterMiddleware {
  private config: RateLimiterMiddlewareConfig;

  constructor(config: RateLimiterMiddlewareConfig) {
    this.config = config;
  }

  async handleRequest(request: NextRequest): Promise<NextResponse | null> {
    // Skip if disabled
    if (!this.config.enabled) {
      return null;
    }

    const { pathname } = request.nextUrl;
    const method = request.method;

    // Skip certain paths
    if (this.shouldSkip(pathname, method)) {
      return null;
    }

    try {
      // Extract request information
      const rateLimitRequest = this.extractRequestInfo(request);

      // Get applicable rules for this path
      const ruleIds = this.getRulesForPath(pathname);

      // Check rate limit
      const results = await checkRateLimit(rateLimitRequest, ruleIds);

      // Add rate limit headers to response
      const response = NextResponse.next();
      this.addRateLimitHeaders(response, results);

      // Check if any rule blocks the request
      const blockingResult = results.find(r => !r.allowed);
      
      if (blockingResult) {
        if (this.config.logViolations) {
          console.warn(`🚨 Rate limit exceeded: ${rateLimitRequest.ip} on ${pathname}`);
        }

        if (this.config.blockOnFailure) {
          return new NextResponse(
            JSON.stringify({
              error: 'Rate limit exceeded',
              message: `Too many requests. Limit: ${blockingResult.limit} requests per ${this.getWindowDescription(blockingResult)}`,
              retryAfter: blockingResult.retryAfter,
              resetTime: blockingResult.resetTime.toISOString()
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': blockingResult.retryAfter?.toString() || '60',
                ...this.getRateLimitHeaders(results)
              }
            }
          );
        }
      }

      return response;

    } catch {
      console.error('❌ Rate limiter middleware error:');
      
      // Fail open - allow request if middleware fails
      if (this.config.blockOnFailure) {
        const response = NextResponse.next();
        response.headers.set(`${this.config.headerPrefix}-Error`, 'middleware-failure');
        return response;
      }
      
      return null;
    }
  }

  private extractRequestInfo(request: NextRequest): RateLimitRequest {
    const ip = this.getClientIP(request);
    const userAgent = (request as any).headers.get('user-agent') || 'unknown';
    const userId = (request as any).headers.get('x-user-id') || undefined;
    const apiKey = (request as any).headers.get('x-api-key') || 
                   (request as any).headers.get('authorization')?.replace('Bearer ', '') || 
                   undefined;

    return {
      ip,
      userId,
      apiKey,
      endpoint: request.nextUrl.pathname,
      method: request.method,
      userAgent,
      success: true, // Will be updated after response
      timestamp: new Date(),
      metadata: {
        referer: (request as any).headers.get('referer'),
        origin: (request as any).headers.get('origin'),
        acceptLanguage: (request as any).headers.get('accept-language'),
        contentLength: (request as any).headers.get('content-length')
      }
    };
  }

  private getClientIP(request: NextRequest): string {
    // Try different headers to get real IP
    const forwarded = (request as any).headers.get('x-forwarded-for');
    const realIP = (request as any).headers.get('x-real-ip');
    const cfConnectingIP = (request as any).headers.get('cf-connecting-ip');
    
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, get the first one
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) return realIP;
    if (cfConnectingIP) return cfConnectingIP;
    
    // Fallback to default localhost IP
    return '127.0.0.1';
  }

  private shouldSkip(pathname: string, method: string): boolean {
    // Skip certain methods
    if (this.config.skipMethods.includes(method)) {
      return true;
    }

    // Skip certain paths
    for (const skipPath of this.config.skipPaths) {
      if (this.matchesPattern(pathname, skipPath)) {
        return true;
      }
    }

    return false;
  }

  private matchesPattern(path: string, pattern: string): boolean {
    // Simple pattern matching (could be enhanced with regex)
    if (pattern.endsWith('*')) {
      return path.startsWith(pattern.slice(0, -1));
    }
    return path === pattern;
  }

  private getRulesForPath(pathname: string): string[] | undefined {
    // Check custom rules for specific paths
    for (const [pattern, ruleIds] of Object.entries(this.config.customRules)) {
      if (this.matchesPattern(pathname, pattern)) {
        return ruleIds;
      }
    }
    
    return undefined; // Use default rules
  }

  private addRateLimitHeaders(response: NextResponse, results: RateLimitResult[]): void {
    const headers = this.getRateLimitHeaders(results);
    
    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  private getRateLimitHeaders(results: RateLimitResult[]): Record<string, string> {
    const headers: Record<string, string> = {};
    const prefix = this.config.headerPrefix;

    if (results.length === 0) return headers;

    // Use the most restrictive result for headers
    const primaryResult = results.reduce((most, current) => 
      current.remaining < most.remaining ? current : most
    );

    headers[`${prefix}-Limit`] = primaryResult.limit.toString();
    headers[`${prefix}-Remaining`] = primaryResult.remaining.toString();
    headers[`${prefix}-Reset`] = Math.ceil(primaryResult.resetTime.getTime() / 1000).toString();
    headers[`${prefix}-Strategy`] = primaryResult.strategy;
    
    if (primaryResult.retryAfter) {
      headers[`${prefix}-Retry-After`] = primaryResult.retryAfter.toString();
    }

    // Add multiple rules info if present
    if (results.length > 1) {
      headers[`${prefix}-Rules-Count`] = results.length.toString();
      headers[`${prefix}-Rules`] = results.map(r => r.rule).join(',');
    }

    return headers;
  }

  private getWindowDescription(result: RateLimitResult): string {
    const windowMs = result.metadata.windowEnd.getTime() - result.metadata.windowStart.getTime();
    const windowSec = Math.floor(windowMs / 1000);
    
    if (windowSec < 60) return `${windowSec} seconds`;
    if (windowSec < 3600) return `${Math.floor(windowSec / 60)} minutes`;
    return `${Math.floor(windowSec / 3600)} hours`;
  }
}

// Default middleware configuration
export const defaultRateLimiterConfig: RateLimiterMiddlewareConfig = {
  enabled: true,
  skipPaths: [
    '/api/auth/*',
    '/api/health',
    '/api/status',
    '/_next/*',
    '/favicon.ico',
    '/robots.txt'
  ],
  skipMethods: ['OPTIONS', 'HEAD'],
  customRules: {
    '/api/auth/login': ['auth_login_limit'],
    '/api/auth/register': ['auth_register_limit'],
    '/api/search/*': ['search_api_limit'],
    '/api/files/upload': ['file_upload_limit']
  },
  headerPrefix: 'X-RateLimit',
  blockOnFailure: true,
  logViolations: true
};

// Create middleware instance
export const rateLimiterMiddleware = new RateLimiterMiddleware(defaultRateLimiterConfig);

// Export middleware function for use in middleware.ts
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  return rateLimiterMiddleware.handleRequest(request);
} 