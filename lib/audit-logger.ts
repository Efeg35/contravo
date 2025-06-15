import { redisCache } from './redis-cache';

// Audit log interfaces
export interface AuditLog {
  id: string;
  timestamp: Date;
  level: AuditLevel;
  category: AuditCategory;
  action: string;
  resource: string;
  resourceId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  sessionId?: string;
  ipAddress: string;
  userAgent: string;
  method?: string;
  endpoint?: string;
  statusCode?: number;
  duration?: number; // milliseconds
  details: AuditDetails;
  metadata: AuditMetadata;
  tags: string[];
  sensitive: boolean;
  compliance: ComplianceInfo;
  geolocation?: GeolocationInfo;
  deviceInfo?: DeviceInfo;
}

export enum AuditLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

export enum AuditCategory {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  DATA_ACCESS = 'DATA_ACCESS',
  DATA_MODIFICATION = 'DATA_MODIFICATION',
  SYSTEM_CONFIGURATION = 'SYSTEM_CONFIGURATION',
  SECURITY_EVENT = 'SECURITY_EVENT',
  COMPLIANCE = 'COMPLIANCE',
  PERFORMANCE = 'PERFORMANCE',
  ERROR = 'ERROR',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  INTEGRATION = 'INTEGRATION',
  BACKUP_RESTORE = 'BACKUP_RESTORE',
  MAINTENANCE = 'MAINTENANCE'
}

export interface AuditDetails {
  description: string;
  oldValues?: Record<string, unknown>;
  newValues?: Record<string, unknown>;
  changedFields?: string[];
  reason?: string;
  impact?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  additionalInfo?: Record<string, unknown>;
}

export interface AuditMetadata {
  correlationId?: string;
  traceId?: string;
  parentLogId?: string;
  batchId?: string;
  version: string;
  environment: string;
  service: string;
  component?: string;
  feature?: string;
}

export interface ComplianceInfo {
  gdprRelevant: boolean;
  dataSubject?: string;
  legalBasis?: string;
  retentionPeriod: number; // days
  anonymizationRequired: boolean;
  encryptionRequired: boolean;
  auditTrailRequired: boolean;
}

export interface GeolocationInfo {
  country?: string;
  region?: string;
  city?: string;
  timezone?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface DeviceInfo {
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  os?: string;
  browser?: string;
  browserVersion?: string;
  screenResolution?: string;
  language?: string;
}

// Audit configuration
export interface AuditConfig {
  enabled: boolean;
  logLevel: AuditLevel;
  categories: AuditCategory[];
  storage: {
    primary: 'database' | 'file' | 'elasticsearch' | 'redis';
    backup?: 'database' | 'file' | 's3' | 'gcs';
    compression: boolean;
    encryption: boolean;
  };
  retention: {
    defaultDays: number;
    categorySpecific: Record<AuditCategory, number>;
    archiveAfterDays: number;
    deleteAfterDays: number;
  };
  realtime: {
    enabled: boolean;
    websocketEndpoint?: string;
    webhookUrl?: string;
    alertThresholds: Record<AuditLevel, number>;
  };
  compliance: {
    gdprEnabled: boolean;
    anonymizeAfterDays: number;
    encryptSensitiveData: boolean;
    requireConsent: boolean;
  };
  performance: {
    batchSize: number;
    flushInterval: number; // milliseconds
    maxMemoryUsage: number; // MB
    asyncLogging: boolean;
  };
  filtering: {
    excludeEndpoints: string[];
    excludeUsers: string[];
    excludeIPs: string[];
    sensitiveFields: string[];
  };
}

// Audit search and filtering
export interface AuditSearchQuery {
  startDate?: Date;
  endDate?: Date;
  levels?: AuditLevel[];
  categories?: AuditCategory[];
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  resource?: string;
  action?: string;
  tags?: string[];
  text?: string; // Full-text search
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'level' | 'category' | 'userId';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditSearchResult {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  aggregations?: {
    byLevel: Record<AuditLevel, number>;
    byCategory: Record<AuditCategory, number>;
    byUser: Record<string, number>;
    byHour: Record<string, number>;
  };
}

export class AuditLogger {
  private static instance: AuditLogger;
  private config: AuditConfig;
  private logBuffer: AuditLog[] = [];
  private flushTimer?: NodeJS.Timeout;
  private stats: AuditStats = {
    totalLogs: 0,
    logsByLevel: {} as Record<AuditLevel, number>,
    logsByCategory: {} as Record<AuditCategory, number>,
    errorCount: 0,
    lastFlush: new Date(),
    bufferSize: 0
  };

