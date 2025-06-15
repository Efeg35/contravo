import { redisCache } from './redis-cache';
export interface RateLimitRule {
  id: string;
  name: string;
  strategy: RateLimitStrategy;
  windowSize: number; // seconds
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: RateLimitRequest) => string;
  onLimitReached?: (key: string, request: RateLimitRequest) => void;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export enum RateLimitStrategy {
  FIXED_WINDOW = 'FIXED_WINDOW',
  SLIDING_WINDOW = 'SLIDING_WINDOW',
  TOKEN_BUCKET = 'TOKEN_BUCKET',
  LEAKY_BUCKET = 'LEAKY_BUCKET'
}

export interface RateLimitRequest {
  ip: string;
  userId?: string;
  apiKey?: string;
  endpoint: string;
  method: string;
  userAgent: string;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number; // seconds
  strategy: RateLimitStrategy;
  rule: string;
  key: string;
  metadata: {
    currentCount: number;
    windowStart: Date;
    windowEnd: Date;
    bucketLevel?: number; // For token/leaky bucket
  };
}

export interface RateLimitConfig {
  defaultRules: RateLimitRule[];
  globalLimits: {
    perIP: { windowSize: number; maxRequests: number };
    perUser: { windowSize: number; maxRequests: number };
    perAPIKey: { windowSize: number; maxRequests: number };
  };
  whitelist: {
    ips: string[];
    userIds: string[];
    apiKeys: string[];
  };
  blacklist: {
    ips: string[];
    userIds: string[];
    patterns: string[]; // Regex patterns for user agents, etc.
  };
  monitoring: {
    alertThreshold: number; // Percentage of limit
    logViolations: boolean;
    trackPatterns: boolean;
  };
}

export class RateLimiter {
  private static instance: RateLimiter;
  private config: RateLimitConfig;
  private rules: Map<string, RateLimitRule> = new Map();
  private violations: Map<string, ViolationRecord[]> = new Map();
  private patterns: Map<string, PatternAnalysis> = new Map();

  // Rate limiting constants
  private readonly REDIS_KEY_PREFIX = 'rate_limit:';
  private readonly VIOLATION_TTL = 24 * 60 * 60; // 24 hours
  private readonly PATTERN_ANALYSIS_WINDOW = 60 * 60; // 1 hour
  private readonly MAX_VIOLATIONS_PER_KEY = 1000;

  private constructor(config: RateLimitConfig) {
    this.config = config;
    this.initializeDefaultRules();
    this.startViolationCleanup();
    this.startPatternAnalysis();
  }

  static getInstance(config?: RateLimitConfig): RateLimiter {
    if (!RateLimiter.instance) {
      if (!config) {
        throw new Error('Rate limiter configuration required for first initialization');
      }
      RateLimiter.instance = new RateLimiter(config);
    }
    return RateLimiter.instance;
  }

