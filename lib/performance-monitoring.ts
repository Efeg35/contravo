export interface PerformanceConfig {
  enableRealTimeMonitoring: boolean;
  metricsRetentionDays: number;
  alertThresholds: {
    responseTime: number; // ms
    errorRate: number; // percentage
    cpuUsage: number; // percentage
    memoryUsage: number; // percentage
    diskUsage: number; // percentage
  };
  samplingRate: number; // 0-1
  batchSize: number;
  flushInterval: number; // ms
}

export interface PerformanceMetric {
  id: string;
  timestamp: Date;
  type: 'response_time' | 'throughput' | 'error_rate' | 'resource_usage' | 'custom';
  name: string;
  value: number;
  unit: string;
  tags: Record<string, string>;
  source: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // percentage
    loadAverage: number[];
    cores: number;
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
    heap: {
      used: number;
      total: number;
    };
  };
  disk: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // percentage
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    connections: number;
  };
  process: {
    pid: number;
    uptime: number; // seconds
    threads: number;
    handles: number;
  };
}

export interface PerformanceAlert {
  id: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  actions: string[];
  affectedServices: string[];
  tags: Record<string, string>;
}

export interface PerformanceReport {
  period: {
    from: Date;
    to: Date;
  };
  summary: {
    totalRequests: number;
    averageResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number; // requests per second
    uptime: number; // percentage
  };
  trends: {
    responseTime: Array<{ timestamp: Date; value: number }>;
    throughput: Array<{ timestamp: Date; value: number }>;
    errorRate: Array<{ timestamp: Date; value: number }>;
    resourceUsage: Array<{ timestamp: Date; cpu: number; memory: number }>;
  };
  topEndpoints: Array<{
    path: string;
    requests: number;
    averageResponseTime: number;
    errorRate: number;
  }>;
  alerts: PerformanceAlert[];
  recommendations: Array<{
    type: 'optimization' | 'scaling' | 'configuration';
    priority: 'low' | 'medium' | 'high';
    description: string;
    impact: string;
    effort: string;
  }>;
}

export class PerformanceMonitoring {
  private static instance: PerformanceMonitoring;
  private config: PerformanceConfig;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private systemMetrics: SystemMetrics[] = [];
  private alerts: Map<string, PerformanceAlert> = new Map();
  private metricBuffer: PerformanceMetric[] = [];
  private readonly MAX_METRICS_PER_TYPE = 10000;
  private readonly SYSTEM_METRICS_INTERVAL = 5000; // 5 seconds
  private readonly ALERT_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor(config: PerformanceConfig) {
    this.config = config;
    
    if (config.enableRealTimeMonitoring) {
      this.startSystemMetricsCollection();
      this.startAlertMonitoring();
      this.startMetricsFlush();
      this.startCleanupProcess();
    }
  }

  static getInstance(config?: PerformanceConfig): PerformanceMonitoring {
    if (!PerformanceMonitoring.instance) {
      if (!config) {
        throw new Error('Performance monitoring configuration required for first initialization');
      }
      PerformanceMonitoring.instance = new PerformanceMonitoring(config);
    }
    return PerformanceMonitoring.instance;
  }

  recordMetric(metric: Omit<PerformanceMetric, 'id' | 'timestamp'>): void {
    if (Math.random() > this.config.samplingRate) {
      return;
    }

    const fullMetric: PerformanceMetric = {
      id: this.generateMetricId(),
      timestamp: new Date(),
      ...metric
    };

    this.metricBuffer.push(fullMetric);

    if (this.metricBuffer.length >= this.config.batchSize) {
      this.flushMetrics();
    }
  }

  recordResponseTime(
    endpoint: string, 
    responseTime: number, 
    statusCode: number,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric({
      type: 'response_time',
      name: 'http_request_duration',
      value: responseTime,
      unit: 'ms',
      tags: {
        endpoint,
        status_code: statusCode.toString(),
        ...tags
      },
      source: 'http_server',
      severity: responseTime > this.config.alertThresholds.responseTime ? 'high' : 'low'
    });

    this.recordMetric({
      type: 'throughput',
      name: 'http_requests_total',
      value: 1,
      unit: 'count',
      tags: {
        endpoint,
        status_code: statusCode.toString(),
        ...tags
      },
      source: 'http_server'
    });

    if (statusCode >= 400) {
      this.recordMetric({
        type: 'error_rate',
        name: 'httperrors_total',
        value: 1,
        unit: 'count',
        tags: {
          endpoint,
          status_code: statusCode.toString(),
          ...tags
        },
        source: 'http_server',
        severity: statusCode >= 500 ? 'critical' : 'medium'
      });
    }
  }

