import { z } from 'zod';
// import DOMPurify from 'isomorphic-dompurify';

// Validation result interface
export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
  warnings?: ValidationWarning[];
  sanitized?: boolean;
  originalData?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestion?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  handled: boolean;
}

// Validation configurations
export interface ValidationConfig {
  enableXSSProtection: boolean;
  enableSQLInjectionProtection: boolean;
  enableNoSQLInjectionProtection: boolean;
  enablePathTraversalProtection: boolean;
  enableCommandInjectionProtection: boolean;
  enableHTMLSanitization: boolean;
  enableURLValidation: boolean;
  enableEmailValidation: boolean;
  enablePhoneValidation: boolean;
  enableFileValidation: boolean;
  enableImageValidation: boolean;
  enableJSONValidation: boolean;
  enableCSVValidation: boolean;
  enableRateLimiting: boolean;
  maxInputLength: number;
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  allowedImageTypes: string[];
  allowedDomains: string[];
  blockedPatterns: string[];
  customRules: ValidationRule[];
  logViolations: boolean;
  strictMode: boolean;
}

export interface ValidationRule {
  id: string;
  name: string;
  pattern: RegExp;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  action: 'warn' | 'block' | 'sanitize';
  enabled: boolean;
}

// Predefined dangerous patterns
const DANGEROUS_PATTERNS = {
  // XSS patterns
  XSS_SCRIPT: /<script[^>]*>.*?<\/script>/gi,
  XSS_JAVASCRIPT: /javascript:/gi,
  XSS_ONERROR: /onerror\s*=/gi,
  XSS_ONLOAD: /onload\s*=/gi,
  XSS_ONCLICK: /onclick\s*=/gi,
  XSS_EVAL: /eval\s*\(/gi,
  XSS_EXPRESSION: /expression\s*\(/gi,
  
  // SQL Injection patterns
  SQL_UNION: /union\s+select/gi,
  SQL_DROP: /drop\s+table|drop\s+database/gi,
  SQL_DELETE: /delete\s+from/gi,
  SQL_UPDATE: /update\s+.*\s+set/gi,
  SQL_INSERT: /insert\s+into/gi,
  SQL_SELECT: /select\s+.*\s+from/gi,
  SQL_COMMENT: /--|\*\/|\*\*|\/\*/gi,
  SQL_QUOTE: /('|(\\')|(')|(\\")|(")|(;))/gi,
  
  // NoSQL Injection patterns
  NOSQL_MONGO: /\$where|\$regex|\$ne|\$gt|\$lt|\$in|\$nin/gi,
  NOSQL_OPERATORS: /\$eval|\$function|\$mapReduce/gi,
  
  // Path Traversal patterns
  PATH_DOT_DOT: /\.\./gi,
  PATH_TRAVERSAL: /\/\.\.|\\\.\.|\%2e\%2e|\%2f\%2e\%2e/gi,
  PATH_ABSOLUTE: /^\/|^[a-zA-Z]:\\/gi,
  
  // Command Injection patterns
  CMD_INJECTION: /;|\||\&\&|\|\||`|\$\(|\$\{/gi,
  CMD_COMMANDS: /wget|curl|nc|netcat|bash|sh|cmd|powershell|python|perl|ruby|php/gi,
  
  // Other dangerous patterns
  LDAP_INJECTION: /\*|\(|\)|\\|\/|\+|=|<|>|;|,|"/gi,
  XML_INJECTION: /<\?xml|<!DOCTYPE|<!ENTITY/gi,
  TEMPLATE_INJECTION: /\{\{|\}\}|\$\{|\%\{/gi,
  SSRF_PATTERNS: /localhost|127\.0\.0\.1|0\.0\.0\.0|::1|file:\/\/|ftp:\/\/|gopher:\/\//gi
};

// Common validation schemas
export const CommonSchemas = {
  email: z.string().email('Geçerli bir email adresi giriniz'),
  phone: z.string().regex(/^(\+90|0)?[5][0-9]{9}$/, 'Geçerli bir telefon numarası giriniz'),
  url: z.string().url('Geçerli bir URL giriniz'),
  uuid: z.string().uuid('Geçerli bir UUID giriniz'),
  password: z.string()
    .min(8, 'Şifre en az 8 karakter olmalıdır')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Şifre en az bir büyük harf, bir küçük harf, bir rakam ve bir özel karakter içermelidir'),
  name: z.string()
    .min(2, 'İsim en az 2 karakter olmalıdır')
    .max(50, 'İsim en fazla 50 karakter olabilir')
    .regex(/^[a-zA-ZçğıöşüÇĞIİÖŞÜ\s]+$/, 'İsim sadece harf ve boşluk içerebilir'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  ip: z.string().ip('Geçerli bir IP adresi giriniz'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tarih YYYY-MM-DD formatında olmalıdır'),
  time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Saat HH:MM veya HH:MM:SS formatında olmalıdır'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Geçerli bir hex renk kodu giriniz'),
  creditCard: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/, 'Geçerli bir kredi kartı numarası giriniz'),
  iban: z.string().regex(/^TR\d{2}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\s?\d{2}$/, 'Geçerli bir IBAN numarası giriniz'),
  tckn: z.string().regex(/^\d{11}$/, 'TC Kimlik Numarası 11 haneli olmalıdır'),
  taxNumber: z.string().regex(/^\d{8,11}$/, 'Vergi numarası 8-11 haneli olmalıdır')
};

export class InputValidator {
  private static instance: InputValidator;
  private config: ValidationConfig;
  private violations: Map<string, ViolationRecord[]> = new Map();
  private customRules: Map<string, ValidationRule> = new Map();

  private readonly VIOLATION_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_VIOLATIONS_PER_IP = 1000;

  private constructor(config: ValidationConfig) {
    this.config = config;
    this.initializeCustomRules();
    this.startViolationCleanup();
  }

  static getInstance(config?: ValidationConfig): InputValidator {
    if (!InputValidator.instance) {
      if (!config) {
        throw new Error('Input validator configuration required for first initialization');
      }
      InputValidator.instance = new InputValidator(config);
    }
    return InputValidator.instance;
  }

  // Main validation method
  async validate<T = unknown>(
    data: any,
    schema?: z.ZodSchema<T>,
    options?: {
      context?: string;
      userIP?: string;
      userId?: string;
      skipSanitization?: boolean;
      customRules?: string[];
    }
  ): Promise<ValidationResult<T>> {
    const startTime = Date.now();
    const result: ValidationResult<T> = {
      success: false,
      errors: [],
      warnings: [],
      originalData: data
    };

    try {
      // Step 1: Pre-validation checks
      const preValidation = await this.preValidate(data, options);
      if (!preValidation.success) {
        result.errors = preValidation.errors;
        this.logViolation(options?.userIP, options?.context, preValidation.errors);
        return result;
      }

      // Step 2: Security validation
      const securityValidation = await this.validateSecurity(data, options);
      if (!securityValidation.success) {
        result.errors = [...(result.errors || []), ...(securityValidation.errors || [])];
        this.logViolation(options?.userIP, options?.context, securityValidation.errors);
      }

      // Step 3: Data sanitization
      let sanitizedData = data;
      if (!options?.skipSanitization) {
        const sanitizationResult = await this.sanitizeData(data);
        sanitizedData = sanitizationResult.data;
        result.sanitized = sanitizationResult.sanitized;
        result.warnings = [...(result.warnings || []), ...(sanitizationResult.warnings || [])];
      }

      // Step 4: Schema validation
      if (schema) {
        const schemaValidation = await this.validateSchema(sanitizedData, schema);
        if (!schemaValidation.success) {
          result.errors = [...(result.errors || []), ...(schemaValidation.errors || [])];
        } else {
          result.data = schemaValidation.data;
        }
      } else {
        result.data = sanitizedData as T;
      }

      // Step 5: Custom rules validation
      if (options?.customRules) {
        const customValidation = await this.validateCustomRules(sanitizedData, options.customRules);
        if (!customValidation.success) {
          result.errors = [...(result.errors || []), ...(customValidation.errors || [])];
        }
        result.warnings = [...(result.warnings || []), ...(customValidation.warnings || [])];
      }

      // Step 6: Final success check
      result.success = !result.errors || result.errors.length === 0;

      const executionTime = Date.now() - startTime;
      console.log(`🔍 Input validation completed in ${executionTime}ms`);

      return result;

    } catch (error) {
      console.error('❌ Input validation error:');
      result.errors = [{
        field: 'system',
        message: 'Validation system error',
        code: 'VALIDATION_ERROR',
        severity: 'critical'
      }];
      return result;
    }
  }

  // Pre-validation checks
  private async preValidate(data: any, _options?: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    // Check input length
    const dataString = JSON.stringify(data);
    if (dataString.length > this.config.maxInputLength) {
      errors.push({
        field: 'input',
        message: `Input çok uzun. Maksimum ${this.config.maxInputLength} karakter`,
        code: 'INPUT_TOO_LONG',
        severity: 'high'
      });
    }

    // Check for null/undefined critical data
    if (data === null || data === undefined) {
      errors.push({
        field: 'input',
        message: 'Boş veri gönderilemez',
        code: 'NULL_INPUT',
        severity: 'medium'
      });
    }

    // Check for circular references
    try {
      JSON.stringify(data);
    } catch (error) {
      errors.push({
        field: 'input',
        message: 'Geçersiz veri yapısı',
        code: 'INVALID_STRUCTURE',
        severity: 'high'
      });
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  // Security validation
  private async validateSecurity(data: any, _options?: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Convert data to string for pattern matching
    const dataString = this.dataToString(data);

    // XSS Protection
    if (this.config.enableXSSProtection) {
      const xssResult = this.checkXSS(dataString);
      if (xssResult.detected) {
        errors.push({
          field: 'security',
          message: 'Potansiyel XSS saldırısı tespit edildi',
          code: 'XSS_DETECTED',
          severity: 'critical',
          suggestion: 'Güvenli karakterler kullanın'
        });
      }
    }

    // SQL Injection Protection
    if (this.config.enableSQLInjectionProtection) {
      const sqlResult = this.checkSQLInjection(dataString);
      if (sqlResult.detected) {
        errors.push({
          field: 'security',
          message: 'Potansiyel SQL Injection saldırısı tespit edildi',
          code: 'SQL_INJECTION_DETECTED',
          severity: 'critical',
          suggestion: 'Parametreli sorgular kullanın'
        });
      }
    }

    // NoSQL Injection Protection
    if (this.config.enableNoSQLInjectionProtection) {
      const nosqlResult = this.checkNoSQLInjection(dataString);
      if (nosqlResult.detected) {
        errors.push({
          field: 'security',
          message: 'Potansiyel NoSQL Injection saldırısı tespit edildi',
          code: 'NOSQL_INJECTION_DETECTED',
          severity: 'critical'
        });
      }
    }

    // Path Traversal Protection
    if (this.config.enablePathTraversalProtection) {
      const pathResult = this.checkPathTraversal(dataString);
      if (pathResult.detected) {
        errors.push({
          field: 'security',
          message: 'Potansiyel path traversal saldırısı tespit edildi',
          code: 'PATH_TRAVERSAL_DETECTED',
          severity: 'high'
        });
      }
    }

    // Command Injection Protection
    if (this.config.enableCommandInjectionProtection) {
      const cmdResult = this.checkCommandInjection(dataString);
      if (cmdResult.detected) {
        errors.push({
          field: 'security',
          message: 'Potansiyel command injection saldırısı tespit edildi',
          code: 'COMMAND_INJECTION_DETECTED',
          severity: 'critical'
        });
      }
    }

    // Check blocked patterns
    for (const pattern of this.config.blockedPatterns) {
      const regex = new RegExp(pattern, 'gi');
      if (regex.test(dataString)) {
        warnings.push({
          field: 'security',
          message: `Yasaklı pattern tespit edildi: ${pattern}`,
          code: 'BLOCKED_PATTERN',
          handled: false
        });
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Data sanitization
  private async sanitizeData(data: any): Promise<{ data: any; sanitized: boolean; warnings: ValidationWarning[] }> {
    const warnings: ValidationWarning[] = [];
    let sanitized = false;

    if (typeof data === 'string') {
      let cleanData = data;

      // HTML sanitization (simplified version)
      if (this.config.enableHTMLSanitization) {
        const originalLength = cleanData.length;
        // Simple HTML tag removal for now
        cleanData = cleanData.replace(/<[^>]*>/g, '');
        
        if (cleanData.length !== originalLength) {
          sanitized = true;
          warnings.push({
            field: 'html',
            message: 'HTML içerik temizlendi',
            code: 'HTML_SANITIZED',
            handled: true
          });
        }
      }

      // Remove null bytes
      if (cleanData.includes('\0')) {
        cleanData = cleanData.replace(/\0/g, '');
        sanitized = true;
        warnings.push({
          field: 'encoding',
          message: 'Null byte karakterler kaldırıldı',
          code: 'NULL_BYTES_REMOVED',
          handled: true
        });
      }

      // Normalize whitespace
      const normalizedData = cleanData.replace(/\s+/g, ' ').trim();
      if (normalizedData !== cleanData) {
        cleanData = normalizedData;
        sanitized = true;
        warnings.push({
          field: 'formatting',
          message: 'Boşluk karakterleri normalize edildi',
          code: 'WHITESPACE_NORMALIZED',
          handled: true
        });
      }

      return { data: cleanData, sanitized, warnings };
    }

    if (typeof data === 'object' && data !== null) {
      const cleanData: any = Array.isArray(data) ? [] : {};
      
      for (const key in data as Record<string, unknown>) {
        if ((data as Record<string, unknown>).hasOwnProperty(key)) {
          const result = await this.sanitizeData((data as Record<string, unknown>)[key]);
          (cleanData as Record<string, unknown>)[key] = result.data;
          if (result.sanitized) sanitized = true;
          warnings.push(...result.warnings);
        }
      }

      return { data: cleanData, sanitized, warnings };
    }

    return { data, sanitized, warnings };
  }

  // Schema validation
  private async validateSchema<T>(data: any, schema: z.ZodSchema<T>): Promise<ValidationResult<T>> {
    try {
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data
        };
      } else {
        const errors: ValidationError[] = result.error.errors.map(err => ({
          field: err.path.join('.') || 'unknown',
          message: err.message,
          code: err.code,
          severity: 'medium'
        }));

        return {
          success: false,
          errors
        };
      }
    } catch (error) {
      return {
        success: false,
        errors: [{
          field: 'schema',
          message: 'Schema validation failed',
          code: 'SCHEMA_ERROR',
          severity: 'high'
        }]
      };
    }
  }

  // Custom rules validation
  private async validateCustomRules(data: any, ruleIds: string[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const dataString = this.dataToString(data);

    for (const ruleId of ruleIds) {
      const rule = this.customRules.get(ruleId);
      if (!rule || !rule.enabled) continue;

      if (rule.pattern.test(dataString)) {
        if (rule.action === 'block') {
          errors.push({
            field: 'custom_rule',
            message: rule.message,
            code: rule.id,
            severity: rule.severity
          });
        } else if (rule.action === 'warn') {
          warnings.push({
            field: 'custom_rule',
            message: rule.message,
            code: rule.id,
            handled: false
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  // Security check methods
  private checkXSS(data: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
      if (name.startsWith('XSS_') && pattern.test(data)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  private checkSQLInjection(data: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
      if (name.startsWith('SQL_') && pattern.test(data)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  private checkNoSQLInjection(data: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
      if (name.startsWith('NOSQL_') && pattern.test(data)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  private checkPathTraversal(data: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
      if (name.startsWith('PATH_') && pattern.test(data)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  private checkCommandInjection(data: string): { detected: boolean; patterns: string[] } {
    const detectedPatterns: string[] = [];
    
    for (const [name, pattern] of Object.entries(DANGEROUS_PATTERNS)) {
      if (name.startsWith('CMD_') && pattern.test(data)) {
        detectedPatterns.push(name);
      }
    }

    return {
      detected: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  // Utility methods
  private dataToString(data: any): string {
    if (typeof data === 'string') return data;
    if (typeof data === 'object') return JSON.stringify(data);
    return String(data);
  }

  private logViolation(userIP?: string, context?: string, errors?: ValidationError[]): void {
    if (!this.config.logViolations || !errors) return;

    const key = userIP || 'unknown';
    const violation: ViolationRecord = {
      id: this.generateViolationId(),
      userIP: key,
      context: context || 'unknown',
      errors,
      timestamp: new Date(),
      severity: this.calculateSeverity(errors)
    };

    if (!this.violations.has(key)) {
      this.violations.set(key, []);
    }

    const violations = this.violations.get(key)!;
    violations.push(violation);

    // Keep only recent violations
    if (violations.length > this.MAX_VIOLATIONS_PER_IP) {
      violations.shift();
    }

    console.warn(`🚨 Input validation violation: ${key} in ${context}`);
  }

  private calculateSeverity(errors: ValidationError[]): 'low' | 'medium' | 'high' | 'critical' {
    const severities = errors.map(e => e.severity);
    if (severities.includes('critical')) return 'critical';
    if (severities.includes('high')) return 'high';
    if (severities.includes('medium')) return 'medium';
    return 'low';
  }

  private generateViolationId(): string {
    return `validation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeCustomRules(): void {
    for (const rule of this.config.customRules) {
      this.customRules.set(rule.id, rule);
    }
  }

  private startViolationCleanup(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.VIOLATION_TTL;
      
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

  // Public methods for rule management
  addCustomRule(rule: ValidationRule): void {
    this.customRules.set(rule.id, rule);
    console.log(`📋 Custom validation rule added: ${rule.name}`);
  }

  removeCustomRule(ruleId: string): boolean {
    const deleted = this.customRules.delete(ruleId);
    if (deleted) {
      console.log(`🗑️ Custom validation rule removed: ${ruleId}`);
    }
    return deleted;
  }

  getViolationStats(): {
    totalViolations: number;
    violationsByIP: Map<string, number>;
    violationsBySeverity: Record<string, number>;
    recentViolations: ViolationRecord[];
  } {
    let totalViolations = 0;
    const violationsByIP = new Map<string, number>();
    const violationsBySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
    const recentViolations: ViolationRecord[] = [];

    for (const [ip, violations] of this.violations) {
      totalViolations += violations.length;
      violationsByIP.set(ip, violations.length);
      
      for (const violation of violations) {
        violationsBySeverity[violation.severity]++;
        recentViolations.push(violation);
      }
    }

    recentViolations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return {
      totalViolations,
      violationsByIP,
      violationsBySeverity,
      recentViolations: recentViolations.slice(0, 100)
    };
  }
}

// Supporting interfaces
interface ViolationRecord {
  id: string;
  userIP: string;
  context: string;
  errors: ValidationError[];
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Default configuration
export const defaultValidationConfig: ValidationConfig = {
  enableXSSProtection: true,
  enableSQLInjectionProtection: true,
  enableNoSQLInjectionProtection: true,
  enablePathTraversalProtection: true,
  enableCommandInjectionProtection: true,
  enableHTMLSanitization: true,
  enableURLValidation: true,
  enableEmailValidation: true,
  enablePhoneValidation: true,
  enableFileValidation: true,
  enableImageValidation: true,
  enableJSONValidation: true,
  enableCSVValidation: true,
  enableRateLimiting: true,
  maxInputLength: 1024 * 1024, // 1MB
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt'],
  allowedImageTypes: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  allowedDomains: [],
  blockedPatterns: [
    'admin',
    'administrator',
    'root',
    'system',
    'test',
    'debug'
  ],
  customRules: [],
  logViolations: true,
  strictMode: false
};

// Export singleton instance
export const inputValidator = InputValidator.getInstance(defaultValidationConfig);

// Helper functions
export async function validateInput<T = unknown>(
  data: any,
  schema?: z.ZodSchema<T>,
  options?: {
    context?: string;
    userIP?: string;
    userId?: string;
    skipSanitization?: boolean;
    customRules?: string[];
  }
): Promise<ValidationResult<T>> {
  return inputValidator.validate(data, schema, options);
}

export function createValidationSchema(fields: Record<string, z.ZodType<unknown>>): z.ZodSchema {
  return z.object(fields);
}

export function getValidationStats() {
  return inputValidator.getViolationStats();
} 