  // Main rate limiting method
  async checkLimit(
    request: RateLimitRequest,
    ruleIds?: string[]
  ): Promise<RateLimitResult[]> {
    const startTime = Date.now();
    const results: RateLimitResult[] = [];

    try {
      // Check whitelist first
      if (this.isWhitelisted(request)) {
        return [{
          allowed: true,
          limit: Infinity,
          remaining: Infinity,
          resetTime: new Date(Date.now() + 3600000),
          strategy: RateLimitStrategy.FIXED_WINDOW,
          rule: 'whitelist',
          key: 'whitelisted',
          metadata: {
            currentCount: 0,
            windowStart: new Date(),
            windowEnd: new Date(Date.now() + 3600000)
          }
        }];
      }

      // Check blacklist
      if (this.isBlacklisted(request)) {
        return [{
          allowed: false,
          limit: 0,
          remaining: 0,
          resetTime: new Date(Date.now() + 86400000), // 24 hours
          retryAfter: 86400,
          strategy: RateLimitStrategy.FIXED_WINDOW,
          rule: 'blacklist',
          key: 'blacklisted',
          metadata: {
            currentCount: Infinity,
            windowStart: new Date(),
            windowEnd: new Date(Date.now() + 86400000)
          }
        }];
      }

      // Get applicable rules
      const applicableRules = this.getApplicableRules(request, ruleIds);

      // Check each rule
      for (const rule of applicableRules) {
        if (!rule.enabled) continue;

        const key = this.generateKey(request, rule);
        const result = await this.checkRule(request, rule, key);
        results.push(result);

        // Track violations
        if (!result.allowed) {
          this.trackViolation(key, request, rule);
        }

        // If any rule blocks, stop checking (fail fast)
        if (!result.allowed && rule.priority === 'critical') {
          break;
        }
      }

      // Update patterns
      if (this.config.monitoring.trackPatterns) {
        this.updatePatterns(request, results);
      }

      const executionTime = Date.now() - startTime;
      console.log(`🚦 Rate limit check completed in ${executionTime}ms for ${request.ip}`);

      return results;

    } catch (error) {
      console.error('❌ Rate limit check error:');
      // Fail open - allow request if rate limiter fails
      return [{
        allowed: true,
        limit: 1000,
        remaining: 999,
        resetTime: new Date(Date.now() + 3600000),
        strategy: RateLimitStrategy.FIXED_WINDOW,
        rule: 'fallback',
        key: 'error_fallback',
        metadata: {
          currentCount: 0,
          windowStart: new Date(),
          windowEnd: new Date(Date.now() + 3600000)
        }
      }];
    }
  }

  // Check individual rule
  private async checkRule(
    request: RateLimitRequest,
    rule: RateLimitRule,
    key: string
  ): Promise<RateLimitResult> {
    switch (rule.strategy) {
      case RateLimitStrategy.FIXED_WINDOW:
        return this.checkFixedWindow(request, rule, key);
      case RateLimitStrategy.SLIDING_WINDOW:
        return this.checkSlidingWindow(request, rule, key);
      case RateLimitStrategy.TOKEN_BUCKET:
        return this.checkTokenBucket(request, rule, key);
      case RateLimitStrategy.LEAKY_BUCKET:
        return this.checkLeakyBucket(request, rule, key);
      default:
        throw new Error(`Unknown rate limit strategy: ${rule.strategy}`);
    }
  }

