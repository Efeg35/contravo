import { NextRequest, NextResponse } from 'next/server';
// Security header interfaces
export interface SecurityHeadersConfig {
  contentSecurityPolicy: CSPConfig;
  strictTransportSecurity: HSTSConfig;
  frameOptions: FrameOptionsConfig;
  contentTypeOptions: ContentTypeOptionsConfig;
  referrerPolicy: ReferrerPolicyConfig;
  permissionsPolicy: PermissionsPolicyConfig;
  crossOriginEmbedderPolicy: COEPConfig;
  crossOriginOpenerPolicy: COOPConfig;
  crossOriginResourcePolicy: CORPConfig;
  expectCertificateTransparency: ExpectCTConfig;
  reportTo: ReportToConfig;
  serverInfo: ServerInfoConfig;
  customHeaders: CustomHeader[];
  enabled: boolean;
  reportOnly: boolean;
}

export interface CSPConfig {
  enabled: boolean;
  reportOnly: boolean;
  directives: CSPDirectives;
  reportUri?: string;
  nonce?: boolean;
  upgradeInsecureRequests?: boolean;
}

export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  styleSrcAttr?: string[];
  imgSrc?: string[];
  fontSrc?: string[];
  connectSrc?: string[];
  mediaSrc?: string[];
  objectSrc?: string[];
  frameSrc?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  baseUri?: string[];
  formAction?: string[];
  frameAncestors?: string[];
  pluginTypes?: string[];
  sandbox?: string[];
  requireTrustedTypesFor?: string[];
  trustedTypes?: string[];
}

export interface HSTSConfig {
  enabled: boolean;
  maxAge: number; // seconds
  includeSubDomains: boolean;
  preload: boolean;
}

export interface FrameOptionsConfig {
  enabled: boolean;
  policy: 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM';
  allowFrom?: string;
}

export interface ContentTypeOptionsConfig {
  enabled: boolean;
  nosniff: boolean;
}

export interface ReferrerPolicyConfig {
  enabled: boolean;
  policy: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
}

export interface PermissionsPolicyConfig {
  enabled: boolean;
  policies: {
    camera?: boolean;
    microphone?: boolean;
    geolocation?: boolean;
    notifications?: boolean;
    payment?: boolean;
    usb?: boolean;
    gyroscope?: boolean;
    accelerometer?: boolean;
    magnetometer?: boolean;
    fullscreen?: boolean;
    autoplay?: boolean;
    clipboard?: boolean;
  };
}

export interface COEPConfig {
  enabled: boolean;
  policy: 'unsafe-none' | 'require-corp' | 'credentialless';
}

export interface COOPConfig {
  enabled: boolean;
  policy: 'unsafe-none' | 'same-origin-allow-popups' | 'same-origin';
}

export interface CORPConfig {
  enabled: boolean;
  policy: 'same-site' | 'same-origin' | 'cross-origin';
}

export interface ExpectCTConfig {
  enabled: boolean;
  maxAge: number;
  enforce: boolean;
  reportUri?: string;
}

export interface ReportToConfig {
  enabled: boolean;
  groups: ReportToGroup[];
}

export interface ReportToGroup {
  groupName: string;
  maxAge: number;
  endpoints: ReportToEndpoint[];
}

export interface ReportToEndpoint {
  url: string;
  priority?: number;
  weight?: number;
}

export interface ServerInfoConfig {
  hideServerInfo: boolean;
  hidePoweredBy: boolean;
  customServerHeader?: string;
}

export interface CustomHeader {
  name: string;
  value: string;
  enabled: boolean;
}

// Security headers statistics
export interface SecurityHeadersStats {
  totalRequests: number;
  violationsReported: number;
  cspViolations: number;
  cspBlockedResources: number;
  hstsUpgrades: number;
  referrerPolicyBlocks: number;
  permissionsPolicyBlocks: number;
  lastViolation: Date | null;
  topViolations: Array<{
    type: string;
    count: number;
    lastSeen: Date;
  }>;
}

