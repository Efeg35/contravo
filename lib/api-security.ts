import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { redisCache } from './redis-cache';
import { auditLogger, AuditLevel, AuditCategory } from './audit-logger';


// API Security interfaces
export interface APISecurityConfig {
  versioning: APIVersioningConfig;
  requestSigning: RequestSigningConfig;
  ipControl: IPControlConfig;
  geolocation: GeolocationConfig;
  deprecation: DeprecationConfig;
  throttling: ThrottlingConfig;
  enabled: boolean;
}

export interface APIVersioningConfig {
  enabled: boolean;
  strategy: 'header' | 'path' | 'query';
  currentVersion: string;
  supportedVersions: string[];
  defaultVersion: string;
  deprecationWarnings: boolean;
}

export interface RequestSigningConfig {
  enabled: boolean;
  algorithm: 'HMAC-SHA256' | 'HMAC-SHA512';
  secretKey: string;
  timestampTolerance: number; // seconds
  includeBody: boolean;
  includeHeaders: string[];
  nonceRequired: boolean;
}

export interface IPControlConfig {
  enabled: boolean;
  whitelist: IPWhitelistEntry[];
  blacklist: IPBlacklistEntry[];
  defaultAction: 'allow' | 'deny';
  countryBlocking: boolean;
  blockedCountries: string[];
  allowedCountries: string[];
}

export interface IPWhitelistEntry {
  ip: string;
  cidr?: string;
  description: string;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
}

export interface IPBlacklistEntry {
  ip: string;
  cidr?: string;
  reason: string;
  expiresAt?: Date;
  createdBy: string;
  createdAt: Date;
  permanent: boolean;
}

export interface GeolocationConfig {
  enabled: boolean;
  provider: 'maxmind' | 'geoip' | 'cloudflare';
  restrictByCountry: boolean;
  allowedCountries: string[];
  blockedCountries: string[];
  restrictByContinent: boolean;
  allowedContinents: string[];
  blockedContinents: string[];
  vpnDetection: boolean;
  proxyDetection: boolean;
  torDetection: boolean;
}

export interface DeprecationConfig {
  enabled: boolean;
  deprecatedVersions: DeprecatedVersion[];
  warningHeaders: boolean;
  gracePeriodDays: number;
  forceUpgradeAfterDays: number;
}

export interface DeprecatedVersion {
  version: string;
  deprecatedAt: Date;
  sunsetAt: Date;
  migrationGuide: string;
  replacementVersion: string;
}

export interface ThrottlingConfig {
  enabled: boolean;
  globalRateLimit: number; // requests per minute
  perEndpointLimits: Record<string, number>;
  perUserLimits: Record<string, number>;
  burstAllowance: number;
  cooldownPeriod: number; // minutes
}

// Request signature validation
export interface SignedRequest {
  timestamp: number;
  nonce?: string;
  signature: string;
  version: string;
  headers: Record<string, string>;
  body?: string;
}

// Geolocation information
export interface GeolocationInfo {
  country: string;
  countryCode: string;
  continent: string;
  continentCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isVPN: boolean;
  isProxy: boolean;
  isTor: boolean;
  asn: string;
  org: string;
}

// API Security statistics
export interface APISecurityStats {
  totalRequests: number;
  blockedRequests: number;
  signatureVerifications: number;
  signatureFailures: number;
  ipBlocks: number;
  geolocationBlocks: number;
  deprecationWarnings: number;
  versionDistribution: Record<string, number>;
  topBlockedIPs: Array<{ ip: string; count: number }>;
  topBlockedCountries: Array<{ country: string; count: number }>;
}

export class APISecurityManager {
  private static instance: APISecurityManager;
  private config: APISecurityConfig;
  private stats: APISecurityStats = {
    totalRequests: 0,
    blockedRequests: 0,
    signatureVerifications: 0,
    signatureFailures: 0,
    ipBlocks: 0,
    geolocationBlocks: 0,
    deprecationWarnings: 0,
    versionDistribution: {},
    topBlockedIPs: [],
    topBlockedCountries: []
  };