  recordCustomMetric(
    name: string,
    value: number,
    unit: string,
    tags: Record<string, string> = {}
  ): void {
    this.recordMetric({
      type: 'custom',
      name,
      value,
      unit,
      tags,
      source: 'application'
    });
  }

  getMetrics(
    type?: PerformanceMetric['type'],
    timeRange?: { from: Date; to: Date },
    tags?: Record<string, string>
  ): PerformanceMetric[] {
    let allMetrics: PerformanceMetric[] = [];

    if (type) {
      allMetrics = this.metrics.get(type) || [];
    } else {
      for (const metrics of this.metrics.values()) {
        allMetrics.push(...metrics);
      }
    }

    if (timeRange) {
      allMetrics = allMetrics.filter(
        m => m.timestamp >= timeRange.from && m.timestamp <= timeRange.to
      );
    }

    if (tags) {
      allMetrics = allMetrics.filter(metric => {
        return Object.entries(tags).every(([key, value]) => 
          metric.tags[key] === value
        );
      });
    }

    return allMetrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSystemMetrics(timeRange?: { from: Date; to: Date }): SystemMetrics[] {
    let metrics = this.systemMetrics;

    if (timeRange) {
      metrics = metrics.filter(
        m => m.timestamp >= timeRange.from && m.timestamp <= timeRange.to
      );
    }

    return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getActiveAlerts(): PerformanceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.resolved)
      .sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
      console.log(`✅ Alert resolved: ${alert.title}`);
      return true;
    }
    return false;
  }

  generateReport(timeRange: { from: Date; to: Date }): PerformanceReport {
    const responseTimeMetrics = this.getMetrics('response_time', timeRange);
    const throughputMetrics = this.getMetrics('throughput', timeRange);
    const errorMetrics = this.getMetrics('error_rate', timeRange);
    const systemMetrics = this.getSystemMetrics(timeRange);

    // Calculate summary statistics
    const totalRequests = throughputMetrics.reduce((sum, m) => sum + m.value, 0);
    const responseTimes = responseTimeMetrics.map(m => m.value).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length 
      : 0;
    const p95ResponseTime = responseTimes.length > 0 
      ? responseTimes[Math.floor(responseTimes.length * 0.95)] 
      : 0;
    const p99ResponseTime = responseTimes.length > 0 
      ? responseTimes[Math.floor(responseTimes.length * 0.99)] 
      : 0;
    
    const totalErrors = errorMetrics.reduce((sum, m) => sum + m.value, 0);
    const errorRate = totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0;
    
    const timeRangeMs = timeRange.to.getTime() - timeRange.from.getTime();
    const throughput = totalRequests / (timeRangeMs / 1000); // requests per second

    // Calculate uptime (mock)
    const uptime = 99.9; // percentage

    // Generate trends
    const trends = this.generateTrends(timeRange, responseTimeMetrics, throughputMetrics, errorMetrics, systemMetrics);

    // Get top endpoints
    const topEndpoints = this.calculateTopEndpoints(responseTimeMetrics, throughputMetrics, errorMetrics);

    // Get alerts in time range
    const alertsInRange = Array.from(this.alerts.values())
      .filter(alert => alert.timestamp >= timeRange.from && alert.timestamp <= timeRange.to);

    // Generate recommendations
    const recommendations = this.generateRecommendations(averageResponseTime, errorRate, systemMetrics);

    return {
      period: timeRange,
      summary: {
        totalRequests,
        averageResponseTime,
        p95ResponseTime,
        p99ResponseTime,
        errorRate,
        throughput,
        uptime
      },
      trends,
      topEndpoints,
      alerts: alertsInRange,
      recommendations
    };
  }

  startProfiling(name: string): () => number {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      this.recordCustomMetric(`profile_${name}`, duration, 'ms', { operation: name });
      return duration;
    };
  }

  private flushMetrics(): void {
    if (this.metricBuffer.length === 0) return;

    const metricsToFlush = [...this.metricBuffer];
    this.metricBuffer = [];

    for (const metric of metricsToFlush) {
      const typeMetrics = this.metrics.get(metric.type) || [];
      typeMetrics.push(metric);

      if (typeMetrics.length > this.MAX_METRICS_PER_TYPE) {
        typeMetrics.splice(0, typeMetrics.length - this.MAX_METRICS_PER_TYPE);
      }

      this.metrics.set(metric.type, typeMetrics);
    }

    console.log(`📊 Flushed ${metricsToFlush.length} performance metrics`);
  }

  private collectSystemMetrics(): SystemMetrics {
    const mockMetrics: SystemMetrics = {
      timestamp: new Date(),
      cpu: {
        usage: Math.random() * 100,
        loadAverage: [Math.random() * 2, Math.random() * 2, Math.random() * 2],
        cores: 4
      },
      memory: {
        used: Math.floor(Math.random() * 8 * 1024 * 1024 * 1024),
        total: 8 * 1024 * 1024 * 1024,
        usage: Math.random() * 100,
        heap: {
          used: Math.floor(Math.random() * 512 * 1024 * 1024),
          total: 512 * 1024 * 1024
        }
      },
      disk: {
        used: Math.floor(Math.random() * 100 * 1024 * 1024 * 1024),
        total: 500 * 1024 * 1024 * 1024,
        usage: Math.random() * 100,
        iops: Math.floor(Math.random() * 1000)
      },
      network: {
        bytesIn: Math.floor(Math.random() * 1024 * 1024),
        bytesOut: Math.floor(Math.random() * 1024 * 1024),
        packetsIn: Math.floor(Math.random() * 10000),
        packetsOut: Math.floor(Math.random() * 10000),
        connections: Math.floor(Math.random() * 100)
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        threads: Math.floor(Math.random() * 20) + 1,
        handles: Math.floor(Math.random() * 1000)
      }
    };

    return mockMetrics;
  }

  private checkAlerts(systemMetrics: SystemMetrics): void {
    const now = new Date();

    // Check CPU usage
    if (systemMetrics.cpu.usage > this.config.alertThresholds.cpuUsage) {
      this.createAlert({
        type: 'threshold',
        severity: systemMetrics.cpu.usage > 90 ? 'critical' : 'high',
        title: 'High CPU Usage',
        description: `CPU usage is ${systemMetrics.cpu.usage.toFixed(1)}%`,
        metric: 'cpu_usage',
        threshold: this.config.alertThresholds.cpuUsage,
        currentValue: systemMetrics.cpu.usage,
        actions: ['Scale up resources', 'Optimize CPU-intensive operations'],
        affectedServices: ['application'],
        tags: { type: 'resource' }
      });
    }

    // Check memory usage
    if (systemMetrics.memory.usage > this.config.alertThresholds.memoryUsage) {
      this.createAlert({
        type: 'threshold',
        severity: systemMetrics.memory.usage > 95 ? 'critical' : 'high',
        title: 'High Memory Usage',
        description: `Memory usage is ${systemMetrics.memory.usage.toFixed(1)}%`,
        metric: 'memory_usage',
        threshold: this.config.alertThresholds.memoryUsage,
        currentValue: systemMetrics.memory.usage,
        actions: ['Increase memory allocation', 'Optimize memory usage', 'Check for memory leaks'],
        affectedServices: ['application'],
        tags: { type: 'resource' }
      });
    }

    // Check disk usage
    if (systemMetrics.disk.usage > this.config.alertThresholds.diskUsage) {
      this.createAlert({
        type: 'threshold',
        severity: systemMetrics.disk.usage > 95 ? 'critical' : 'high',
        title: 'High Disk Usage',
        description: `Disk usage is ${systemMetrics.disk.usage.toFixed(1)}%`,
        metric: 'disk_usage',
        threshold: this.config.alertThresholds.diskUsage,
        currentValue: systemMetrics.disk.usage,
        actions: ['Clean up disk space', 'Archive old files', 'Increase disk capacity'],
        affectedServices: ['application', 'database'],
        tags: { type: 'resource' }
      });
    }

    // Check response time
    const recentResponseTimes = this.getMetrics('response_time', {
      from: new Date(now.getTime() - 5 * 60 * 1000), // Last 5 minutes
      to: now
    });

    if (recentResponseTimes.length > 0) {
      const avgResponseTime = recentResponseTimes.reduce((sum, m) => sum + m.value, 0) / recentResponseTimes.length;
      
      if (avgResponseTime > this.config.alertThresholds.responseTime) {
        this.createAlert({
          type: 'threshold',
          severity: avgResponseTime > this.config.alertThresholds.responseTime * 2 ? 'critical' : 'high',
          title: 'High Response Time',
          description: `Average response time is ${avgResponseTime.toFixed(0)}ms`,
          metric: 'response_time',
          threshold: this.config.alertThresholds.responseTime,
          currentValue: avgResponseTime,
          actions: ['Optimize database queries', 'Scale application', 'Check for bottlenecks'],
          affectedServices: ['application'],
          tags: { type: 'performance' }
        });
      }
    }

    // Check error rate
    const recentErrors = this.getMetrics('error_rate', {
      from: new Date(now.getTime() - 5 * 60 * 1000),
      to: now
    });

    const recentRequests = this.getMetrics('throughput', {
      from: new Date(now.getTime() - 5 * 60 * 1000),
      to: now
    });

    if (recentRequests.length > 0) {
      const totalRequests = recentRequests.reduce((sum, m) => sum + m.value, 0);
      const totalErrors = recentErrors.reduce((sum, m) => sum + m.value, 0);
      const errorRate = (totalErrors / totalRequests) * 100;

      if (errorRate > this.config.alertThresholds.errorRate) {
        this.createAlert({
          type: 'threshold',
          severity: errorRate > this.config.alertThresholds.errorRate * 2 ? 'critical' : 'high',
          title: 'High Error Rate',
          description: `Error rate is ${errorRate.toFixed(1)}%`,
          metric: 'error_rate',
          threshold: this.config.alertThresholds.errorRate,
          currentValue: errorRate,
          actions: ['Check application logs', 'Fix critical bugs', 'Monitor dependencies'],
          affectedServices: ['application'],
          tags: { type: 'reliability' }
        });
      }
    }
  }

  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'resolved'>): void {
    const alertId = this.generateAlertId(alertData.metric, alertData.currentValue);
    
    const existingAlert = this.alerts.get(alertId);
    if (existingAlert && !existingAlert.resolved) {
      return;
    }

    const alert: PerformanceAlert = {
      id: alertId,
      timestamp: new Date(),
      resolved: false,
      ...alertData
    };

    this.alerts.set(alertId, alert);
    console.warn(`🚨 Performance alert: ${alert.title} - ${alert.description}`);
  }

  private generateTrends(
    timeRange: { from: Date; to: Date },
    responseTimeMetrics: PerformanceMetric[],
    throughputMetrics: PerformanceMetric[],
    errorMetrics: PerformanceMetric[],
    systemMetrics: SystemMetrics[]
  ): PerformanceReport['trends'] {
    const bucketSize = Math.max(1, Math.floor((timeRange.to.getTime() - timeRange.from.getTime()) / (60 * 1000))); // 1 minute buckets
    
    return {
      responseTime: this.bucketMetrics(responseTimeMetrics, bucketSize),
      throughput: this.bucketMetrics(throughputMetrics, bucketSize),
      errorRate: this.bucketMetrics(errorMetrics, bucketSize),
      resourceUsage: systemMetrics.map(sm => ({
        timestamp: sm.timestamp,
        cpu: sm.cpu.usage,
        memory: sm.memory.usage
      }))
    };
  }

  private bucketMetrics(metrics: PerformanceMetric[], bucketSizeMinutes: number): Array<{ timestamp: Date; value: number }> {
    const buckets = new Map<number, number[]>();
    
    for (const metric of metrics) {
      const bucketKey = Math.floor(metric.timestamp.getTime() / (bucketSizeMinutes * 60 * 1000));
      const values = buckets.get(bucketKey) || [];
      values.push(metric.value);
      buckets.set(bucketKey, values);
    }

    return Array.from(buckets.entries())
      .map(([bucketKey, values]) => ({
        timestamp: new Date(bucketKey * bucketSizeMinutes * 60 * 1000),
        value: values.reduce((sum, v) => sum + v, 0) / values.length
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  private calculateTopEndpoints(
    responseTimeMetrics: PerformanceMetric[],
    throughputMetrics: PerformanceMetric[],
    errorMetrics: PerformanceMetric[]
  ): PerformanceReport['topEndpoints'] {
    const endpointStats = new Map<string, { requests: number; totalResponseTime: number; errors: number }>();

    // Aggregate throughput
    for (const metric of throughputMetrics) {
      const endpoint = metric.tags.endpoint || 'unknown';
      const stats = endpointStats.get(endpoint) || { requests: 0, totalResponseTime: 0, errors: 0 };
      stats.requests += metric.value;
      endpointStats.set(endpoint, stats);
    }

    // Aggregate response times
    for (const metric of responseTimeMetrics) {
      const endpoint = metric.tags.endpoint || 'unknown';
      const stats = endpointStats.get(endpoint);
      if (stats) {
        stats.totalResponseTime += metric.value;
      }
    }

    // Aggregate errors
    for (const metric of errorMetrics) {
      const endpoint = metric.tags.endpoint || 'unknown';
      const stats = endpointStats.get(endpoint);
      if (stats) {
        stats.errors += metric.value;
      }
    }

    return Array.from(endpointStats.entries())
      .map(([path, stats]) => ({
        path,
        requests: stats.requests,
        averageResponseTime: stats.requests > 0 ? stats.totalResponseTime / stats.requests : 0,
        errorRate: stats.requests > 0 ? (stats.errors / stats.requests) * 100 : 0
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);
  }

  private generateRecommendations(
    averageResponseTime: number,
    errorRate: number,
    systemMetrics: SystemMetrics[]
  ): PerformanceReport['recommendations'] {
    const recommendations: PerformanceReport['recommendations'] = [];

    if (averageResponseTime > 1000) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        description: 'Optimize slow database queries and API calls',
        impact: 'Reduce response time by 30-50%',
        effort: 'Medium - requires code analysis and optimization'
      });
    }

    if (errorRate > 5) {
      recommendations.push({
        type: 'optimization',
        priority: 'high',
        description: 'Investigate and fix high error rate',
        impact: 'Improve user experience and system reliability',
        effort: 'High - requires debugging and testing'
      });
    }

    const avgCpuUsage = systemMetrics.length > 0 
      ? systemMetrics.reduce((sum, sm) => sum + sm.cpu.usage, 0) / systemMetrics.length 
      : 0;

    if (avgCpuUsage > 80) {
      recommendations.push({
        type: 'scaling',
        priority: 'high',
        description: 'Scale up CPU resources or optimize CPU-intensive operations',
        impact: 'Improve system responsiveness and handle more load',
        effort: 'Low to Medium - infrastructure scaling or code optimization'
      });
    }

    const avgMemoryUsage = systemMetrics.length > 0 
      ? systemMetrics.reduce((sum, sm) => sum + sm.memory.usage, 0) / systemMetrics.length 
      : 0;

    if (avgMemoryUsage > 85) {
      recommendations.push({
        type: 'scaling',
        priority: 'medium',
        description: 'Increase memory allocation or optimize memory usage',
        impact: 'Prevent out-of-memory errors and improve performance',
        effort: 'Low to Medium - infrastructure scaling or memory optimization'
      });
    }

    return recommendations;
  }

  private generateMetricId(): string {
    return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(metric: string, value: number): string {
    return `alert_${metric}_${Math.floor(value)}_${Date.now()}`;
  }

  private startSystemMetricsCollection(): void {
    setInterval(() => {
      const metrics = this.collectSystemMetrics();
      this.systemMetrics.push(metrics);

      if (this.systemMetrics.length > 10000) {
        this.systemMetrics.splice(0, this.systemMetrics.length - 10000);
      }

      this.recordMetric({
        type: 'resource_usage',
        name: 'cpu_usage',
        value: metrics.cpu.usage,
        unit: 'percent',
        tags: {},
        source: 'system'
      });

      this.recordMetric({
        type: 'resource_usage',
        name: 'memory_usage',
        value: metrics.memory.usage,
        unit: 'percent',
        tags: {},
        source: 'system'
      });

    }, this.SYSTEM_METRICS_INTERVAL);

    console.log('📊 Started system metrics collection');
  }

  private startAlertMonitoring(): void {
    setInterval(() => {
      if (this.systemMetrics.length > 0) {
        const latestMetrics = this.systemMetrics[this.systemMetrics.length - 1];
        this.checkAlerts(latestMetrics);
      }
    }, this.ALERT_CHECK_INTERVAL);

    console.log('🚨 Started alert monitoring');
  }

  private startMetricsFlush(): void {
    setInterval(() => {
      this.flushMetrics();
    }, this.config.flushInterval);

    console.log('💾 Started metrics flush process');
  }

  private startCleanupProcess(): void {
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.CLEANUP_INTERVAL);

    console.log('🧹 Started metrics cleanup process');
  }

  private cleanupOldMetrics(): void {
    const cutoffDate = new Date(Date.now() - this.config.metricsRetentionDays * 24 * 60 * 60 * 1000);
    let totalCleaned = 0;

    // Clean up performance metrics
    for (const [type, metrics] of this.metrics) {
      const originalLength = metrics.length;
      const filteredMetrics = metrics.filter(m => m.timestamp > cutoffDate);
      this.metrics.set(type, filteredMetrics);
      totalCleaned += originalLength - filteredMetrics.length;
    }

    // Clean up system metrics
    const originalSystemMetricsLength = this.systemMetrics.length;
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > cutoffDate);
    totalCleaned += originalSystemMetricsLength - this.systemMetrics.length;

    // Clean up resolved alerts older than 7 days
    const alertCutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    for (const [id, alert] of this.alerts) {
      if (alert.resolved && alert.resolvedAt && alert.resolvedAt < alertCutoffDate) {
        this.alerts.delete(id);
        totalCleaned++;
      }
    }

    if (totalCleaned > 0) {
      console.log(`🧹 Cleaned up ${totalCleaned} old metrics and alerts`);
    }
  }
}

// Export singleton instance with default config
export const performanceMonitoring = PerformanceMonitoring.getInstance({
  enableRealTimeMonitoring: process.env.PERFORMANCE_MONITORING !== 'false',
  metricsRetentionDays: parseInt(process.env.METRICS_RETENTION_DAYS || '7'),
  alertThresholds: {
    responseTime: parseInt(process.env.ALERT_RESPONSE_TIME_MS || '2000'),
    errorRate: parseFloat(process.env.ALERT_ERROR_RATE_PERCENT || '5'),
    cpuUsage: parseFloat(process.env.ALERT_CPU_USAGE_PERCENT || '80'),
    memoryUsage: parseFloat(process.env.ALERT_MEMORY_USAGE_PERCENT || '85'),
    diskUsage: parseFloat(process.env.ALERT_DISK_USAGE_PERCENT || '90')
  },
  samplingRate: parseFloat(process.env.METRICS_SAMPLING_RATE || '1'),
  batchSize: parseInt(process.env.METRICS_BATCH_SIZE || '100'),
  flushInterval: parseInt(process.env.METRICS_FLUSH_INTERVAL_MS || '10000')
});

// Helper functions
export function recordResponseTime(endpoint: string, responseTime: number, statusCode: number, tags?: Record<string, string>): void {
  performanceMonitoring.recordResponseTime(endpoint, responseTime, statusCode, tags);
}

export function recordCustomMetric(name: string, value: number, unit: string, tags?: Record<string, string>): void {
  performanceMonitoring.recordCustomMetric(name, value, unit, tags);
}

export function startProfiling(name: string): () => number {
  return performanceMonitoring.startProfiling(name);
}

export function getPerformanceMetrics(type?: PerformanceMetric['type'], timeRange?: { from: Date; to: Date }): PerformanceMetric[] {
  return performanceMonitoring.getMetrics(type, timeRange);
}

export function getActiveAlerts(): PerformanceAlert[] {
  return performanceMonitoring.getActiveAlerts();
}

export function generatePerformanceReport(timeRange: { from: Date; to: Date }): PerformanceReport {
  return performanceMonitoring.generateReport(timeRange);
} 