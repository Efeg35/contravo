import { redisCache } from './redis-cache';
import { auditLogger, AuditLevel, AuditCategory } from './audit-logger';
// Error monitoring interfaces
export interface ErrorEvent {
  id: string;
  timestamp: Date;
  level: ErrorLevel;
  category: ErrorCategory;
  type: ErrorType;
  message: string;
  stack?: string;
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  ipAddress?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  statusCode?: number;
  context: ErrorContext;
  metadata: ErrorMetadata;
  fingerprint: string;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
  count: number;
  firstSeen: Date;
  lastSeen: Date;
}

export enum ErrorLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  FATAL = 'FATAL'
}

export enum ErrorCategory {
  APPLICATION = 'APPLICATION',
  SYSTEM = 'SYSTEM',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  INTEGRATION = 'INTEGRATION',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY'
}

export enum ErrorType {
  EXCEPTION = 'EXCEPTION',
  HTTP_ERROR = 'HTTP_ERROR',
  TIMEOUT = 'TIMEOUT',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  RATE_LIMIT = 'RATE_LIMIT',
  BUSINESS_ERROR = 'BUSINESS_ERROR',
  SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export interface ErrorContext {
  component?: string;
  function?: string;
  line?: number;
  column?: number;
  file?: string;
  version?: string;
  environment?: string;
  buildId?: string;
  additionalData?: Record<string, unknown>;
}

export interface ErrorMetadata {
  browser?: string;
  browserVersion?: string;
  os?: string;
  device?: string;
  screen?: string;
  language?: string;
  timezone?: string;
  referrer?: string;
  performance?: PerformanceMetrics;
}

export interface PerformanceMetrics {
  responseTime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
  diskUsage?: number;
  networkLatency?: number;
  databaseQueryTime?: number;
}

// Alert configuration
export interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: AlertCondition[];
  actions: AlertAction[];
  cooldown: number; // minutes
  priority: AlertPriority;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertCondition {
  type: 'error_count' | 'error_rate' | 'response_time' | 'custom';
  operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  timeWindow: number; // minutes
  filters?: {
    levels?: ErrorLevel[];
    categories?: ErrorCategory[];
    sources?: string[];
    users?: string[];
  };
}

export interface AlertAction {
  type: 'email' | 'webhook' | 'slack' | 'sms' | 'push';
  target: string;
  template?: string;
  enabled: boolean;
}

export enum AlertPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Alert {
  id: string;
  ruleId: string;
  ruleName: string;
  timestamp: Date;
  priority: AlertPriority;
  title: string;
  message: string;
  triggerEvent: ErrorEvent;
  context: Record<string, unknown>;
  status: 'active' | 'acknowledged' | 'resolved';
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolvedBy?: string;
  resolvedAt?: Date;
  escalated: boolean;
  escalatedAt?: Date;
  notificationsSent: NotificationRecord[];
}

export interface NotificationRecord {
  type: string;
  target: string;
  sentAt: Date;
  success: boolean;
  error?: string;
}

// Error monitoring configuration
export interface ErrorMonitorConfig {
  enabled: boolean;
  captureUnhandledExceptions: boolean;
  captureUnhandledRejections: boolean;
  captureConsoleErrors: boolean;
  maxStackTraceDepth: number;
  maxBreadcrumbs: number;
  sampleRate: number; // 0-1
  beforeSend?: (event: ErrorEvent) => ErrorEvent | null;
  beforeAlert?: (alert: Alert) => Alert | null;
  storage: {
    maxEvents: number;
    retentionDays: number;
    compressionEnabled: boolean;
  };
  performance: {
    trackResponseTimes: boolean;
    trackMemoryUsage: boolean;
    trackDatabaseQueries: boolean;
    slowQueryThreshold: number; // ms
  };
  alerts: {
    enabled: boolean;
    defaultRules: AlertRule[];
    escalationEnabled: boolean;
    escalationDelay: number; // minutes
  };
  integrations: {
    slack?: {
      webhookUrl: string;
      channel: string;
      username: string;
    };
    email?: {
      smtpHost: string;
      smtpPort: number;
      username: string;
      password: string;
      from: string;
    };
  };
}

export class ErrorMonitor {
  private static instance: ErrorMonitor;
  private config: ErrorMonitorConfig;
  private events: Map<string, ErrorEvent> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private stats: ErrorStats = {
    totalErrors: 0,
    errorsByLevel: {} as Record<ErrorLevel, number>,
    errorsByCategory: {} as Record<ErrorCategory, number>,
    errorsBySource: {},
    alertsTriggered: 0,
    alertsResolved: 0,
    lastError: null,
    uptime: Date.now()
  };