  private readonly REDIS_KEY_PREFIX = 'api_security:';
  private readonly NONCE_CACHE_TTL = 300; // 5 minutes

  private constructor(config: APISecurityConfig) {
    this.config = config;
  }

  static getInstance(config?: APISecurityConfig): APISecurityManager {
    if (!APISecurityManager.instance) {
      if (!config) {
        throw new Error('API security configuration required for first initialization');
      }
      APISecurityManager.instance = new APISecurityManager(config);
    }
    return APISecurityManager.instance;
  }

  // Main security validation method
  async validateRequest(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
    version?: string;
    warnings?: string[];
  }> {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    try {
      this.stats.totalRequests++;
      const warnings: string[] = [];

      // 1. IP Control
      const ipResult = await this.validateIP(request);
      if (!ipResult.allowed) {
        this.stats.blockedRequests++;
        this.stats.ipBlocks++;
        return { allowed: false, reason: ipResult.reason };
      }

      // 2. Geolocation Control
      const geoResult = await this.validateGeolocation(request);
      if (!geoResult.allowed) {
        this.stats.blockedRequests++;
        this.stats.geolocationBlocks++;
        return { allowed: false, reason: geoResult.reason };
      }

      // 3. API Versioning
      const versionResult = this.validateVersion(request);
      if (!versionResult.allowed) {
        return { allowed: false, reason: versionResult.reason };
      }
      if (versionResult.warning) {
        warnings.push(versionResult.warning);
        this.stats.deprecationWarnings++;
      }

      // 4. Request Signature
      if (this.config.requestSigning.enabled) {
        const signatureResult = await this.validateSignature(request);
        if (!signatureResult.allowed) {
          this.stats.signatureFailures++;
          return { allowed: false, reason: signatureResult.reason };
        }
        this.stats.signatureVerifications++;
      }

      // 5. Throttling (if configured)
      if (this.config.throttling.enabled) {
        const throttleResult = await this.validateThrottling(request);
        if (!throttleResult.allowed) {
          return { allowed: false, reason: throttleResult.reason };
        }
      }

      return {
        allowed: true,
        version: versionResult.version,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('❌ API security validation error:');
      return { allowed: true, warnings: ['Security validation failed'] };
    }
  }

  // IP validation
  private async validateIP(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    if (!this.config.ipControl.enabled) {
      return { allowed: true };
    }

    const clientIP = this.getClientIP(request);
    
    // Check blacklist first
    for (const entry of this.config.ipControl.blacklist) {
      if (this.isIPInRange(clientIP, entry.ip, entry.cidr)) {
        if (!entry.expiresAt || entry.expiresAt > new Date()) {
          await this.logSecurityEvent('IP_BLOCKED', {
            ip: clientIP,
            reason: entry.reason,
            type: 'blacklist'
          });
          return { allowed: false, reason: `IP blocked: ${entry.reason}` };
        }
      }
    }

    // Check whitelist
    const whitelisted = this.config.ipControl.whitelist.some(entry => {
      if (entry.expiresAt && entry.expiresAt <= new Date()) {
        return false;
      }
      return this.isIPInRange(clientIP, entry.ip, entry.cidr);
    });

    if (whitelisted) {
      return { allowed: true };
    }

    // Apply default action
    if (this.config.ipControl.defaultAction === 'deny') {
      await this.logSecurityEvent('IP_BLOCKED', {
        ip: clientIP,
        reason: 'Not in whitelist',
        type: 'default_deny'
      });
      return { allowed: false, reason: 'IP not in whitelist' };
    }

    return { allowed: true };
  }

  // Geolocation validation
  private async validateGeolocation(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    if (!this.config.geolocation.enabled) {
      return { allowed: true };
    }

    try {
      const geoInfo = await this.getGeolocation(request);
      
      // VPN/Proxy/Tor detection
      if (this.config.geolocation.vpnDetection && geoInfo.isVPN) {
        await this.logSecurityEvent('VPN_BLOCKED', { ip: this.getClientIP(request) });
        return { allowed: false, reason: 'VPN connections not allowed' };
      }

      if (this.config.geolocation.proxyDetection && geoInfo.isProxy) {
        await this.logSecurityEvent('PROXY_BLOCKED', { ip: this.getClientIP(request) });
        return { allowed: false, reason: 'Proxy connections not allowed' };
      }

      if (this.config.geolocation.torDetection && geoInfo.isTor) {
        await this.logSecurityEvent('TOR_BLOCKED', { ip: this.getClientIP(request) });
        return { allowed: false, reason: 'Tor connections not allowed' };
      }

      // Country restrictions
      if (this.config.geolocation.restrictByCountry) {
        if (this.config.geolocation.blockedCountries.includes(geoInfo.countryCode)) {
          await this.logSecurityEvent('COUNTRY_BLOCKED', {
            ip: this.getClientIP(request),
            country: geoInfo.country,
            countryCode: geoInfo.countryCode
          });
          return { allowed: false, reason: `Access from ${geoInfo.country} not allowed` };
        }

        if (this.config.geolocation.allowedCountries.length > 0 && 
            !this.config.geolocation.allowedCountries.includes(geoInfo.countryCode)) {
          await this.logSecurityEvent('COUNTRY_BLOCKED', {
            ip: this.getClientIP(request),
            country: geoInfo.country,
            countryCode: geoInfo.countryCode
          });
          return { allowed: false, reason: `Access from ${geoInfo.country} not allowed` };
        }
      }

      // Continent restrictions
      if (this.config.geolocation.restrictByContinent) {
        if (this.config.geolocation.blockedContinents.includes(geoInfo.continentCode)) {
          return { allowed: false, reason: `Access from ${geoInfo.continent} not allowed` };
        }

        if (this.config.geolocation.allowedContinents.length > 0 && 
            !this.config.geolocation.allowedContinents.includes(geoInfo.continentCode)) {
          return { allowed: false, reason: `Access from ${geoInfo.continent} not allowed` };
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('❌ Geolocation validation error:');
      return { allowed: true }; // Fail open
    }
  }

  // API version validation
  private validateVersion(request: NextRequest): {
    allowed: boolean;
    version?: string;
    reason?: string;
    warning?: string;
  } {
    if (!this.config.versioning.enabled) {
      return { allowed: true, version: this.config.versioning.currentVersion };
    }

    let version: string;

    // Extract version based on strategy
    switch (this.config.versioning.strategy) {
      case 'header':
        version = (request as any).headers.get('X-API-Version') || 
                 (request as any).headers.get('API-Version') || 
                 this.config.versioning.defaultVersion;
        break;
      case 'path':
        const pathMatch = request.nextUrl.pathname.match(/\/v(\d+(?:\.\d+)*)\//);
        version = pathMatch ? `v${pathMatch[1]}` : this.config.versioning.defaultVersion;
        break;
      case 'query':
        version = request.nextUrl.searchParams.get('version') || 
                 this.config.versioning.defaultVersion;
        break;
      default:
        version = this.config.versioning.defaultVersion;
    }

    // Check if version is supported
    if (!this.config.versioning.supportedVersions.includes(version)) {
      return {
        allowed: false,
        reason: `API version ${version} is not supported. Supported versions: ${this.config.versioning.supportedVersions.join(', ')}`
      };
    }

    // Update version statistics
    this.stats.versionDistribution[version] = (this.stats.versionDistribution[version] || 0) + 1;

    // Check for deprecation warnings
    if (this.config.versioning.deprecationWarnings) {
      const deprecatedVersion = this.config.deprecation.deprecatedVersions.find(
        dv => dv.version === version
      );

      if (deprecatedVersion) {
        const daysUntilSunset = Math.ceil(
          (deprecatedVersion.sunsetAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );

        return {
          allowed: true,
          version,
          warning: `API version ${version} is deprecated and will be sunset in ${daysUntilSunset} days. Please migrate to ${deprecatedVersion.replacementVersion}.`
        };
      }
    }

    return { allowed: true, version };
  }

  // Request signature validation
  private async validateSignature(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      const signature = (request as any).headers.get('X-Signature');
      const timestamp = (request as any).headers.get('X-Timestamp');
      const nonce = (request as any).headers.get('X-Nonce');

      if (!signature || !timestamp) {
        return { allowed: false, reason: 'Missing required signature headers' };
      }

      // Validate timestamp
      const requestTime = parseInt(timestamp);
      const now = Math.floor(Date.now() / 1000);
      
      if (Math.abs(now - requestTime) > this.config.requestSigning.timestampTolerance) {
        return { allowed: false, reason: 'Request timestamp outside tolerance window' };
      }

      // Validate nonce (if required)
      if (this.config.requestSigning.nonceRequired) {
        if (!nonce) {
          return { allowed: false, reason: 'Nonce is required' };
        }

        // Check if nonce was already used
        const nonceKey = `${this.REDIS_KEY_PREFIX}nonce:${nonce}`;
        const nonceUsed = await redisCache.get(nonceKey);
        if (nonceUsed) {
          return { allowed: false, reason: 'Nonce already used' };
        }

        // Store nonce to prevent replay
        await redisCache.set(nonceKey, '1', { ttl: this.NONCE_CACHE_TTL });
      }

      // Build signature payload
      const method = request.method;
      const path = request.nextUrl.pathname + request.nextUrl.search;
      const body = this.config.requestSigning.includeBody ? 
        await request.text() : '';

      let payload = `${method}\n${path}\n${timestamp}`;
      
      if (nonce) {
        payload += `\n${nonce}`;
      }

      if (this.config.requestSigning.includeBody && body) {
        payload += `\n${body}`;
      }

      // Include specified headers
      for (const headerName of this.config.requestSigning.includeHeaders) {
        const headerValue = (request as any).headers.get(headerName);
        if (headerValue) {
          payload += `\n${headerName.toLowerCase()}:${headerValue}`;
        }
      }

      // Generate expected signature
      const expectedSignature = this.generateSignature(payload);

      // Compare signatures
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return { allowed: false, reason: 'Invalid signature' };
      }

      return { allowed: true };

    } catch (error) {
      console.error('❌ Signature validation error:');
      return { allowed: false, reason: 'Signature validation failed' };
    }
  }

  // Throttling validation
  private async validateThrottling(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    try {
      this.getClientIP(request);
      const endpoint = request.nextUrl.pathname;
      const userId = (request as any).headers.get('X-User-ID');

      // Check global rate limit
      const globalKey = `${this.REDIS_KEY_PREFIX}throttle:global`;
      const globalCount = await redisCache.get<number>(globalKey) || 0;
      
      if (globalCount >= this.config.throttling.globalRateLimit) {
        return { allowed: false, reason: 'Global rate limit exceeded' };
      }

      // Check per-endpoint limit
      const endpointLimit = this.config.throttling.perEndpointLimits[endpoint];
      if (endpointLimit) {
        const endpointKey = `${this.REDIS_KEY_PREFIX}throttle:endpoint:${endpoint}`;
        const endpointCount = await redisCache.get<number>(endpointKey) || 0;
        
        if (endpointCount >= endpointLimit) {
          return { allowed: false, reason: `Endpoint rate limit exceeded for ${endpoint}` };
        }
      }

      // Check per-user limit
      if (userId) {
        const userLimit = this.config.throttling.perUserLimits[userId];
        if (userLimit) {
          const userKey = `${this.REDIS_KEY_PREFIX}throttle:user:${userId}`;
          const userCount = await redisCache.get<number>(userKey) || 0;
          
          if (userCount >= userLimit) {
            return { allowed: false, reason: 'User rate limit exceeded' };
          }
        }
      }

      // Update counters
      const ttl = 60; // 1 minute window
      await redisCache.set(globalKey, globalCount + 1, { ttl });
      
      if (endpointLimit) {
        const endpointKey = `${this.REDIS_KEY_PREFIX}throttle:endpoint:${endpoint}`;
        const endpointCount = await redisCache.get<number>(endpointKey) || 0;
        await redisCache.set(endpointKey, endpointCount + 1, { ttl });
      }

      if (userId) {
        const userLimit = this.config.throttling.perUserLimits[userId];
        if (userLimit) {
          const userKey = `${this.REDIS_KEY_PREFIX}throttle:user:${userId}`;
          const userCount = await redisCache.get<number>(userKey) || 0;
          await redisCache.set(userKey, userCount + 1, { ttl });
        }
      }

      return { allowed: true };

    } catch (error) {
      console.error('❌ Throttling validation error:');
      return { allowed: true }; // Fail open
    }
  }

  // IP management methods
  async addToWhitelist(entry: Omit<IPWhitelistEntry, 'createdAt'>): Promise<void> {
    const newEntry: IPWhitelistEntry = {
      ...entry,
      createdAt: new Date()
    };
    
    this.config.ipControl.whitelist.push(newEntry);
    await this.persistIPControl();
    
    console.log(`✅ IP added to whitelist: ${entry.ip}`);
  }

  async addToBlacklist(entry: Omit<IPBlacklistEntry, 'createdAt'>): Promise<void> {
    const newEntry: IPBlacklistEntry = {
      ...entry,
      createdAt: new Date()
    };
    
    this.config.ipControl.blacklist.push(newEntry);
    await this.persistIPControl();
    
    console.log(`🚫 IP added to blacklist: ${entry.ip} - ${entry.reason}`);
  }

  async removeFromWhitelist(ip: string): Promise<boolean> {
    const initialLength = this.config.ipControl.whitelist.length;
    this.config.ipControl.whitelist = this.config.ipControl.whitelist.filter(
      entry => entry.ip !== ip
    );
    
    if (this.config.ipControl.whitelist.length < initialLength) {
      await this.persistIPControl();
      console.log(`✅ IP removed from whitelist: ${ip}`);
      return true;
    }
    
    return false;
  }

  async removeFromBlacklist(ip: string): Promise<boolean> {
    const initialLength = this.config.ipControl.blacklist.length;
    this.config.ipControl.blacklist = this.config.ipControl.blacklist.filter(
      entry => entry.ip !== ip
    );
    
    if (this.config.ipControl.blacklist.length < initialLength) {
      await this.persistIPControl();
      console.log(`✅ IP removed from blacklist: ${ip}`);
      return true;
    }
    
    return false;
  }

  // Signature generation
  generateSignature(payload: string): string {
    const algorithm = this.config.requestSigning.algorithm.toLowerCase().replace('-', '');
    return crypto
      .createHmac(algorithm, this.config.requestSigning.secretKey)
      .update(payload)
      .digest('hex');
  }

  // Statistics and reporting
  getStats(): APISecurityStats {
    return { ...this.stats };
  }

  async generateSecurityReport(): Promise<{
    stats: APISecurityStats;
    config: APISecurityConfig;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze configuration
    if (!this.config.requestSigning.enabled) {
      issues.push('Request signing is disabled');
    }

    if (!this.config.ipControl.enabled) {
      recommendations.push('Consider enabling IP control for better security');
    }

    if (!this.config.geolocation.enabled) {
      recommendations.push('Enable geolocation filtering for enhanced security');
    }

    if (this.config.requestSigning.timestampTolerance > 300) {
      recommendations.push('Consider reducing timestamp tolerance for better security');
    }

    return {
      stats: this.stats,
      config: this.config,
      issues,
      recommendations
    };
  }

  // Private helper methods
  private getClientIP(request: NextRequest): string {
    return (request as any).headers.get('x-forwarded-for')?.split(',')[0] ||
           (request as any).headers.get('x-real-ip') ||
           (request as any).headers.get('cf-connecting-ip') ||
           '127.0.0.1';
  }

  private isIPInRange(ip: string, targetIP: string, cidr?: string): boolean {
    if (cidr) {
      // CIDR range check (simplified)
      return ip.startsWith(targetIP.split('.').slice(0, -1).join('.'));
    }
    return ip === targetIP;
  }

  private async getGeolocation(request: NextRequest): Promise<GeolocationInfo> {
    // Mock geolocation data - in production, integrate with actual service
    this.getClientIP(request);
    
    return {
      country: 'Turkey',
      countryCode: 'TR',
      continent: 'Asia',
      continentCode: 'AS',
      region: 'Istanbul',
      city: 'Istanbul',
      latitude: 41.0082,
      longitude: 28.9784,
      timezone: 'Europe/Istanbul',
      isVPN: false,
      isProxy: false,
      isTor: false,
      asn: 'AS9121',
      org: 'Turk Telekom'
    };
  }

  private constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  private async persistIPControl(): Promise<void> {
    try {
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}ip_control`,
        JSON.stringify({
          whitelist: this.config.ipControl.whitelist,
          blacklist: this.config.ipControl.blacklist
        })
      );
    } catch (error) {
      console.error('❌ Error persisting IP control:');
    }
  }

  private async logSecurityEvent(event: string, details: Record<string, unknown>): Promise<void> {
    await auditLogger.log({
      level: AuditLevel.WARN,
      category: AuditCategory.SECURITY_EVENT,
      action: event,
      resource: 'api_security',
      details: {
        description: `API security event: ${event}`,
        ...details
      },
      ipAddress: details.ip as string
    });
  }
}

// Default configuration
export const defaultAPISecurityConfig: APISecurityConfig = {
  versioning: {
    enabled: true,
    strategy: 'header',
    currentVersion: 'v1',
    supportedVersions: ['v1'],
    defaultVersion: 'v1',
    deprecationWarnings: true
  },
  requestSigning: {
    enabled: false,
    algorithm: 'HMAC-SHA256',
    secretKey: process.env.API_SECRET_KEY || 'your-secret-key',
    timestampTolerance: 300,
    includeBody: true,
    includeHeaders: ['user-agent', 'content-type'],
    nonceRequired: true
  },
  ipControl: {
    enabled: false,
    whitelist: [],
    blacklist: [],
    defaultAction: 'allow',
    countryBlocking: false,
    blockedCountries: [],
    allowedCountries: []
  },
  geolocation: {
    enabled: false,
    provider: 'cloudflare',
    restrictByCountry: false,
    allowedCountries: [],
    blockedCountries: [],
    restrictByContinent: false,
    allowedContinents: [],
    blockedContinents: [],
    vpnDetection: false,
    proxyDetection: false,
    torDetection: false
  },
  deprecation: {
    enabled: true,
    deprecatedVersions: [],
    warningHeaders: true,
    gracePeriodDays: 90,
    forceUpgradeAfterDays: 180
  },
  throttling: {
    enabled: false,
    globalRateLimit: 1000,
    perEndpointLimits: {},
    perUserLimits: {},
    burstAllowance: 10,
    cooldownPeriod: 5
  },
  enabled: true
};

// Export singleton instance
export const apiSecurity = APISecurityManager.getInstance(defaultAPISecurityConfig);

// Helper functions
export async function validateAPIRequest(request: NextRequest) {
  return apiSecurity.validateRequest(request);
}

export function generateAPISignature(payload: string): string {
  return apiSecurity.generateSignature(payload);
}

export function getAPISecurityStats() {
  return apiSecurity.getStats();
} 