  private readonly REDIS_KEY_PREFIX = 'audit_log:';
  private readonly BUFFER_KEY = 'audit_buffer';
  private readonly STATS_KEY = 'audit_stats';

  private constructor(config: AuditConfig) {
    this.config = config;
    this.initializeStats();
    this.startPeriodicFlush();
    this.startStatsCollection();
  }

  static getInstance(config?: AuditConfig): AuditLogger {
    if (!AuditLogger.instance) {
      if (!config) {
        throw new Error('Audit logger configuration required for first initialization');
      }
      AuditLogger.instance = new AuditLogger(config);
    }
    return AuditLogger.instance;
  }

  // Main logging method
  async log(logData: Partial<AuditLog>): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    try {
      // Create complete audit log
      const auditLog = this.createAuditLog(logData);

      // Check if should be logged based on level and category
      if (!this.shouldLog(auditLog)) {
        return auditLog.id;
      }

      // Apply filtering
      if (this.isFiltered(auditLog)) {
        return auditLog.id;
      }

      // Handle sensitive data
      const processedLog = await this.processSensitiveData(auditLog);

      // Add to buffer or log immediately
      if (this.config.performance.asyncLogging) {
        await this.addToBuffer(processedLog);
      } else {
        await this.writeLog(processedLog);
      }

      // Update statistics
      this.updateStats(processedLog);

      // Real-time notifications
      if (this.config.realtime.enabled) {
        await this.sendRealtimeNotification(processedLog);
      }

      console.log(`📝 Audit log created: ${auditLog.action} by ${auditLog.userId || 'system'}`);
      return auditLog.id;

    } catch {
      console.error('❌ Audit logging error:', _error);
      this.stats.errorCount++;
      return '';
    }
  }

  // Convenience methods for different log levels
  async debug(action: string, details: Partial<AuditLog>): Promise<string> {
    return this.log({
      ...details,
      level: AuditLevel.DEBUG,
      action
    });
  }

  async info(action: string, details: Partial<AuditLog>): Promise<string> {
    return this.log({
      ...details,
      level: AuditLevel.INFO,
      action
    });
  }

  async warn(action: string, details: Partial<AuditLog>): Promise<string> {
    return this.log({
      ...details,
      level: AuditLevel.WARN,
      action
    });
  }

  async error(action: string, details: Partial<AuditLog>): Promise<string> {
    return this.log({
      ...details,
      level: AuditLevel.ERROR,
      action
    });
  }

  async critical(action: string, details: Partial<AuditLog>): Promise<string> {
    return this.log({
      ...details,
      level: AuditLevel.CRITICAL,
      action
    });
  }

  // Specific audit methods
  async logAuthentication(
    action: 'LOGIN' | 'LOGOUT' | 'LOGIN_FAILED' | 'PASSWORD_CHANGE' | 'MFA_ENABLED',
    userId: string,
    details: Partial<AuditLog>
  ): Promise<string> {
    return this.log({
      ...details,
      category: AuditCategory.AUTHENTICATION,
      action,
      userId,
      resource: 'authentication',
      level: action === 'LOGIN_FAILED' ? AuditLevel.WARN : AuditLevel.INFO,
      compliance: {
        gdprRelevant: true,
        retentionPeriod: 365,
        anonymizationRequired: false,
        encryptionRequired: true,
        auditTrailRequired: true
      }
    });
  }

