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

interface SecurityReport {
  stats: APISecurityStats;
  config: APISecurityConfig;
  issues: string[];
  recommendations: string[];
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

    } catch (error: unknown) {
      console.error('❌ API security validation error:', error);
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
    const ipConfig = this.config.ipControl;

    // Check blacklist
    const blacklisted = ipConfig.blacklist.find(entry => {
      if (entry.expiresAt && entry.expiresAt < new Date()) {
        return false;
      }
      return this.isIPInRange(clientIP, entry.ip, entry.cidr);
    });

    if (blacklisted) {
      await this.logSecurityEvent('IP_BLOCKED', {
        ip: clientIP,
        reason: blacklisted.reason,
        blacklistEntry: blacklisted
      });
      return { allowed: false, reason: `IP blocked: ${blacklisted.reason}` };
    }

    // Check whitelist if default action is deny
    if (ipConfig.defaultAction === 'deny') {
      const whitelisted = ipConfig.whitelist.find(entry => {
        if (entry.expiresAt && entry.expiresAt < new Date()) {
          return false;
        }
        return this.isIPInRange(clientIP, entry.ip, entry.cidr);
      });

      if (!whitelisted) {
        await this.logSecurityEvent('IP_NOT_WHITELISTED', {
          ip: clientIP,
          defaultAction: ipConfig.defaultAction
        });
        return { allowed: false, reason: 'IP not in whitelist' };
      }
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

    const geoInfo = await this.getGeolocation(request);
    const geoConfig = this.config.geolocation;

    // Check country restrictions
    if (geoConfig.restrictByCountry) {
      if (geoConfig.blockedCountries.includes(geoInfo.countryCode)) {
        await this.logSecurityEvent('COUNTRY_BLOCKED', {
          country: geoInfo.country,
          countryCode: geoInfo.countryCode
        });
        return { allowed: false, reason: `Access denied from ${geoInfo.country}` };
      }

      if (geoConfig.allowedCountries.length > 0 && !geoConfig.allowedCountries.includes(geoInfo.countryCode)) {
        await this.logSecurityEvent('COUNTRY_NOT_ALLOWED', {
          country: geoInfo.country,
          countryCode: geoInfo.countryCode
        });
        return { allowed: false, reason: `Access denied from ${geoInfo.country}` };
      }
    }

    // Check continent restrictions
    if (geoConfig.restrictByContinent) {
      if (geoConfig.blockedContinents.includes(geoInfo.continentCode)) {
        await this.logSecurityEvent('CONTINENT_BLOCKED', {
          continent: geoInfo.continent,
          continentCode: geoInfo.continentCode
        });
        return { allowed: false, reason: `Access denied from ${geoInfo.continent}` };
      }

      if (geoConfig.allowedContinents.length > 0 && !geoConfig.allowedContinents.includes(geoInfo.continentCode)) {
        await this.logSecurityEvent('CONTINENT_NOT_ALLOWED', {
          continent: geoInfo.continent,
          continentCode: geoInfo.continentCode
        });
        return { allowed: false, reason: `Access denied from ${geoInfo.continent}` };
      }
    }

    // Check VPN/Proxy/Tor
    if (geoConfig.vpnDetection && geoInfo.isVPN) {
      await this.logSecurityEvent('VPN_DETECTED', {
        ip: this.getClientIP(request),
        country: geoInfo.country
      });
      return { allowed: false, reason: 'VPN access not allowed' };
    }

    if (geoConfig.proxyDetection && geoInfo.isProxy) {
      await this.logSecurityEvent('PROXY_DETECTED', {
        ip: this.getClientIP(request),
        country: geoInfo.country
      });
      return { allowed: false, reason: 'Proxy access not allowed' };
    }

    if (geoConfig.torDetection && geoInfo.isTor) {
      await this.logSecurityEvent('TOR_DETECTED', {
        ip: this.getClientIP(request),
        country: geoInfo.country
      });
      return { allowed: false, reason: 'Tor access not allowed' };
    }

    return { allowed: true };
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
        version = request.headers.get('X-API-Version') || 
                 request.headers.get('API-Version') || 
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
    const signConfig = this.config.requestSigning;
    const timestamp = request.headers.get('X-Request-Timestamp');
    const nonce = request.headers.get('X-Request-Nonce');
    const signature = request.headers.get('X-Request-Signature');

    if (!timestamp || !signature) {
      return { allowed: false, reason: 'Missing required signature headers' };
    }

    if (signConfig.nonceRequired && !nonce) {
      return { allowed: false, reason: 'Nonce required but not provided' };
    }

    // Validate timestamp
    const requestTime = parseInt(timestamp, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - requestTime);

    if (timeDiff > signConfig.timestampTolerance) {
      return { allowed: false, reason: 'Request timestamp outside tolerance window' };
    }

    // Check nonce reuse
    if (nonce) {
      const nonceKey = `${this.REDIS_KEY_PREFIX}nonce:${nonce}`;
      const nonceExists = await redisCache.get(nonceKey);
      if (nonceExists) {
        return { allowed: false, reason: 'Nonce already used' };
      }
      await redisCache.set(nonceKey, '1', { ttl: this.NONCE_CACHE_TTL });
    }

    // Build signature payload
    let payload = timestamp;
    if (nonce) {
      payload += nonce;
    }

    if (signConfig.includeBody) {
      const body = await request.text();
      payload += body;
    }

    if (signConfig.includeHeaders.length > 0) {
      const headerValues = signConfig.includeHeaders
        .map(header => request.headers.get(header))
        .filter(Boolean)
        .join('');
      payload += headerValues;
    }

    // Verify signature
    const expectedSignature = this.generateSignature(payload);
    if (!this.constantTimeCompare(signature, expectedSignature)) {
      return { allowed: false, reason: 'Invalid signature' };
    }

    return { allowed: true };
  }

  // Throttling validation
  private async validateThrottling(request: NextRequest): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    const ip = this.getClientIP(request);
    const endpoint = request.nextUrl.pathname;
    const userId = request.headers.get('x-user-id') || 'anonymous';

    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute
    const windowStart = now - windowSize;

    // Global rate limit
    const globalKey = `${this.REDIS_KEY_PREFIX}throttle:global`;
    const globalCountStr = await redisCache.get(globalKey, { 
      deserializer: (value: string) => value 
    });
    const globalCount = parseInt(globalCountStr || '0', 10);

    if (globalCount >= this.config.throttling.globalRateLimit) {
      return {
        allowed: false,
        reason: 'Global rate limit exceeded'
      };
    }

    // Per-endpoint rate limit
    const endpointKey = `${this.REDIS_KEY_PREFIX}throttle:endpoint:${endpoint}`;
    const endpointCountStr = await redisCache.get(endpointKey, { 
      deserializer: (value: string) => value 
    });
    const endpointCount = parseInt(endpointCountStr || '0', 10);

    if (endpointCount >= (this.config.throttling.perEndpointLimits[endpoint] || this.config.throttling.globalRateLimit)) {
      return {
        allowed: false,
        reason: 'Endpoint rate limit exceeded'
      };
    }

    // Per-user rate limit
    const userKey = `${this.REDIS_KEY_PREFIX}throttle:user:${userId}`;
    const userCountStr = await redisCache.get(userKey, { 
      deserializer: (value: string) => value 
    });
    const userCount = parseInt(userCountStr || '0', 10);

    if (userCount >= (this.config.throttling.perUserLimits[userId] || this.config.throttling.globalRateLimit)) {
      return {
        allowed: false,
        reason: 'User rate limit exceeded'
      };
    }

    // Update counters
    await Promise.all([
      redisCache.set(globalKey, (globalCount + 1).toString(), { 
        ttl: windowSize,
        compress: false
      }),
      redisCache.set(endpointKey, (endpointCount + 1).toString(), { 
        ttl: windowSize,
        compress: false
      }),
      redisCache.set(userKey, (userCount + 1).toString(), { 
        ttl: windowSize,
        compress: false
      })
    ]);

    return { allowed: true };
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

  async generateSecurityReport(): Promise<SecurityReport> {
    const stats = this.getStats();
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Analyze security issues
    if (stats.blockedRequests / stats.totalRequests > 0.1) {
      issues.push('High rate of blocked requests detected');
      recommendations.push('Review IP whitelist and blacklist configurations');
    }

    if (stats.signatureFailures > 0) {
      issues.push('Request signature verification failures detected');
      recommendations.push('Review API client implementations and signature generation');
    }

    if (stats.geolocationBlocks > 0) {
      issues.push('Geolocation-based blocks detected');
      recommendations.push('Review geolocation restrictions and country blocking rules');
    }

    if (Object.keys(stats.versionDistribution).length > 3) {
      issues.push('Multiple API versions in use');
      recommendations.push('Consider deprecating older versions and encouraging upgrades');
    }

    return {
      stats,
      config: this.config,
      issues,
      recommendations
    };
  }

  // Private helper methods
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for')?.split(',')[0] ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
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
    } catch (_error) {
      console.error('❌ Error persisting IP control:');
    }
  }

  private async logSecurityEvent(
    event: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await auditLogger.logSecurityEvent(event, 'MEDIUM', {
      details: {
        description: event,
        ...details
      }
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
export async function validateAPIRequest(request: NextRequest): Promise<{
  allowed: boolean;
  reason?: string;
  version?: string;
  warnings?: string[];
}> {
  const securityManager = APISecurityManager.getInstance();
  return securityManager.validateRequest(request);
}

export function generateAPISignature(payload: string): string {
  const securityManager = APISecurityManager.getInstance();
  return securityManager.generateSignature(payload);
}

export function getAPISecurityStats(): APISecurityStats {
  const securityManager = APISecurityManager.getInstance();
  return securityManager.getStats();
} 