  // Fixed window strategy
  private async checkFixedWindow(
    request: RateLimitRequest,
    rule: RateLimitRule,
    key: string
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = Math.floor(now / (rule.windowSize * 1000)) * rule.windowSize * 1000;
    const windowEnd = windowStart + rule.windowSize * 1000;
    const windowKey = `${key}:${windowStart}`;

    // Get current count
    const currentCountStr = await redisCache.get<string>(windowKey);
    const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

    // Check if request should be counted
    const shouldCount = this.shouldCountRequest(request, rule);
    const newCount = shouldCount ? currentCount + 1 : currentCount;

    // Check limit
    const allowed = newCount <= rule.maxRequests;

    // Update count if allowed and should count
    if (allowed && shouldCount) {
      await redisCache.set(windowKey, newCount.toString(), { ttl: rule.windowSize });
    }

    return {
      allowed,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - newCount),
      resetTime: new Date(windowEnd),
      strategy: rule.strategy,
      rule: rule.id,
      key,
      metadata: {
        currentCount: newCount,
        windowStart: new Date(windowStart),
        windowEnd: new Date(windowEnd)
      }
    };
  }

  // Sliding window strategy
  private async checkSlidingWindow(
    request: RateLimitRequest,
    rule: RateLimitRule,
    key: string
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - rule.windowSize * 1000;
    const scoreKey = `${key}:sliding`;

    // Remove old entries
    await this.removeOldEntries(scoreKey, windowStart);

    // Get current count
    const currentCount = await this.getSlidingWindowCount(scoreKey, windowStart, now);

    // Check if request should be counted
    const shouldCount = this.shouldCountRequest(request, rule);
    const newCount = shouldCount ? currentCount + 1 : currentCount;

    // Check limit
    const allowed = newCount <= rule.maxRequests;

    // Add current request if allowed and should count
    if (allowed && shouldCount) {
      await this.addSlidingWindowEntry(scoreKey, now, rule.windowSize);
    }

    return {
      allowed,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - newCount),
      resetTime: new Date(now + rule.windowSize * 1000),
      strategy: rule.strategy,
      rule: rule.id,
      key,
      metadata: {
        currentCount: newCount,
        windowStart: new Date(windowStart),
        windowEnd: new Date(now + rule.windowSize * 1000)
      }
    };
  }

  // Token bucket strategy
  private async checkTokenBucket(
    request: RateLimitRequest,
    rule: RateLimitRule,
    key: string
  ): Promise<RateLimitResult> {
    const bucketKey = `${key}:bucket`;
    const bucket = await this.getTokenBucket(bucketKey, rule);

    // Refill tokens
    const now = Date.now();
    const timePassed = (now - bucket.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * (rule.maxRequests / rule.windowSize));
    bucket.tokens = Math.min(rule.maxRequests, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    // Check if request should consume tokens
    const shouldConsume = this.shouldCountRequest(request, rule);
    const tokensNeeded = shouldConsume ? 1 : 0;

    // Check if tokens available
    const allowed = bucket.tokens >= tokensNeeded;

    // Consume token if allowed and needed
    if (allowed && shouldConsume) {
      bucket.tokens -= tokensNeeded;
    }

    // Save bucket state
    await redisCache.set(bucketKey, JSON.stringify(bucket), { ttl: rule.windowSize * 2 });

    return {
      allowed,
      limit: rule.maxRequests,
      remaining: bucket.tokens,
      resetTime: new Date(now + ((rule.maxRequests - bucket.tokens) / (rule.maxRequests / rule.windowSize)) * 1000),
      strategy: rule.strategy,
      rule: rule.id,
      key,
      metadata: {
        currentCount: rule.maxRequests - bucket.tokens,
        windowStart: new Date(bucket.lastRefill),
        windowEnd: new Date(now + rule.windowSize * 1000),
        bucketLevel: bucket.tokens
      }
    };
  }

  // Leaky bucket strategy
  private async checkLeakyBucket(
    request: RateLimitRequest,
    rule: RateLimitRule,
    key: string
  ): Promise<RateLimitResult> {
    const bucketKey = `${key}:leaky`;
    const bucket = await this.getLeakyBucket(bucketKey, rule);

    // Leak requests
    const now = Date.now();
    const timePassed = (now - bucket.lastLeak) / 1000;
    const requestsToLeak = Math.floor(timePassed * (rule.maxRequests / rule.windowSize));
    bucket.level = Math.max(0, bucket.level - requestsToLeak);
    bucket.lastLeak = now;

    // Check if request should be added
    const shouldAdd = this.shouldCountRequest(request, rule);
    const newLevel = shouldAdd ? bucket.level + 1 : bucket.level;

    // Check if bucket would overflow
    const allowed = newLevel <= rule.maxRequests;

    // Add request if allowed and should add
    if (allowed && shouldAdd) {
      bucket.level = newLevel;
    }

    // Save bucket state
    await redisCache.set(bucketKey, JSON.stringify(bucket), { ttl: rule.windowSize * 2 });

    return {
      allowed,
      limit: rule.maxRequests,
      remaining: Math.max(0, rule.maxRequests - bucket.level),
      resetTime: new Date(now + (bucket.level / (rule.maxRequests / rule.windowSize)) * 1000),
      strategy: rule.strategy,
      rule: rule.id,
      key,
      metadata: {
        currentCount: bucket.level,
        windowStart: new Date(bucket.lastLeak),
        windowEnd: new Date(now + rule.windowSize * 1000),
        bucketLevel: bucket.level
      }
    };
  }

  // Generate cache key for rate limiting
  private generateKey(request: RateLimitRequest, rule: RateLimitRule): string {
    if (rule.keyGenerator) {
      return `${this.REDIS_KEY_PREFIX}${rule.keyGenerator(request)}`;
    }

    // Default key generation
    const parts = [`rule:${rule.id}`];
    
    if (request.apiKey) {
      parts.push(`api:${request.apiKey}`);
    } else if (request.userId) {
      parts.push(`user:${request.userId}`);
    } else {
      parts.push(`ip:${request.ip}`);
    }
    
    parts.push(`endpoint:${request.endpoint}`);
    
    return `${this.REDIS_KEY_PREFIX}${parts.join(':')}`;
  }

  // Check if request should be counted based on rule settings
  private shouldCountRequest(request: RateLimitRequest, rule: RateLimitRule): boolean {
    if (rule.skipSuccessfulRequests && request.success) {
      return false;
    }
    if (rule.skipFailedRequests && !request.success) {
      return false;
    }
    return true;
  }

  // Whitelist check
  private isWhitelisted(request: RateLimitRequest): boolean {
    if (this.config.whitelist.ips.includes(request.ip)) return true;
    if (request.userId && this.config.whitelist.userIds.includes(request.userId)) return true;
    if (request.apiKey && this.config.whitelist.apiKeys.includes(request.apiKey)) return true;
    return false;
  }

  // Blacklist check
  private isBlacklisted(request: RateLimitRequest): boolean {
    if (this.config.blacklist.ips.includes(request.ip)) return true;
    if (request.userId && this.config.blacklist.userIds.includes(request.userId)) return true;
    
    // Check patterns
    for (const pattern of this.config.blacklist.patterns) {
      const regex = new RegExp(pattern);
      if (regex.test(request.userAgent) || regex.test(request.ip)) {
        return true;
      }
    }
    
    return false;
  }

  // Get applicable rules for request
  private getApplicableRules(request: RateLimitRequest, ruleIds?: string[]): RateLimitRule[] {
    if (ruleIds) {
      return ruleIds.map(id => this.rules.get(id)).filter(Boolean) as RateLimitRule[];
    }

    // Return all enabled rules sorted by priority
    return Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });
  }

  // Helper methods for different strategies
  private async removeOldEntries(key: string, windowStart: number): Promise<void> {
    // Mock implementation - in production use Redis ZREMRANGEBYSCORE
    console.log(`Removing old entries from ${key} before ${windowStart}`);
  }

  private async getSlidingWindowCount(_key: string, _start: number, _end: number): Promise<number> {
    // Mock implementation - in production use Redis ZCOUNT
    return Math.floor(Math.random() * 10);
  }

  private async addSlidingWindowEntry(key: string, timestamp: number, ttl: number): Promise<void> {
    // Mock implementation - in production use Redis ZADD with TTL
    console.log(`Adding sliding window entry ${timestamp} to ${key} with TTL ${ttl}`);
  }

  private async getTokenBucket(key: string, rule: RateLimitRule): Promise<{
    tokens: number;
    lastRefill: number;
  }> {
    const bucketStr = await redisCache.get<string>(key);
    if (bucketStr) {
      return JSON.parse(bucketStr);
    }
    
    // Initialize new bucket
    return {
      tokens: rule.maxRequests,
      lastRefill: Date.now()
    };
  }

  private async getLeakyBucket(key: string, _rule: RateLimitRule): Promise<{
    level: number;
    lastLeak: number;
  }> {
    const bucketStr = await redisCache.get<string>(key);
    if (bucketStr) {
      return JSON.parse(bucketStr);
    }
    
    // Initialize new bucket
    return {
      level: 0,
      lastLeak: Date.now()
    };
  }

  // Rule management
  async addRule(rule: RateLimitRule): Promise<void> {
    this.rules.set(rule.id, rule);
    console.log(`📋 Rate limit rule added: ${rule.name} (${rule.strategy})`);
  }

  async updateRule(ruleId: string, updates: Partial<RateLimitRule>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updatedRule = { ...rule, ...updates, updatedAt: new Date() };
    this.rules.set(ruleId, updatedRule);
    
    console.log(`📝 Rate limit rule updated: ${ruleId}`);
    return true;
  }

  async removeRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ Rate limit rule removed: ${ruleId}`);
    }
    return deleted;
  }

  // Violation tracking
  private trackViolation(key: string, request: RateLimitRequest, rule: RateLimitRule): void {
    const violation: ViolationRecord = {
      id: this.generateViolationId(),
      key,
      rule: rule.id,
      request,
      timestamp: new Date(),
      severity: this.calculateViolationSeverity(request, rule)
    };

    if (!this.violations.has(key)) {
      this.violations.set(key, []);
    }

    const keyViolations = this.violations.get(key)!;
    keyViolations.push(violation);

    // Keep only recent violations
    if (keyViolations.length > this.MAX_VIOLATIONS_PER_KEY) {
      keyViolations.shift();
    }

    // Log violation if enabled
    if (this.config.monitoring.logViolations) {
      console.warn(`🚨 Rate limit violation: ${key} exceeded rule ${rule.name}`);
    }

    // Trigger alert if threshold exceeded
    const recentViolations = keyViolations.filter(
      v => Date.now() - v.timestamp.getTime() < 60000 // Last minute
    );
    
    if (recentViolations.length >= this.config.monitoring.alertThreshold) {
      this.triggerAlert(key, rule, recentViolations);
    }
  }

  private calculateViolationSeverity(request: RateLimitRequest, rule: RateLimitRule): 'low' | 'medium' | 'high' | 'critical' {
    // Base severity on rule priority and request pattern
    if (rule.priority === 'critical') return 'critical';
    if (rule.priority === 'high') return 'high';
    
    // Check for suspicious patterns
    const recentViolations = this.violations.get(this.generateKey(request, rule)) || [];
    const recentCount = recentViolations.filter(
      v => Date.now() - v.timestamp.getTime() < 300000 // Last 5 minutes
    ).length;
    
    if (recentCount > 10) return 'high';
    if (recentCount > 5) return 'medium';
    return 'low';
  }

  private triggerAlert(key: string, rule: RateLimitRule, violations: ViolationRecord[]): void {
    console.error(`🚨 RATE LIMIT ALERT: ${violations.length} violations for ${key} in last minute`);
    // In production, this would send alerts to monitoring systems
  }

  // Pattern analysis
  private updatePatterns(request: RateLimitRequest, results: RateLimitResult[]): void {
    const patternKey = `${request.ip}:${request.endpoint}`;
    
    if (!this.patterns.has(patternKey)) {
      this.patterns.set(patternKey, {
        key: patternKey,
        requestCount: 0,
        violationCount: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        averageInterval: 0,
        suspiciousScore: 0
      });
    }

    const pattern = this.patterns.get(patternKey)!;
    pattern.requestCount++;
    pattern.lastSeen = new Date();
    
    const violationCount = results.filter(r => !r.allowed).length;
    if (violationCount > 0) {
      pattern.violationCount += violationCount;
    }

    // Calculate suspicious score
    pattern.suspiciousScore = this.calculateSuspiciousScore(pattern);
  }

  private calculateSuspiciousScore(pattern: PatternAnalysis): number {
    const violationRate = pattern.violationCount / pattern.requestCount;
    const timeSpan = pattern.lastSeen.getTime() - pattern.firstSeen.getTime();
    const requestRate = pattern.requestCount / (timeSpan / 1000);
    
    let score = 0;
    
    // High violation rate is suspicious
    if (violationRate > 0.5) score += 30;
    else if (violationRate > 0.2) score += 15;
    
    // Very high request rate is suspicious
    if (requestRate > 100) score += 40; // More than 100 req/sec
    else if (requestRate > 50) score += 20;
    
    // Consistent pattern over time
    if (timeSpan > 3600000 && pattern.requestCount > 1000) score += 20;
    
    return Math.min(100, score);
  }

  // Statistics and monitoring
  getStatistics(): {
    totalRequests: number;
    totalViolations: number;
    topViolators: Array<{ key: string; violations: number }>;
    ruleEffectiveness: Array<{ rule: string; violations: number; requests: number }>;
    suspiciousPatterns: PatternAnalysis[];
  } {
    let totalViolations = 0;
    const violatorCounts = new Map<string, number>();
    
    for (const [key, violations] of this.violations) {
      totalViolations += violations.length;
      violatorCounts.set(key, violations.length);
    }

    const topViolators = Array.from(violatorCounts.entries())
      .map(([key, violations]) => ({ key, violations }))
      .sort((a, b) => b.violations - a.violations)
      .slice(0, 10);

    const suspiciousPatterns = Array.from(this.patterns.values())
      .filter(p => p.suspiciousScore > 50)
      .sort((a, b) => b.suspiciousScore - a.suspiciousScore);

    return {
      totalRequests: Array.from(this.patterns.values()).reduce((sum, p) => sum + p.requestCount, 0),
      totalViolations,
      topViolators,
      ruleEffectiveness: [], // Would be calculated from stored metrics
      suspiciousPatterns
    };
  }

  // Cleanup methods
  private startViolationCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.VIOLATION_TTL * 1000;
      
      for (const [key, violations] of this.violations) {
        const filtered = violations.filter(v => v.timestamp.getTime() > cutoff);
        if (filtered.length === 0) {
          this.violations.delete(key);
        } else {
          this.violations.set(key, filtered);
        }
      }
    }, 60000); // Run every minute
  }

  private startPatternAnalysis(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.PATTERN_ANALYSIS_WINDOW * 1000;
      
      for (const [key, pattern] of this.patterns) {
        if (pattern.lastSeen.getTime() < cutoff) {
          this.patterns.delete(key);
        }
      }
    }, 300000); // Run every 5 minutes
  }

  private initializeDefaultRules(): void {
    // Add default rules from config
    for (const rule of this.config.defaultRules) {
      this.rules.set(rule.id, rule);
    }

    // Add global rules
    const globalRules: RateLimitRule[] = [
      {
        id: 'global_ip_limit',
        name: 'Global IP Rate Limit',
        strategy: RateLimitStrategy.FIXED_WINDOW,
        windowSize: this.config.globalLimits.perIP.windowSize,
        maxRequests: this.config.globalLimits.perIP.maxRequests,
        priority: 'high',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'global_user_limit',
        name: 'Global User Rate Limit',
        strategy: RateLimitStrategy.FIXED_WINDOW,
        windowSize: this.config.globalLimits.perUser.windowSize,
        maxRequests: this.config.globalLimits.perUser.maxRequests,
        priority: 'medium',
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const rule of globalRules) {
      this.rules.set(rule.id, rule);
    }

    console.log(`🚦 Initialized ${this.rules.size} rate limiting rules`);
  }

  // Utility methods
  private generateViolationId(): string {
    return `violation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }


}