export class SecurityHeadersManager {
  private static instance: SecurityHeadersManager;
  private config: SecurityHeadersConfig;
  private stats: SecurityHeadersStats = {
    totalRequests: 0,
    violationsReported: 0,
    cspViolations: 0,
    cspBlockedResources: 0,
    hstsUpgrades: 0,
    referrerPolicyBlocks: 0,
    permissionsPolicyBlocks: 0,
    lastViolation: null,
    topViolations: []
  };

  private constructor(config: SecurityHeadersConfig) {
    this.config = config;
  }

  static getInstance(config?: SecurityHeadersConfig): SecurityHeadersManager {
    if (!SecurityHeadersManager.instance) {
      if (!config) {
        throw new Error('Security headers configuration required for first initialization');
      }
      SecurityHeadersManager.instance = new SecurityHeadersManager(config);
    }
    return SecurityHeadersManager.instance;
  }

  // Apply security headers to response
  applySecurityHeaders(
    request: NextRequest,
    response: NextResponse,
    options?: {
      skipCSP?: boolean;
      skipHSTS?: boolean;
      customNonce?: string;
    }
  ): NextResponse {
    if (!this.config.enabled) {
      return response;
    }

    try {
      this.stats.totalRequests++;

      // Content Security Policy
      if (this.config.contentSecurityPolicy.enabled && !options?.skipCSP) {
        this.applyCsp(response, options?.customNonce);
      }

      // Strict Transport Security
      if (this.config.strictTransportSecurity.enabled && !options?.skipHSTS) {
        this.applyHsts(response, request);
      }

      // X-Frame-Options
      if (this.config.frameOptions.enabled) {
        this.applyFrameOptions(response);
      }

      // X-Content-Type-Options
      if (this.config.contentTypeOptions.enabled) {
        this.applyContentTypeOptions(response);
      }

      // Referrer Policy
      if (this.config.referrerPolicy.enabled) {
        this.applyReferrerPolicy(response);
      }

      // Permissions Policy
      if (this.config.permissionsPolicy.enabled) {
        this.applyPermissionsPolicy(response);
      }

      // Cross-Origin Embedder Policy
      if (this.config.crossOriginEmbedderPolicy.enabled) {
        this.applyCrossOriginEmbedderPolicy(response);
      }

      // Cross-Origin Opener Policy
      if (this.config.crossOriginOpenerPolicy.enabled) {
        this.applyCrossOriginOpenerPolicy(response);
      }

      // Cross-Origin Resource Policy
      if (this.config.crossOriginResourcePolicy.enabled) {
        this.applyCrossOriginResourcePolicy(response);
      }

      // Expect-CT
      if (this.config.expectCertificateTransparency.enabled) {
        this.applyExpectCt(response);
      }

      // Report-To
      if (this.config.reportTo.enabled) {
        this.applyReportTo(response);
      }

      // Server Info
      this.applyServerInfo(response);

      // Custom Headers
      this.applyCustomHeaders(response);

      console.log('🛡️ Security headers applied successfully');
      return response;

    } catch (error) {
      console.error('❌ Error applying security headers:');
      return response;
    }
  }

  // CSP nonce generation
  generateCSPNonce(): string {
    return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
  }

  // Validate CSP configuration
  validateCSPConfig(config: CSPConfig): string[] {
    const errors: string[] = [];
    
    if (config.enabled) {
      // Check for unsafe directives
      if (config.directives.scriptSrc?.includes("'unsafe-inline'") && 
          config.directives.scriptSrc?.includes("'unsafe-eval'")) {
        errors.push('Both unsafe-inline and unsafe-eval are dangerous');
      }

      // Check for missing default-src
      if (!config.directives.defaultSrc) {
        errors.push('default-src directive is recommended');
      }

      // Check for report-uri when report-only is enabled
      if (config.reportOnly && !config.reportUri) {
        errors.push('report-uri should be set when using report-only mode');
      }
    }

    return errors;
  }

