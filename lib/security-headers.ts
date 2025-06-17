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

export interface CSPViolation {
  documentUri: string;
  referrer: string;
  blockedUri: string;
  violatedDirective: string;
  originalPolicy: string;
  disposition: string;
  sourceFile?: string;
  lineNumber?: number;
  columnNumber?: number;
}

export interface SecurityReport {
  config: SecurityHeadersConfig;
  stats: SecurityHeadersStats;
  recommendations: string[];
  issues: string[];
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
  async reportCSPViolation(violation: CSPViolation): Promise<void> {
    if (!this.config.contentSecurityPolicy.enabled) {
      return;
    }

    this.stats.violationsReported++;
    this.stats.cspViolations++;
    this.stats.lastViolation = new Date();

    // Update top violations
    const existingViolation = this.stats.topViolations.find(v => v.type === violation.violatedDirective);
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

    // Sort top violations by count
    this.stats.topViolations.sort((a, b) => b.count - a.count);
    this.stats.topViolations = this.stats.topViolations.slice(0, 10);

    // Send violation report if reportUri is configured
    if (this.config.contentSecurityPolicy.reportUri) {
      try {
        await fetch(this.config.contentSecurityPolicy.reportUri, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(violation)
        });
      } catch (error) {
        console.error('Failed to send CSP violation report:', error);
      }
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
  generateSecurityReport(): SecurityReport {
    const recommendations: string[] = [];
    const issues: string[] = [];

    // Analyze CSP configuration
    if (this.config.contentSecurityPolicy.enabled) {
      const cspIssues = this.validateCSPConfig(this.config.contentSecurityPolicy);
      issues.push(...cspIssues);

      if (!this.config.contentSecurityPolicy.directives.defaultSrc?.length) {
        recommendations.push('Consider adding default-src directive to CSP');
      }

      if (!this.config.contentSecurityPolicy.directives.scriptSrc?.length) {
        recommendations.push('Consider adding script-src directive to CSP');
      }
    }

    // Analyze HSTS configuration
    if (this.config.strictTransportSecurity.enabled) {
      if (this.config.strictTransportSecurity.maxAge < 31536000) {
        recommendations.push('Consider increasing HSTS max-age to at least 1 year');
      }

      if (!this.config.strictTransportSecurity.includeSubDomains) {
        recommendations.push('Consider enabling includeSubDomains for HSTS');
      }
    }

    // Analyze security statistics
    if (this.stats.cspViolations > 0) {
      issues.push(`CSP violations detected: ${this.stats.cspViolations}`);
      recommendations.push('Review CSP configuration and fix reported violations');
    }

    if (this.stats.referrerPolicyBlocks > 0) {
      issues.push(`Referrer policy blocks: ${this.stats.referrerPolicyBlocks}`);
      recommendations.push('Review referrer policy configuration');
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
    if (!this.config.contentSecurityPolicy.enabled) {
      return;
    }

    const directives: string[] = [];
    const cspConfig = this.config.contentSecurityPolicy;

    // Add nonce if enabled
    const nonce = customNonce || (cspConfig.nonce ? this.generateCSPNonce() : undefined);

    // Process each directive
    Object.entries(cspConfig.directives).forEach(([directive, values]) => {
      if (values && values.length > 0) {
        let directiveValue = values.join(' ');

        // Add nonce to script-src and style-src if enabled
        if (nonce && (directive === 'scriptSrc' || directive === 'styleSrc')) {
          directiveValue += ` 'nonce-${nonce}'`;
        }

        directives.push(`${directive.replace(/([A-Z])/g, '-$1').toLowerCase()} ${directiveValue}`);
      }
    });

    // Add upgrade-insecure-requests if enabled
    if (cspConfig.upgradeInsecureRequests) {
      directives.push('upgrade-insecure-requests');
    }

    // Add report-uri if configured
    if (cspConfig.reportUri) {
      directives.push(`report-uri ${cspConfig.reportUri}`);
    }

    // Set CSP header
    const headerName = cspConfig.reportOnly ? 'Content-Security-Policy-Report-Only' : 'Content-Security-Policy';
    response.headers.set(headerName, directives.join('; '));
  }

  private applyHsts(response: NextResponse, request: NextRequest): void {
    if (!this.config.strictTransportSecurity.enabled) {
      return;
    }

    const hstsConfig = this.config.strictTransportSecurity;
    const directives: string[] = [`max-age=${hstsConfig.maxAge}`];

    if (hstsConfig.includeSubDomains) {
      directives.push('includeSubDomains');
    }

    if (hstsConfig.preload) {
      directives.push('preload');
    }

    response.headers.set('Strict-Transport-Security', directives.join('; '));
    this.stats.hstsUpgrades++;
  }

  private applyFrameOptions(response: NextResponse): void {
    if (!this.config.frameOptions.enabled) {
      return;
    }

    const frameConfig = this.config.frameOptions;
    let headerValue = frameConfig.policy;

    if (frameConfig.policy === 'ALLOW-FROM' && frameConfig.allowFrom) {
      headerValue += ` ${frameConfig.allowFrom}`;
    }

    response.headers.set('X-Frame-Options', headerValue);
  }

  private applyContentTypeOptions(response: NextResponse): void {
    if (!this.config.contentTypeOptions.enabled) {
      return;
    }

    response.headers.set('X-Content-Type-Options', 'nosniff');
  }

  private applyReferrerPolicy(response: NextResponse): void {
    if (!this.config.referrerPolicy.enabled) {
      return;
    }

    response.headers.set('Referrer-Policy', this.config.referrerPolicy.policy);
  }

  private applyPermissionsPolicy(response: NextResponse): void {
    if (!this.config.permissionsPolicy.enabled) {
      return;
    }

    const policies = this.config.permissionsPolicy.policies;
    const directives: string[] = [];

    Object.entries(policies).forEach(([feature, enabled]) => {
      if (enabled !== undefined) {
        directives.push(`${feature}=${enabled ? '*' : '()'}`);
      }
    });

    if (directives.length > 0) {
      response.headers.set('Permissions-Policy', directives.join(', '));
    }
  }

  private applyCrossOriginEmbedderPolicy(response: NextResponse): void {
    if (!this.config.crossOriginEmbedderPolicy.enabled) {
      return;
    }

    response.headers.set('Cross-Origin-Embedder-Policy', this.config.crossOriginEmbedderPolicy.policy);
  }

  private applyCrossOriginOpenerPolicy(response: NextResponse): void {
    if (!this.config.crossOriginOpenerPolicy.enabled) {
      return;
    }

    response.headers.set('Cross-Origin-Opener-Policy', this.config.crossOriginOpenerPolicy.policy);
  }

  private applyCrossOriginResourcePolicy(response: NextResponse): void {
    if (!this.config.crossOriginResourcePolicy.enabled) {
      return;
    }

    response.headers.set('Cross-Origin-Resource-Policy', this.config.crossOriginResourcePolicy.policy);
  }

  private applyExpectCt(response: NextResponse): void {
    if (!this.config.expectCertificateTransparency.enabled) {
      return;
    }

    const expectCtConfig = this.config.expectCertificateTransparency;
    const directives: string[] = [`max-age=${expectCtConfig.maxAge}`];

    if (expectCtConfig.enforce) {
      directives.push('enforce');
    }

    if (expectCtConfig.reportUri) {
      directives.push(`report-uri="${expectCtConfig.reportUri}"`);
    }

    response.headers.set('Expect-CT', directives.join(', '));
  }

  private applyReportTo(response: NextResponse): void {
    if (!this.config.reportTo.enabled) {
      return;
    }

    const groups = this.config.reportTo.groups.map(group => {
      const endpoints = group.endpoints.map(endpoint => {
        const endpointConfig: Record<string, unknown> = { url: endpoint.url };
        if (endpoint.priority !== undefined) {
          endpointConfig.priority = endpoint.priority;
        }
        if (endpoint.weight !== undefined) {
          endpointConfig.weight = endpoint.weight;
        }
        return endpointConfig;
      });

      return {
        group: group.groupName,
        max_age: group.maxAge,
        endpoints
      };
    });

    response.headers.set('Report-To', JSON.stringify(groups));
  }

  private applyServerInfo(response: NextResponse): void {
    const serverConfig = this.config.serverInfo;

    if (serverConfig.hideServerInfo) {
      response.headers.delete('Server');
    }

    if (serverConfig.hidePoweredBy) {
      response.headers.delete('X-Powered-By');
    }

    if (serverConfig.customServerHeader) {
      response.headers.set('Server', serverConfig.customServerHeader);
    }
  }

  private applyCustomHeaders(response: NextResponse): void {
    this.config.customHeaders
      .filter(header => header.enabled)
      .forEach(header => {
        response.headers.set(header.name, header.value);
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
  return SecurityHeadersManager.getInstance().applySecurityHeaders(request, response, options);
}

export function generateCSPNonce(): string {
  return SecurityHeadersManager.getInstance().generateCSPNonce();
}

export function getSecurityHeadersStats(): SecurityHeadersStats {
  const manager = SecurityHeadersManager.getInstance();
  return manager.getStats();
}

export function updateSecurityHeadersConfig(updates: Partial<SecurityHeadersConfig>): void {
  SecurityHeadersManager.getInstance().updateConfig(updates);
}

export function generateSecurityReport(): SecurityReport {
  const manager = SecurityHeadersManager.getInstance();
  return manager.generateSecurityReport();
}

export async function reportCSPViolation(violation: CSPViolation): Promise<void> {
  const manager = SecurityHeadersManager.getInstance();
  return manager.reportCSPViolation(violation);
}

export function validateCSPConfig(config: CSPConfig): string[] {
  return SecurityHeadersManager.getInstance().validateCSPConfig(config);
} 