  async logDataAccess(
    resource: string,
    resourceId: string,
    userId: string,
    details: Partial<AuditLog>
  ): Promise<string> {
    return this.log({
      ...details,
      category: AuditCategory.DATA_ACCESS,
      action: 'READ',
      resource,
      resourceId,
      userId,
      level: AuditLevel.INFO,
      compliance: {
        gdprRelevant: true,
        retentionPeriod: 180,
        anonymizationRequired: true,
        encryptionRequired: false,
        auditTrailRequired: true
      }
    });
  }

  async logDataModification(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    resource: string,
    resourceId: string,
    userId: string,
    oldValues?: Record<string, unknown>,
    newValues?: Record<string, unknown>
  ): Promise<string> {
    return this.log({
      category: AuditCategory.DATA_MODIFICATION,
      action,
      resource,
      resourceId,
      userId,
      level: action === 'DELETE' ? AuditLevel.WARN : AuditLevel.INFO,
      details: {
        description: `${action} operation on ${resource}`,
        oldValues,
        newValues,
        changedFields: oldValues && newValues ? 
          Object.keys(newValues).filter(key => oldValues[key] !== newValues[key]) : undefined
      },
      compliance: {
        gdprRelevant: true,
        retentionPeriod: 2555, // 7 years for financial records
        anonymizationRequired: false,
        encryptionRequired: true,
        auditTrailRequired: true
      }
    });
  }

  async logSecurityEvent(
    event: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details: Partial<AuditLog>
  ): Promise<string> {
    return this.log({
      ...details,
      category: AuditCategory.SECURITY_EVENT,
      action: event,
      level: severity === 'CRITICAL' ? AuditLevel.CRITICAL : 
             severity === 'HIGH' ? AuditLevel.ERROR :
             severity === 'MEDIUM' ? AuditLevel.WARN : AuditLevel.INFO,
      resource: 'security',
      sensitive: true,
      compliance: {
        gdprRelevant: false,
        retentionPeriod: 2555, // 7 years for security events
        anonymizationRequired: false,
        encryptionRequired: true,
        auditTrailRequired: true
      }
    });
  }

  async logSystemEvent(
    event: string,
    component: string,
    details: Partial<AuditLog>
  ): Promise<string> {
    return this.log({
      ...details,
      category: AuditCategory.SYSTEM_CONFIGURATION,
      action: event,
      resource: 'system',
      level: AuditLevel.INFO,
      metadata: {
        ...details.metadata,
        component,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'contravo'
      }
    });
  }

  // Search and query methods
  async search(query: AuditSearchQuery): Promise<AuditSearchResult> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll return mock data structure
      
      const mockLogs: AuditLog[] = [];
      const total = 0;
      const page = Math.floor((query.offset || 0) / (query.limit || 50)) + 1;
      const pageSize = query.limit || 50;