  // Report CSP violation
  async reportCSPViolation(violation: {
    documentUri: string;
    referrer: string;
    blockedUri: string;
    violatedDirective: string;
    originalPolicy: string;
    disposition: string;
    sourceFile?: string;
    lineNumber?: number;
    columnNumber?: number;
  }): Promise<void> {
    try {
      // Chrome extension'lardan gelen violation'ları filtrele
      if (violation.blockedUri.includes('chrome-extension:') || 
          violation.blockedUri.includes('moz-extension:') ||
          violation.sourceFile?.includes('chrome-extension:')) {
        return; // Sessizce ignore et
      }

      this.stats.cspViolations++;
      this.stats.violationsReported++;
      this.stats.lastViolation = new Date();

      // Update top violations
      const existingViolation = this.stats.topViolations.find(v => 
        v.type === violation.violatedDirective
      );

      if (existingViolation) {
        existingViolation.count++;
        existingViolation.lastSeen = new Date();
      } else {
        this.stats.topViolations.push({
          type: violation.violatedDirective,
          count: 1,
          lastSeen: new Date()
        });
      }

      // Keep only top 10 violations
      this.stats.topViolations = this.stats.topViolations
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Sadece development'ta log et
      if (process.env.NODE_ENV === 'development') {
        console.warn('🚨 CSP Violation:', {
          directive: violation.violatedDirective,
          blockedUri: violation.blockedUri,
          sourceFile: violation.sourceFile
        });
      }

    } catch (error) {
      // Hata durumunda sadece log et, throw etme
      console.error('❌ Error reporting CSP violation:', error);
    }
  }

  // Get security headers statistics
  getStats(): SecurityHeadersStats {
    return { ...this.stats };
  }

  // Update configuration
  updateConfig(updates: Partial<SecurityHeadersConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log('🔧 Security headers configuration updated');
  }

  // Generate security report
  generateSecurityReport(): {
    config: SecurityHeadersConfig;
    stats: SecurityHeadersStats;
    recommendations: string[];
    issues: string[];
  } {
    const recommendations: string[] = [];
    const issues: string[] = [];

    // Analyze CSP configuration
    if (this.config.contentSecurityPolicy.enabled) {
      const cspErrors = this.validateCSPConfig(this.config.contentSecurityPolicy);
      issues.push(...cspErrors);

      if (!this.config.contentSecurityPolicy.nonce) {
        recommendations.push('Consider using CSP nonces for better security');
      }
    } else {
      issues.push('Content Security Policy is disabled');
    }

    // Check HSTS configuration
    if (this.config.strictTransportSecurity.enabled) {
      if (this.config.strictTransportSecurity.maxAge < 31536000) { // 1 year
        recommendations.push('HSTS max-age should be at least 1 year');
      }
      if (!this.config.strictTransportSecurity.includeSubDomains) {
        recommendations.push('Consider enabling HSTS for subdomains');
      }
    } else {
      issues.push('Strict Transport Security is disabled');
    }

    // Check frame options
    if (!this.config.frameOptions.enabled) {
      issues.push('X-Frame-Options is disabled - clickjacking protection missing');
    }

    // Check content type options
    if (!this.config.contentTypeOptions.enabled) {
      issues.push('X-Content-Type-Options is disabled - MIME sniffing protection missing');
    }

    return {
      config: this.config,
      stats: this.stats,
      recommendations,
      issues
    };
  }