// Supporting interfaces
interface ViolationRecord {
  id: string;
  key: string;
  rule: string;
  request: RateLimitRequest;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PatternAnalysis {
  key: string;
  requestCount: number;
  violationCount: number;
  firstSeen: Date;
  lastSeen: Date;
  averageInterval: number;
  suspiciousScore: number; // 0-100
}

// Default configuration
export const defaultRateLimitConfig: RateLimitConfig = {
  defaultRules: [],
  globalLimits: {
    perIP: { windowSize: 3600, maxRequests: 1000 }, // 1000 req/hour per IP
    perUser: { windowSize: 3600, maxRequests: 5000 }, // 5000 req/hour per user
    perAPIKey: { windowSize: 3600, maxRequests: 10000 } // 10000 req/hour per API key
  },
  whitelist: {
    ips: ['127.0.0.1', '::1'],
    userIds: [],
    apiKeys: []
  },
  blacklist: {
    ips: [],
    userIds: [],
    patterns: [
      '.*bot.*',
      '.*crawler.*',
      '.*spider.*'
    ]
  },
  monitoring: {
    alertThreshold: 5, // Alert after 5 violations in 1 minute
    logViolations: true,
    trackPatterns: true
  }
};

// Export singleton instance
export const rateLimiter = RateLimiter.getInstance(defaultRateLimitConfig);

// Helper functions
export async function checkRateLimit(
  request: RateLimitRequest,
  ruleIds?: string[]
): Promise<RateLimitResult[]> {
  return rateLimiter.checkLimit(request, ruleIds);
}

export function addRateLimitRule(rule: RateLimitRule): Promise<void> {
  return rateLimiter.addRule(rule);
}

export function getRateLimitStats() {
  return rateLimiter.getStatistics();
} 