      return {
        logs: mockLogs,
        total,
        page,
        pageSize,
        hasMore: total > (query.offset || 0) + pageSize,
        aggregations: {
          byLevel: {} as Record<AuditLevel, number>,
          byCategory: {} as Record<AuditCategory, number>,
          byUser: {},
          byHour: {}
        }
      };

    } catch {
      console.error('❌ Audit search error:', _error);
      throw new Error('Audit search failed');
    }
  }

  async getLogById(id: string): Promise<AuditLog | null> {
    try {
      const logData = await redisCache.get<string>(`${this.REDIS_KEY_PREFIX}${id}`);
      return logData ? JSON.parse(logData) : null;
    } catch {
      console.error('❌ Error retrieving audit log:', _error);
      return null;
    }
  }

  async getLogsByUser(userId: string, limit = 100): Promise<AuditLog[]> {
    try {
      const key = `${this.REDIS_KEY_PREFIX}user:${userId}`;
      const logs = await redisCache.get<AuditLog[]>(key) || [];
      return logs.slice(0, limit);
    } catch {
      console.error('Error getting logs by user:', _error);
      return [];
    }
  }

  async getLogsByResource(resource: string, resourceId?: string, limit = 100): Promise<AuditLog[]> {
    try {
      const key = resourceId 
        ? `${this.REDIS_KEY_PREFIX}resource:${resource}:${resourceId}`
        : `${this.REDIS_KEY_PREFIX}resource:${resource}`;
      const logs = await redisCache.get<AuditLog[]>(key) || [];
      return logs.slice(0, limit);
    } catch {
      console.error('Error getting logs by resource:', _error);
      return [];
    }
  }

  // Statistics and reporting
  getStats(): AuditStats {
    return { ...this.stats };
  }

  async generateReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' | 'pdf' = 'json'
  ): Promise<string> {
    try {
      const query: AuditSearchQuery = {
        startDate,
        endDate,
        limit: 10000 // Large limit for reports
      };

      const results = await this.search(query);
      
      switch (format) {
        case 'csv':
          return this.generateCSVReport(results.logs);
        case 'pdf':
          return this.generatePDFReport(results.logs);
        default:
          return JSON.stringify(results, null, 2);
      }

    } catch {
      console.error('❌ Report generation error:', _error);
      throw new Error('Report generation failed');
    }
  }

  // GDPR compliance methods
  async anonymizeUserData(userId: string): Promise<number> {
    try {
      // In real implementation, this would update all logs for the user
      console.log(`🔒 Anonymizing audit logs for user: ${userId}`);
      return 0; // Return count of anonymized logs
    } catch {
      console.error('❌ User data anonymization error:', _error);
      throw new Error('User data anonymization failed');
    }
  }

  async deleteUserData(userId: string): Promise<number> {
    try {
      // In real implementation, this would delete all logs for the user
      console.log(`🗑️ Deleting audit logs for user: ${userId}`);
      return 0; // Return count of deleted logs
    } catch {
      console.error('❌ User data deletion error:', _error);
      throw new Error('User data deletion failed');
    }
  }

  async exportUserData(userId: string): Promise<AuditLog[]> {
    try {
      return await this.getLogsByUser(userId, 10000);
    } catch {
      console.error('❌ User data export error:', _error);
      throw new Error('User data export failed');
    }
  }

  // Private helper methods
  private createAuditLog(logData: Partial<AuditLog>): AuditLog {
    const now = new Date();
    
    return {
      id: this.generateLogId(),
      timestamp: now,
      level: logData.level || AuditLevel.INFO,
      category: logData.category || AuditCategory.SYSTEM_CONFIGURATION,
      action: logData.action || 'UNKNOWN',
      resource: logData.resource || 'unknown',
      resourceId: logData.resourceId,
      userId: logData.userId,
      userEmail: logData.userEmail,
      userRole: logData.userRole,
      sessionId: logData.sessionId,
      ipAddress: logData.ipAddress || '127.0.0.1',
      userAgent: logData.userAgent || 'unknown',
      method: logData.method,
      endpoint: logData.endpoint,
      statusCode: logData.statusCode,
      duration: logData.duration,
      details: logData.details || {
        description: logData.action || 'System event'
      },
      metadata: {
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        service: 'contravo',
        ...logData.metadata
      },
      tags: logData.tags || [],
      sensitive: logData.sensitive || false,
      compliance: logData.compliance || {
        gdprRelevant: false,
        retentionPeriod: this.config.retention.defaultDays,
        anonymizationRequired: false,
        encryptionRequired: false,
        auditTrailRequired: true
      },
      geolocation: logData.geolocation,
      deviceInfo: logData.deviceInfo
    };
  }

  private shouldLog(log: AuditLog): boolean {
    // Check log level
    const levelPriority = {
      [AuditLevel.DEBUG]: 0,
      [AuditLevel.INFO]: 1,
      [AuditLevel.WARN]: 2,
      [AuditLevel.ERROR]: 3,
      [AuditLevel.CRITICAL]: 4
    };

    if (levelPriority[log.level] < levelPriority[this.config.logLevel]) {
      return false;
    }

    // Check category
    if (!this.config.categories.includes(log.category)) {
      return false;
    }

    return true;
  }

  private isFiltered(log: AuditLog): boolean {
    // Check excluded endpoints
    if (log.endpoint && this.config.filtering.excludeEndpoints.some(ep => 
      log.endpoint?.includes(ep))) {
      return true;
    }

    // Check excluded users
    if (log.userId && this.config.filtering.excludeUsers.includes(log.userId)) {
      return true;
    }

    // Check excluded IPs
    if (this.config.filtering.excludeIPs.includes(log.ipAddress)) {
      return true;
    }

    return false;
  }

  private async processSensitiveData(log: AuditLog): Promise<AuditLog> {
    if (!log.sensitive && !log.compliance.encryptionRequired) {
      return log;
    }

    // In real implementation, this would encrypt sensitive fields
    const processedLog = { ...log };
    
    // Mask sensitive fields
    for (const field of this.config.filtering.sensitiveFields) {
      if (processedLog.details.additionalInfo?.[field]) {
        processedLog.details.additionalInfo[field] = '***MASKED***';
      }
    }

    return processedLog;
  }

  private async addToBuffer(log: AuditLog): Promise<void> {
    this.logBuffer.push(log);
    this.stats.bufferSize = this.logBuffer.length;

    // Flush if buffer is full
    if (this.logBuffer.length >= this.config.performance.batchSize) {
      await this.flushBuffer();
    }
  }

  private async writeLog(log: AuditLog): Promise<void> {
    try {
      // Store in Redis (in real implementation, would use primary storage)
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}${log.id}`,
        JSON.stringify(log),
        { ttl: log.compliance.retentionPeriod * 24 * 60 * 60 }
      );

      // Add to time-based index
      const dateKey = log.timestamp.toISOString().split('T')[0];
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}date:${dateKey}:${log.id}`,
        '1',
        { ttl: log.compliance.retentionPeriod * 24 * 60 * 60 }
      );

    } catch {
      console.error('❌ Error writing audit log:', _error);
      throw _error;
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.logBuffer.length === 0) return;

    try {
      const logsToFlush = [...this.logBuffer];
      this.logBuffer = [];
      this.stats.bufferSize = 0;

      // Write all logs in batch
      await Promise.all(logsToFlush.map(log => this.writeLog(log)));
      
      this.stats.lastFlush = new Date();
      console.log(`📝 Flushed ${logsToFlush.length} audit logs`);

    } catch {
      console.error('❌ Buffer flush error:', _error);
      // Re-add logs to buffer on failure
      this.logBuffer.unshift(...this.logBuffer);
    }
  }

  private async sendRealtimeNotification(log: AuditLog): Promise<void> {
    if (!this.config.realtime.enabled) return;

    try {
      // Check if log level meets alert threshold
      const threshold = this.config.realtime.alertThresholds[log.level];
      if (!threshold) return;

      // In real implementation, would send to WebSocket or webhook
      console.log(`🔔 Real-time audit alert: ${log.level} - ${log.action}`);

    } catch {
      console.error('❌ Real-time notification error:', _error);
    }
  }

  private updateStats(log: AuditLog): void {
    this.stats.totalLogs++;
    this.stats.logsByLevel[log.level] = (this.stats.logsByLevel[log.level] || 0) + 1;
    this.stats.logsByCategory[log.category] = (this.stats.logsByCategory[log.category] || 0) + 1;
  }

  private generateCSVReport(logs: AuditLog[]): string {
    const headers = [
      'Timestamp', 'Level', 'Category', 'Action', 'Resource', 'User ID', 
      'IP Address', 'Description'
    ];
    
    const rows = logs.map(log => [
      log.timestamp.toISOString(),
      log.level,
      log.category,
      log.action,
      log.resource,
      log.userId || '',
      log.ipAddress,
      log.details.description
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private generatePDFReport(logs: AuditLog[]): string {
    // In real implementation, would generate actual PDF
    return `PDF Report with ${logs.length} audit logs`;
  }

  private generateLogId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeStats(): void {
    Object.values(AuditLevel).forEach(level => {
      this.stats.logsByLevel[level] = 0;
    });
    
    Object.values(AuditCategory).forEach(category => {
      this.stats.logsByCategory[category] = 0;
    });
  }

  private startPeriodicFlush(): void {
    if (!this.config.performance.asyncLogging) return;

    this.flushTimer = setInterval(async () => {
      await this.flushBuffer();
    }, this.config.performance.flushInterval);
  }

  private startStatsCollection(): void {
    setInterval(async () => {
      try {
        await redisCache.set(this.STATS_KEY, JSON.stringify(this.stats), { ttl: 3600 });
      } catch {
        console.error('❌ Stats collection error:', _error);
      }
    }, 60000); // Update stats every minute
  }
}

// Supporting interfaces
interface AuditStats {
  totalLogs: number;
  logsByLevel: Record<AuditLevel, number>;
  logsByCategory: Record<AuditCategory, number>;
  errorCount: number;
  lastFlush: Date;
  bufferSize: number;
}

// Default configuration
export const defaultAuditConfig: AuditConfig = {
  enabled: true,
  logLevel: AuditLevel.INFO,
  categories: Object.values(AuditCategory),
  storage: {
    primary: 'redis',
    backup: 'database',
    compression: true,
    encryption: true
  },
  retention: {
    defaultDays: 365,
    categorySpecific: {
      [AuditCategory.AUTHENTICATION]: 365,
      [AuditCategory.AUTHORIZATION]: 365,
      [AuditCategory.USER_MANAGEMENT]: 2555, // 7 years
      [AuditCategory.DATA_ACCESS]: 180,
      [AuditCategory.DATA_MODIFICATION]: 2555,
      [AuditCategory.SYSTEM_CONFIGURATION]: 1095, // 3 years
      [AuditCategory.SECURITY_EVENT]: 2555,
      [AuditCategory.COMPLIANCE]: 2555,
      [AuditCategory.PERFORMANCE]: 30,
      [AuditCategory.ERROR]: 365,
      [AuditCategory.BUSINESS_LOGIC]: 1095,
      [AuditCategory.INTEGRATION]: 365,
      [AuditCategory.BACKUP_RESTORE]: 1095,
      [AuditCategory.MAINTENANCE]: 365
    },
    archiveAfterDays: 365,
    deleteAfterDays: 2555
  },
  realtime: {
    enabled: true,
    alertThresholds: {
      [AuditLevel.DEBUG]: 0,
      [AuditLevel.INFO]: 0,
      [AuditLevel.WARN]: 10,
      [AuditLevel.ERROR]: 5,
      [AuditLevel.CRITICAL]: 1
    }
  },
  compliance: {
    gdprEnabled: true,
    anonymizeAfterDays: 1095, // 3 years
    encryptSensitiveData: true,
    requireConsent: false
  },
  performance: {
    batchSize: 100,
    flushInterval: 5000, // 5 seconds
    maxMemoryUsage: 100, // 100MB
    asyncLogging: true
  },
  filtering: {
    excludeEndpoints: ['/health', '/metrics', '/favicon.ico'],
    excludeUsers: ['system', 'healthcheck'],
    excludeIPs: ['127.0.0.1'],
    sensitiveFields: ['password', 'token', 'secret', 'key', 'ssn', 'creditCard']
  }
};

// Export singleton instance
export const auditLogger = AuditLogger.getInstance(defaultAuditConfig);

// Helper functions
export async function logAudit(logData: Partial<AuditLog>): Promise<string> {
  return auditLogger.log(logData);
}

export async function logUserAction(
  action: string,
  userId: string,
  resource: string,
  details?: Partial<AuditLog>
): Promise<string> {
  return auditLogger.info(action, {
    ...details,
    userId,
    resource,
    category: AuditCategory.USER_MANAGEMENT
  });
}

export async function logSecurityEvent(
  event: string,
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  details?: Partial<AuditLog>
): Promise<string> {
  return auditLogger.logSecurityEvent(event, severity, details || {});
}

export function getAuditStats() {
  return auditLogger.getStats();
} 