  // Private methods for applying headers
  private applyCsp(response: NextResponse, customNonce?: string): void {
    const csp = this.config.contentSecurityPolicy;
    const directives: string[] = [];

    // Generate nonce if enabled
    const nonce = csp.nonce ? (customNonce || this.generateCSPNonce()) : null;

    // Build directives
    Object.entries(csp.directives).forEach(([directive, values]) => {
      if (values && values.length > 0) {
        const directiveValues = [...values];
        
        // Add nonce to script-src and style-src if enabled
        if (nonce && (directive === 'scriptSrc' || directive === 'styleSrc')) {
          directiveValues.push(`'nonce-${nonce}'`);
        }
        
        const kebabDirective = directive.replace(/([A-Z])/g, '-$1').toLowerCase();
        directives.push(`${kebabDirective} ${directiveValues.join(' ')}`);
      }
    });

    // Add upgrade-insecure-requests if enabled
    if (csp.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    // Add report-uri if specified
    if (csp.reportUri) {
      directives.push(`report-uri ${csp.reportUri}`);
    }

    const cspValue = directives.join('; ');
    const headerName = csp.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    
    response.headers.set(headerName, cspValue);
    
    // Store nonce for template usage
    if (nonce) {
      response.headers.set('X-CSP-Nonce', nonce);
    }
  }

  private applyHsts(response: NextResponse, request: NextRequest): void {
    const hsts = this.config.strictTransportSecurity;
    
    // Only apply HSTS over HTTPS
    if (request.nextUrl.protocol === 'https:') {
      const hstsValues = [`max-age=${hsts.maxAge}`];
      
      if (hsts.includeSubDomains) {
        hstsValues.push('includeSubDomains');
      }
      
      if (hsts.preload) {
        hstsValues.push('preload');
      }
      
      response.headers.set('Strict-Transport-Security', hstsValues.join('; '));
      this.stats.hstsUpgrades++;
    }
  }

  private applyFrameOptions(response: NextResponse): void {
    const frameOptions = this.config.frameOptions;
    
    if (frameOptions.policy === 'ALLOW-FROM' && frameOptions.allowFrom) {
      response.headers.set('X-Frame-Options', `ALLOW-FROM ${frameOptions.allowFrom}`);
    } else {
      response.headers.set('X-Frame-Options', frameOptions.policy);
    }
  }

  private applyContentTypeOptions(response: NextResponse): void {
    if (this.config.contentTypeOptions.nosniff) {
      response.headers.set('X-Content-Type-Options', 'nosniff');
    }
  }

  private applyReferrerPolicy(response: NextResponse): void {
    response.headers.set('Referrer-Policy', this.config.referrerPolicy.policy);
  }

  private applyPermissionsPolicy(response: NextResponse): void {
    const policies = this.config.permissionsPolicy.policies;
    const policyStrings: string[] = [];

    Object.entries(policies).forEach(([feature, allowed]) => {
      if (allowed !== undefined) {
        policyStrings.push(`${feature}=${allowed ? '()' : '()'}`);
      }
    });

    if (policyStrings.length > 0) {
      response.headers.set('Permissions-Policy', policyStrings.join(', '));
    }
  }

  private applyCrossOriginEmbedderPolicy(response: NextResponse): void {
    response.headers.set('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy.policy);
  }

  private applyCrossOriginOpenerPolicy(response: NextResponse): void {
    response.headers.set('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy.policy);
  }

  private applyCrossOriginResourcePolicy(response: NextResponse): void {
    response.headers.set('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy.policy);
  }

  private applyExpectCt(response: NextResponse): void {
    const expectCt = this.config.expectCertificateTransparency;
    const values = [`max-age=${expectCt.maxAge}`];
    
    if (expectCt.enforce) {
      values.push('enforce');
    }
    
    if (expectCt.reportUri) {
      values.push(`report-uri="${expectCt.reportUri}"`);
    }
    
    response.headers.set('Expect-CT', values.join(', '));
  }

  private applyReportTo(response: NextResponse): void {
    const reportTo = this.config.reportTo;
    const groups = reportTo.groups.map(group => ({
      group: group.groupName,
      max_age: group.maxAge,
      endpoints: group.endpoints.map(endpoint => ({
        url: endpoint.url,
        priority: endpoint.priority,
        weight: endpoint.weight
      }))
    }));
    
    response.headers.set('Report-To', JSON.stringify(groups));
  }

  private applyServerInfo(response: NextResponse): void {
    const serverInfo = this.config.serverInfo;
    
    if (serverInfo.hidePoweredBy) {
      response.headers.delete('X-Powered-By');
    }
    
    if (serverInfo.hideServerInfo) {
      response.headers.delete('Server');
    } else if (serverInfo.customServerHeader) {
      response.headers.set('Server', serverInfo.customServerHeader);
    }
  }

  private applyCustomHeaders(response: NextResponse): void {
    this.config.customHeaders.forEach(header => {
      if (header.enabled) {
        response.headers.set(header.name, header.value);
      }
    });
  }
}

// Default security headers configuration
export const defaultSecurityHeadersConfig: SecurityHeadersConfig = {
  contentSecurityPolicy: {
    enabled: true,
    reportOnly: true,
    nonce: false,
    upgradeInsecureRequests: false,
    directives: {
      defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "'wasm-unsafe-eval'", 'data:', 'blob:', 'https:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      styleSrc: ["'self'", "'unsafe-inline'", 'data:', 'blob:', 'https:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      styleSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      fontSrc: ["'self'", 'data:', 'blob:', 'https:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      mediaSrc: ["'self'", 'data:', 'blob:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      objectSrc: ["'none'"],
      frameSrc: ["'self'"],
      workerSrc: ["'self'", 'blob:', 'data:', 'chrome-extension:', 'moz-extension:', 'ms-browser-extension:'],
      manifestSrc: ["'self'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      sandbox: []
    },
    reportUri: '/api/security/csp-report'
  },
  strictTransportSecurity: {
    enabled: true,
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: false
  },
  frameOptions: {
    enabled: true,
    policy: 'DENY'
  },
  contentTypeOptions: {
    enabled: true,
    nosniff: true
  },
  referrerPolicy: {
    enabled: true,
    policy: 'strict-origin-when-cross-origin'
  },
  permissionsPolicy: {
    enabled: true,
    policies: {
      camera: false,
      microphone: false,
      geolocation: false,
      notifications: false,
      payment: false,
      usb: false,
      gyroscope: false,
      accelerometer: false,
      magnetometer: false,
      fullscreen: true,
      autoplay: false,
      clipboard: true
    }
  },
  crossOriginEmbedderPolicy: {
    enabled: false,
    policy: 'unsafe-none'
  },
  crossOriginOpenerPolicy: {
    enabled: true,
    policy: 'same-origin-allow-popups'
  },
  crossOriginResourcePolicy: {
    enabled: true,
    policy: 'same-origin'
  },
  expectCertificateTransparency: {
    enabled: false,
    maxAge: 86400,
    enforce: false
  },
  reportTo: {
    enabled: false,
    groups: []
  },
  serverInfo: {
    hideServerInfo: true,
    hidePoweredBy: true,
    customServerHeader: 'Contravo/1.0'
  },
  customHeaders: [
    {
      name: 'X-Request-ID',
      value: crypto.randomUUID(),
      enabled: false // Geçici olarak kapatılıyor
    },
    {
      name: 'X-Response-Time', 
      value: Date.now().toString(),
      enabled: false // Geçici olarak kapatılıyor
    }
  ],
  enabled: true,
  reportOnly: true // Development için report-only mode
};

// Export singleton instance
export const securityHeaders = SecurityHeadersManager.getInstance(defaultSecurityHeadersConfig);

// Helper functions
export function applySecurityHeaders(
  request: NextRequest,
  response: NextResponse,
  options?: {
    skipCSP?: boolean;
    skipHSTS?: boolean;
    customNonce?: string;
  }
): NextResponse {
  return securityHeaders.applySecurityHeaders(request, response, options);
}

export function generateCSPNonce(): string {
  return securityHeaders.generateCSPNonce();
}

export function getSecurityHeadersStats() {
  return securityHeaders.getStats();
} 