  private readonly REDIS_KEY_PREFIX = 'error_monitor:';
  private readonly MAX_EVENTS_IN_MEMORY = 1000;
  private readonly FINGERPRINT_CACHE_TTL = 3600; // 1 hour

  private constructor(config: ErrorMonitorConfig) {
    this.config = config;
    this.initializeRules();
    this.setupGlobalHandlers();
    this.startPeriodicTasks();
  }

  static getInstance(config?: ErrorMonitorConfig): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      if (!config) {
        throw new Error('Error monitor configuration required for first initialization');
      }
      ErrorMonitor.instance = new ErrorMonitor(config);
    }
    return ErrorMonitor.instance;
  }

  // Main error capture method
  async captureError(
    error: Error | string,
    context?: Partial<ErrorContext>,
    metadata?: Partial<ErrorMetadata>
  ): Promise<string> {
    if (!this.config.enabled) {
      return '';
    }

    try {
      // Create error event
      const errorEvent = this.createErrorEvent(error, context, metadata);

      // Apply sampling
      if (Math.random() > this.config.sampleRate) {
        return errorEvent.id;
      }

      // Apply beforeSend filter
      const filteredEvent = this.config.beforeSend ? 
        this.config.beforeSend(errorEvent) : errorEvent;

      if (!filteredEvent) {
        return errorEvent.id;
      }

      // Check for duplicate (fingerprinting)
      const existingEvent = await this.findDuplicateEvent(filteredEvent);
      if (existingEvent) {
        await this.updateExistingEvent(existingEvent, filteredEvent);
        return existingEvent.id;
      }

      // Store new event
      await this.storeEvent(filteredEvent);

      // Update statistics
      this.updateStats(filteredEvent);

      // Check alert rules
      await this.checkAlertRules(filteredEvent);

      // Log to audit system
      await auditLogger.log({
        level: this.mapErrorLevelToAuditLevel(filteredEvent.level),
        category: AuditCategory.ERROR,
        action: 'ERROR_CAPTURED',
        resource: 'error_monitor',
        details: {
          description: `Error captured: ${filteredEvent.message}`,
          additionalInfo: {
            errorId: filteredEvent.id,
            errorLevel: filteredEvent.level,
            errorCategory: filteredEvent.category
          }
        },
        userId: filteredEvent.userId,
        ipAddress: filteredEvent.ipAddress,
        userAgent: filteredEvent.userAgent
      });

      console.error(`🚨 Error captured: ${filteredEvent.level} - ${filteredEvent.message}`);
      return filteredEvent.id;

    } catch (monitorError) {
      console.error('❌ Error monitor failed:');
      return '';
    }
  }

  // Convenience methods for different error levels
  async captureException(error: Error, context?: Partial<ErrorContext>): Promise<string> {
    return this.captureError(error, {
      ...context,
      component: context?.component || 'unknown'
    });
  }

  async captureMessage(
    message: string, 
    _level: ErrorLevel = ErrorLevel.INFO,
    context?: Partial<ErrorContext>
  ): Promise<string> {
    const error = new Error(message);
    return this.captureError(error, context);
  }

  async captureHttpError(
    statusCode: number,
    url: string,
    method: string,
    context?: Partial<ErrorContext>
  ): Promise<string> {
    const message = `HTTP ${statusCode} error: ${method} ${url}`;
    return this.captureError(message, {
      ...context,
      component: 'http_client'
    }, {
      performance: {
        responseTime: context?.additionalData?.responseTime as number
      }
    });
  }

  async capturePerformanceIssue(
    metric: string,
    value: number,
    threshold: number,
    context?: Partial<ErrorContext>
  ): Promise<string> {
    const message = `Performance issue: ${metric} (${value}) exceeded threshold (${threshold})`;
    return this.captureError(message, {
      ...context,
      component: 'performance_monitor'
    });
  }

  // Alert management
  async createAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const alertRule: AlertRule = {
      ...rule,
      id: this.generateId('rule'),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.rules.set(alertRule.id, alertRule);
    await this.storeAlertRule(alertRule);

    console.log(`📋 Alert rule created: ${alertRule.name}`);
    return alertRule.id;
  }

  async updateAlertRule(ruleId: string, updates: Partial<AlertRule>): Promise<boolean> {
    const rule = this.rules.get(ruleId);
    if (!rule) return false;

    const updatedRule = {
      ...rule,
      ...updates,
      updatedAt: new Date()
    };

    this.rules.set(ruleId, updatedRule);
    await this.storeAlertRule(updatedRule);

    console.log(`📝 Alert rule updated: ${ruleId}`);
    return true;
  }

  async deleteAlertRule(ruleId: string): Promise<boolean> {
    const deleted = this.rules.delete(ruleId);
    if (deleted) {
      await redisCache.delete(`${this.REDIS_KEY_PREFIX}rule:${ruleId}`);
      console.log(`🗑️ Alert rule deleted: ${ruleId}`);
    }
    return deleted;
  }

  // Error resolution
  async resolveError(errorId: string, resolvedBy: string, reason?: string): Promise<boolean> {
    const event = this.events.get(errorId) || await this.getEventById(errorId);
    if (!event) return false;

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolvedBy = resolvedBy;

    await this.storeEvent(event);

    // Log resolution
    await auditLogger.info('ERROR_RESOLVED', {
      category: AuditCategory.ERROR,
      resource: 'error_monitor',
      resourceId: errorId,
      userId: resolvedBy,
      details: {
        description: `Error resolved: ${event.message}`,
        reason: reason || 'Manual resolution'
      }
    });

    console.log(`✅ Error resolved: ${errorId} by ${resolvedBy}`);
    return true;
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'acknowledged';
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    await this.storeAlert(alert);

    console.log(`👍 Alert acknowledged: ${alertId} by ${acknowledgedBy}`);
    return true;
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolvedBy = resolvedBy;
    alert.resolvedAt = new Date();

    await this.storeAlert(alert);
    this.stats.alertsResolved++;

    console.log(`✅ Alert resolved: ${alertId} by ${resolvedBy}`);
    return true;
  }

  // Search and query methods
  async searchErrors(query: {
    levels?: ErrorLevel[];
    categories?: ErrorCategory[];
    sources?: string[];
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<{
    events: ErrorEvent[];
    total: number;
    hasMore: boolean;
  }> {
    // In real implementation, this would query the database
    const allEvents = Array.from(this.events.values());
    let filteredEvents = allEvents;

    // Apply filters
    if (query.levels) {
      filteredEvents = filteredEvents.filter(e => query.levels!.includes(e.level));
    }
    if (query.categories) {
      filteredEvents = filteredEvents.filter(e => query.categories!.includes(e.category));
    }
    if (query.sources) {
      filteredEvents = filteredEvents.filter(e => query.sources!.includes(e.source));
    }
    if (query.resolved !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.resolved === query.resolved);
    }
    if (query.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= query.startDate!);
    }
    if (query.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= query.endDate!);
    }

    // Sort by timestamp (newest first)
    filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    const paginatedEvents = filteredEvents.slice(offset, offset + limit);

    return {
      events: paginatedEvents,
      total: filteredEvents.length,
      hasMore: offset + limit < filteredEvents.length
    };
  }

  async getEventById(eventId: string): Promise<ErrorEvent | null> {
    // Check memory first
    const memoryEvent = this.events.get(eventId);
    if (memoryEvent) return memoryEvent;

    // Check Redis
    try {
      const eventData = await redisCache.get<string>(`${this.REDIS_KEY_PREFIX}event:${eventId}`);
      return eventData ? JSON.parse(eventData) : null;
    } catch (error) {
      console.error('Error retrieving event:');
      return null;
    }
  }

  // Statistics and reporting
  getStats(): ErrorStats {
    return { ...this.stats };
  }

  async generateReport(
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv' = 'json'
  ): Promise<string> {
    const searchResult = await this.searchErrors({
      startDate,
      endDate,
      limit: 10000
    });

    if (format === 'csv') {
      return this.generateCSVReport(searchResult.events);
    }

    return JSON.stringify({
      period: { startDate, endDate },
      summary: {
        totalErrors: searchResult.total,
        errorsByLevel: this.calculateErrorsByLevel(searchResult.events),
        errorsByCategory: this.calculateErrorsByCategory(searchResult.events),
        topErrors: this.getTopErrors(searchResult.events),
        resolutionRate: this.calculateResolutionRate(searchResult.events)
      },
      events: searchResult.events
    }, null, 2);
  }

  // Private helper methods
  private createErrorEvent(
    error: Error | string,
    context?: Partial<ErrorContext>,
    metadata?: Partial<ErrorMetadata>
  ): ErrorEvent {
    const now = new Date();
    const errorObj = typeof error === 'string' ? new Error(error) : error;

    const event: ErrorEvent = {
      id: this.generateId('error'),
      timestamp: now,
      level: this.determineErrorLevel(errorObj),
      category: this.determineErrorCategory(errorObj, context),
      type: this.determineErrorType(errorObj),
      message: errorObj.message,
      stack: errorObj.stack,
      source: context?.component || 'unknown',
      context: {
        component: context?.component,
        function: context?.function,
        file: context?.file,
        line: context?.line,
        column: context?.column,
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        buildId: process.env.BUILD_ID,
        ...context
      },
      metadata: {
        ...metadata
      },
      fingerprint: this.generateFingerprint(errorObj, context),
      resolved: false,
      tags: [],
      count: 1,
      firstSeen: now,
      lastSeen: now
    };

    return event;
  }

  private generateFingerprint(error: Error, context?: Partial<ErrorContext>): string {
    const components = [
      error.message,
      context?.component || 'unknown',
      context?.function || 'unknown',
      error.stack?.split('\n')[1] || 'unknown' // First stack frame
    ];
    
    return Buffer.from(components.join('|')).toString('base64').slice(0, 16);
  }

  private async findDuplicateEvent(event: ErrorEvent): Promise<ErrorEvent | null> {
    // Check in-memory events first
    for (const existingEvent of this.events.values()) {
      if (existingEvent.fingerprint === event.fingerprint) {
        return existingEvent;
      }
    }

    // Check Redis cache
    try {
      const cachedEventId = await redisCache.get<string>(
        `${this.REDIS_KEY_PREFIX}fingerprint:${event.fingerprint}`
      );
      
      if (cachedEventId) {
        return await this.getEventById(cachedEventId);
      }
    } catch (error) {
      console.error('Error checking fingerprint cache:');
    }

    return null;
  }

  private async updateExistingEvent(existingEvent: ErrorEvent, newEvent: ErrorEvent): Promise<void> {
    existingEvent.count++;
    existingEvent.lastSeen = newEvent.timestamp;
    
    // Update context if new information is available
    if (newEvent.userId && !existingEvent.userId) {
      existingEvent.userId = newEvent.userId;
    }
    
    await this.storeEvent(existingEvent);
  }

  private async storeEvent(event: ErrorEvent): Promise<void> {
    // Store in memory (with size limit)
    if (this.events.size >= this.MAX_EVENTS_IN_MEMORY) {
      // Remove oldest event
      const oldestEvent = Array.from(this.events.values())
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];
      this.events.delete(oldestEvent.id);
    }
    
    this.events.set(event.id, event);

    // Store in Redis
    try {
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}event:${event.id}`,
        JSON.stringify(event),
        { ttl: this.config.storage.retentionDays * 24 * 60 * 60 }
      );

      // Cache fingerprint
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}fingerprint:${event.fingerprint}`,
        event.id,
        { ttl: this.FINGERPRINT_CACHE_TTL }
      );
    } catch (error) {
      console.error('Error storing event:');
    }
  }

  private async storeAlert(alert: Alert): Promise<void> {
    this.alerts.set(alert.id, alert);
    
    try {
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}alert:${alert.id}`,
        JSON.stringify(alert),
        { ttl: 30 * 24 * 60 * 60 } // 30 days
      );
    } catch (error) {
      console.error('Error storing alert:');
    }
  }

  private async storeAlertRule(rule: AlertRule): Promise<void> {
    try {
      await redisCache.set(
        `${this.REDIS_KEY_PREFIX}rule:${rule.id}`,
        JSON.stringify(rule)
      );
    } catch (error) {
      console.error('Error storing alert rule:');
    }
  }

  private async checkAlertRules(event: ErrorEvent): Promise<void> {
    if (!this.config.alerts.enabled) return;

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      const shouldTrigger = await this.evaluateAlertRule(rule, event);
      if (shouldTrigger) {
        await this.triggerAlert(rule, event);
      }
    }
  }

  private async evaluateAlertRule(rule: AlertRule, event: ErrorEvent): Promise<boolean> {
    for (const condition of rule.conditions) {
      // Apply filters
      if (condition.filters) {
        if (condition.filters.levels && !condition.filters.levels.includes(event.level)) {
          continue;
        }
        if (condition.filters.categories && !condition.filters.categories.includes(event.category)) {
          continue;
        }
        if (condition.filters.sources && !condition.filters.sources.includes(event.source)) {
          continue;
        }
      }

      // Evaluate condition
      const result = await this.evaluateCondition(condition, event);
      if (result) {
        return true;
      }
    }

    return false;
  }

  private async evaluateCondition(condition: AlertCondition, _event: ErrorEvent): Promise<boolean> {
    const now = Date.now();
    const windowStart = now - condition.timeWindow * 60 * 1000;

    switch (condition.type) {
      case 'error_count':
        const errorCount = await this.getErrorCountInWindow(windowStart, now, condition.filters);
        return this.compareValues(errorCount, condition.operator, condition.threshold);
      
      case 'error_rate':
        const totalRequests = await this.getTotalRequestsInWindow(windowStart, now);
        const errorRate = totalRequests > 0 ? (await this.getErrorCountInWindow(windowStart, now, condition.filters)) / totalRequests : 0;
        return this.compareValues(errorRate, condition.operator, condition.threshold);
      
      default:
        return false;
    }
  }

  private async triggerAlert(rule: AlertRule, triggerEvent: ErrorEvent): Promise<void> {
    const alert: Alert = {
      id: this.generateId('alert'),
      ruleId: rule.id,
      ruleName: rule.name,
      timestamp: new Date(),
      priority: rule.priority,
      title: `Alert: ${rule.name}`,
      message: `Alert triggered by error: ${triggerEvent.message}`,
      triggerEvent,
      context: {
        errorId: triggerEvent.id,
        errorLevel: triggerEvent.level,
        errorCategory: triggerEvent.category
      },
      status: 'active',
      escalated: false,
      notificationsSent: []
    };

    // Apply beforeAlert filter
    const filteredAlert = this.config.beforeAlert ? 
      this.config.beforeAlert(alert) : alert;

    if (!filteredAlert) return;

    await this.storeAlert(filteredAlert);
    this.stats.alertsTriggered++;

    // Send notifications
    await this.sendAlertNotifications(filteredAlert, rule);

    console.error(`🚨 ALERT TRIGGERED: ${rule.name} - ${triggerEvent.message}`);
  }

  private async sendAlertNotifications(alert: Alert, rule: AlertRule): Promise<void> {
    for (const action of rule.actions) {
      if (!action.enabled) continue;

      try {
        const success = await this.sendNotification(action, alert);
        
        alert.notificationsSent.push({
          type: action.type,
          target: action.target,
          sentAt: new Date(),
          success,
          error: success ? undefined : 'Failed to send notification'
        });
      } catch (error) {
        console.error(`Failed to send ${action.type} notification:`);
        
        alert.notificationsSent.push({
          type: action.type,
          target: action.target,
          sentAt: new Date(),
          success: false,
          error: (error as Error).message
        });
      }
    }

    await this.storeAlert(alert);
  }

  private async sendNotification(action: AlertAction, alert: Alert): Promise<boolean> {
    switch (action.type) {
      case 'email':
        return this.sendEmailNotification(action.target, alert);
      case 'webhook':
        return this.sendWebhookNotification(action.target, alert);
      case 'slack':
        return this.sendSlackNotification(action.target, alert);
      default:
        console.log(`📧 Mock notification sent: ${action.type} to ${action.target}`);
        return true;
    }
  }

  private async sendEmailNotification(email: string, alert: Alert): Promise<boolean> {
    // Mock email sending
    console.log(`📧 Email notification sent to ${email}: ${alert.title}`);
    return true;
  }

  private async sendWebhookNotification(url: string, alert: Alert): Promise<boolean> {
    // Mock webhook sending
    console.log(`🔗 Webhook notification sent to ${url}: ${alert.title}`);
    return true;
  }

  private async sendSlackNotification(channel: string, alert: Alert): Promise<boolean> {
    // Mock Slack notification
    console.log(`💬 Slack notification sent to ${channel}: ${alert.title}`);
    return true;
  }

  // Utility methods
  private determineErrorLevel(error: Error): ErrorLevel {
    const message = error.message.toLowerCase();
    
    if (message.includes('fatal') || message.includes('critical')) {
      return ErrorLevel.FATAL;
    }
    if (message.includes('warning') || message.includes('warn')) {
      return ErrorLevel.WARNING;
    }
    if (message.includes('info')) {
      return ErrorLevel.INFO;
    }
    if (message.includes('debug')) {
      return ErrorLevel.DEBUG;
    }
    
    return ErrorLevel.ERROR;
  }

  private determineErrorCategory(error: Error, context?: Partial<ErrorContext>): ErrorCategory {
    const message = error.message.toLowerCase();
    const component = context?.component?.toLowerCase() || '';

    if (message.includes('auth') || component.includes('auth')) {
      return ErrorCategory.AUTHENTICATION;
    }
    if (message.includes('permission') || message.includes('forbidden')) {
      return ErrorCategory.AUTHORIZATION;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }
    if (message.includes('database') || message.includes('sql')) {
      return ErrorCategory.DATABASE;
    }
    if (message.includes('network') || message.includes('connection')) {
      return ErrorCategory.NETWORK;
    }
    if (message.includes('timeout')) {
      return ErrorCategory.PERFORMANCE;
    }
    
    return ErrorCategory.APPLICATION;
  }

  private determineErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('timeout')) return ErrorType.TIMEOUT;
    if (message.includes('connection')) return ErrorType.CONNECTION_ERROR;
    if (message.includes('validation')) return ErrorType.VALIDATION_ERROR;
    if (message.includes('auth')) return ErrorType.AUTHENTICATION_ERROR;
    if (message.includes('permission')) return ErrorType.AUTHORIZATION_ERROR;
    if (message.includes('not found')) return ErrorType.NOT_FOUND;
    if (message.includes('rate limit')) return ErrorType.RATE_LIMIT;
    
    return ErrorType.EXCEPTION;
  }

  private mapErrorLevelToAuditLevel(errorLevel: ErrorLevel): AuditLevel {
    const mapping = {
      [ErrorLevel.DEBUG]: AuditLevel.DEBUG,
      [ErrorLevel.INFO]: AuditLevel.INFO,
      [ErrorLevel.WARNING]: AuditLevel.WARN,
      [ErrorLevel.ERROR]: AuditLevel.ERROR,
      [ErrorLevel.FATAL]: AuditLevel.CRITICAL
    };
    
    return mapping[errorLevel];
  }

  private compareValues(actual: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return actual > threshold;
      case 'gte': return actual >= threshold;
      case 'lt': return actual < threshold;
      case 'lte': return actual <= threshold;
      case 'eq': return actual === threshold;
      case 'neq': return actual !== threshold;
      default: return false;
    }
  }

  private async getErrorCountInWindow(
    _startTime: number, 
    _endTime: number, 
    _filters?: AlertCondition['filters']
  ): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 10);
  }

  private async getTotalRequestsInWindow(_startTime: number, _endTime: number): Promise<number> {
    // Mock implementation
    return Math.floor(Math.random() * 1000) + 100;
  }

  private updateStats(event: ErrorEvent): void {
    this.stats.totalErrors++;
    this.stats.errorsByLevel[event.level] = (this.stats.errorsByLevel[event.level] || 0) + 1;
    this.stats.errorsByCategory[event.category] = (this.stats.errorsByCategory[event.category] || 0) + 1;
    this.stats.errorsBySource[event.source] = (this.stats.errorsBySource[event.source] || 0) + 1;
    this.stats.lastError = event;
  }

  private calculateErrorsByLevel(events: ErrorEvent[]): Record<ErrorLevel, number> {
    const result = {} as Record<ErrorLevel, number>;
    for (const event of events) {
      result[event.level] = (result[event.level] || 0) + 1;
    }
    return result;
  }

  private calculateErrorsByCategory(events: ErrorEvent[]): Record<ErrorCategory, number> {
    const result = {} as Record<ErrorCategory, number>;
    for (const event of events) {
      result[event.category] = (result[event.category] || 0) + 1;
    }
    return result;
  }

  private getTopErrors(events: ErrorEvent[]): Array<{ message: string; count: number }> {
    const errorCounts = new Map<string, number>();
    
    for (const event of events) {
      const count = errorCounts.get(event.message) || 0;
      errorCounts.set(event.message, count + 1);
    }

    return Array.from(errorCounts.entries())
      .map(([message, count]) => ({ message, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private calculateResolutionRate(events: ErrorEvent[]): number {
    const resolvedCount = events.filter(e => e.resolved).length;
    return events.length > 0 ? (resolvedCount / events.length) * 100 : 0;
  }

  private generateCSVReport(events: ErrorEvent[]): string {
    const headers = [
      'ID', 'Timestamp', 'Level', 'Category', 'Type', 'Message', 
      'Source', 'User ID', 'Resolved', 'Count'
    ];
    
    const rows = events.map(event => [
      event.id,
      event.timestamp.toISOString(),
      event.level,
      event.category,
      event.type,
      event.message.replace(/,/g, ';'), // Escape commas
      event.source,
      event.userId || '',
      event.resolved ? 'Yes' : 'No',
      event.count.toString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  private setupGlobalHandlers(): void {
    if (!this.config.captureUnhandledExceptions) return;

    // Capture unhandled exceptions
    process.on('uncaughtException', (error) => {
      this.captureException(error, {
        component: 'global_handler',
        function: 'uncaughtException'
      });
    });

    // Capture unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      const error = reason instanceof Error ? reason : new Error(String(reason));
      this.captureException(error, {
        component: 'global_handler',
        function: 'unhandledRejection'
      });
    });
  }

  private initializeRules(): void {
    for (const rule of this.config.alerts.defaultRules) {
      this.rules.set(rule.id, rule);
    }
    console.log(`📋 Initialized ${this.rules.size} alert rules`);
  }

  private startPeriodicTasks(): void {
    // Cleanup old events
    setInterval(() => {
      this.cleanupOldEvents();
    }, 60 * 60 * 1000); // Every hour

    // Update statistics
    setInterval(() => {
      this.updatePeriodicStats();
    }, 60 * 1000); // Every minute
  }

  private cleanupOldEvents(): void {
    const cutoff = Date.now() - this.config.storage.retentionDays * 24 * 60 * 60 * 1000;
    
    for (const [id, event] of this.events) {
      if (event.timestamp.getTime() < cutoff) {
        this.events.delete(id);
      }
    }
  }

  private updatePeriodicStats(): void {
    // Update uptime
    this.stats.uptime = Date.now();
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Supporting interfaces
interface ErrorStats {
  totalErrors: number;
  errorsByLevel: Record<ErrorLevel, number>;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySource: Record<string, number>;
  alertsTriggered: number;
  alertsResolved: number;
  lastError: ErrorEvent | null;
  uptime: number;
}

// Default configuration
export const defaultErrorMonitorConfig: ErrorMonitorConfig = {
  enabled: true,
  captureUnhandledExceptions: true,
  captureUnhandledRejections: true,
  captureConsoleErrors: false,
  maxStackTraceDepth: 50,
  maxBreadcrumbs: 100,
  sampleRate: 1.0,
  storage: {
    maxEvents: 10000,
    retentionDays: 30,
    compressionEnabled: true
  },
  performance: {
    trackResponseTimes: true,
    trackMemoryUsage: true,
    trackDatabaseQueries: true,
    slowQueryThreshold: 1000
  },
  alerts: {
    enabled: true,
    defaultRules: [],
    escalationEnabled: true,
    escalationDelay: 30
  },
  integrations: {}
};

// Export singleton instance
export const errorMonitor = ErrorMonitor.getInstance(defaultErrorMonitorConfig);

// Helper functions
export async function captureError(
  error: Error | string,
  context?: Partial<ErrorContext>,
  metadata?: Partial<ErrorMetadata>
): Promise<string> {
  return errorMonitor.captureError(error, context, metadata);
}

export async function captureException(error: Error, context?: Partial<ErrorContext>): Promise<string> {
  return errorMonitor.captureException(error, context);
}

export async function captureMessage(
  message: string,
  level: ErrorLevel = ErrorLevel.INFO,
  context?: Partial<ErrorContext>
): Promise<string> {
  return errorMonitor.captureMessage(message, level, context);
}

export function getErrorStats() {
  return errorMonitor.getStats();
} 