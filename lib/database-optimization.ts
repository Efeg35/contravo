export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  connectionLimit: number;
  acquireTimeout: number;
  timeout: number;
  reconnect: boolean;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingConnections: number;
  maxConnections: number;
  connectionErrors: number;
  averageConnectionTime: number;
  totalQueries: number;
  slowQueries: number;
  failedQueries: number;
}

export interface QueryMetrics {
  id: string;
  query: string;
  normalizedQuery: string;
  executionTime: number;
  rowsAffected: number;
  rowsExamined: number;
  timestamp: Date;
  database: string;
  table?: string;
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';
  indexesUsed: string[];
  fullTableScan: boolean;
  lockTime: number;
  memoryUsage: number;
  cpuTime: number;
  ioOperations: number;
  cacheHit: boolean;
  connectionId: string;
  userId?: string;
  source: string;
}

export interface SlowQueryAlert {
  id: string;
  query: string;
  executionTime: number;
  threshold: number;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
  affectedTables: string[];
  estimatedImpact: {
    performanceDegradation: number;
    resourceUsage: number;
    userExperience: number;
  };
}

export interface QueryOptimizationSuggestion {
  type: 'index' | 'rewrite' | 'partition' | 'cache' | 'schema';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  originalQuery: string;
  optimizedQuery?: string;
  expectedImprovement: {
    executionTime: number; // percentage
    resourceUsage: number; // percentage
    scalability: number; // percentage
  };
  implementation: {
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    risks: string[];
    dependencies: string[];
  };
  affectedQueries: string[];
}

export interface DatabaseHealth {
  overall: 'healthy' | 'warning' | 'critical';
  connectionPool: {
    status: 'healthy' | 'warning' | 'critical';
    utilization: number;
    errors: number;
  };
  queryPerformance: {
    status: 'healthy' | 'warning' | 'critical';
    averageResponseTime: number;
    slowQueryCount: number;
    errorRate: number;
  };
  resourceUsage: {
    cpu: number;
    memory: number;
    disk: number;
    connections: number;
  };
  replication: {
    status: 'healthy' | 'warning' | 'critical';
    lag: number;
    errors: number;
  };
  alerts: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: Date;
  }>;
}

interface MockConnection {
  id: string;
}

interface MockConnectionPool {
  getConnection: () => Promise<MockConnection>;
  releaseConnection: (connection: MockConnection) => void;
  end: () => Promise<void>;
}

interface MockQueryResult {
  rows?: any[];
  affectedRows?: number;
  rowsExamined?: number;
  indexesUsed?: string[];
  fullTableScan?: boolean;
  lockTime?: number;
  memoryUsage?: number;
  cpuTime?: number;
  ioOperations?: number;
}

export class DatabaseOptimization {
  private static instance: DatabaseOptimization;
  private config: DatabaseConfig;
  private connectionPool!: MockConnectionPool;
  private poolStats: ConnectionPoolStats;
  private queryMetrics: Map<string, QueryMetrics> = new Map();
  private slowQueryAlerts: Map<string, SlowQueryAlert> = new Map();
  private optimizationSuggestions: QueryOptimizationSuggestion[] = [];
  private readonly SLOW_QUERY_THRESHOLD = 1000; // ms
  private readonly MAX_METRICS_RETENTION = 10000;
  private readonly ANALYSIS_INTERVAL = 60000; // 1 minute
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  private constructor(config: DatabaseConfig) {
    this.config = config;
    this.poolStats = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingConnections: 0,
      maxConnections: config.connectionLimit,
      connectionErrors: 0,
      averageConnectionTime: 0,
      totalQueries: 0,
      slowQueries: 0,
      failedQueries: 0
    };

    this.initializeConnectionPool();
    this.startPerformanceMonitoring();
    this.startQueryAnalysis();
    this.startHealthChecks();
  }

  static getInstance(config?: DatabaseConfig): DatabaseOptimization {
    if (!DatabaseOptimization.instance) {
      if (!config) {
        throw new Error('Database configuration required for first initialization');
      }
      DatabaseOptimization.instance = new DatabaseOptimization(config);
    }
    return DatabaseOptimization.instance;
  }

  async executeQuery<T = unknown>(
    query: string, 
    options: {
      timeout?: number;
      priority?: 'low' | 'normal' | 'high';
      cache?: boolean;
      source?: string;
      userId?: string;
    } = {}
  ): Promise<{
    data: T[];
    metrics: QueryMetrics;
    fromCache: boolean;
  }> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();
    const connectionId = this.generateConnectionId();

    try {
      // Get connection from pool
      const connection = await this.getConnection();
      
      // Execute query
      const result = await this.executeQueryOnConnection();
      
      // Release connection back to pool
      this.releaseConnection(connection);

      const executionTime = Date.now() - startTime;
      
      // Create metrics
      const metrics: QueryMetrics = {
        id: queryId,
        query,
        normalizedQuery: this.normalizeQuery(query),
        executionTime,
        rowsAffected: result.affectedRows || 0,
        rowsExamined: result.rowsExamined || 0,
        timestamp: new Date(),
        database: this.config.database,
        table: this.extractTableName(query),
        operation: this.extractOperation(query),
        indexesUsed: result.indexesUsed || [],
        fullTableScan: result.fullTableScan || false,
        lockTime: result.lockTime || 0,
        memoryUsage: result.memoryUsage || 0,
        cpuTime: result.cpuTime || 0,
        ioOperations: result.ioOperations || 0,
        cacheHit: false,
        connectionId,
        userId: options.userId,
        source: options.source || 'unknown'
      };

      // Store metrics
      this.recordQueryMetrics(metrics);

      // Check for slow queries
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        this.handleSlowQuery(metrics);
      }

      // Update pool stats
      this.poolStats.totalQueries++;
      if (executionTime > this.SLOW_QUERY_THRESHOLD) {
        this.poolStats.slowQueries++;
      }

      return {
        data: (result.rows || []) as T[],
        metrics,
        fromCache: false
      };

    } catch {
      this.poolStats.failedQueries++;
      
      const metrics: QueryMetrics = {
        id: queryId,
        query,
        normalizedQuery: this.normalizeQuery(query),
        executionTime: Date.now() - startTime,
        rowsAffected: 0,
        rowsExamined: 0,
        timestamp: new Date(),
        database: this.config.database,
        operation: this.extractOperation(query),
        indexesUsed: [],
        fullTableScan: false,
        lockTime: 0,
        memoryUsage: 0,
        cpuTime: 0,
        ioOperations: 0,
        cacheHit: false,
        connectionId,
        userId: options.userId,
        source: options.source || 'unknown'
      };

      this.recordQueryMetrics(metrics);
      
      console.error(`Database query error:`);
      throw _error;
    }
  }

  async analyzeQueryPerformance(timeRange: {
    from: Date;
    to: Date;
  }): Promise<{
    summary: {
      totalQueries: number;
      averageExecutionTime: number;
      slowQueries: number;
      failedQueries: number;
      mostExpensiveQueries: QueryMetrics[];
      mostFrequentQueries: Array<{ query: string; count: number; avgTime: number }>;
    };
    recommendations: QueryOptimizationSuggestion[];
    alerts: SlowQueryAlert[];
  }> {
    const metricsInRange = Array.from(this.queryMetrics.values())
      .filter(m => m.timestamp >= timeRange.from && m.timestamp <= timeRange.to);

    // Calculate summary statistics
    const totalQueries = metricsInRange.length;
    const averageExecutionTime = totalQueries > 0 
      ? metricsInRange.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries 
      : 0;
    const slowQueries = metricsInRange.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
    const failedQueries = this.poolStats.failedQueries;

    // Find most expensive queries
    const mostExpensiveQueries = metricsInRange
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    // Find most frequent queries
    const queryFrequency = new Map<string, { count: number; totalTime: number }>();
    for (const metric of metricsInRange) {
      const existing = queryFrequency.get(metric.normalizedQuery) || { count: 0, totalTime: 0 };
      queryFrequency.set(metric.normalizedQuery, {
        count: existing.count + 1,
        totalTime: existing.totalTime + metric.executionTime
      });
    }

    const mostFrequentQueries = Array.from(queryFrequency.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        avgTime: stats.totalTime / stats.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate recommendations
    const recommendations = this.generateOptimizationRecommendations(metricsInRange);

    // Get current alerts
    const alerts = Array.from(this.slowQueryAlerts.values())
      .filter(a => a.lastSeen >= timeRange.from && a.lastSeen <= timeRange.to);

    return {
      summary: {
        totalQueries,
        averageExecutionTime,
        slowQueries,
        failedQueries,
        mostExpensiveQueries,
        mostFrequentQueries
      },
      recommendations,
      alerts
    };
  }

  getConnectionPoolStats(): ConnectionPoolStats {
    return { ...this.poolStats };
  }

  async getDatabaseHealth(): Promise<DatabaseHealth> {
    try {
      // Mock health check - in production, query actual database metrics
      const connectionUtilization = this.poolStats.activeConnections / this.poolStats.maxConnections;
      const recentMetrics = Array.from(this.queryMetrics.values())
        .filter(m => Date.now() - m.timestamp.getTime() < 300000); // Last 5 minutes

      const averageResponseTime = recentMetrics.length > 0
        ? recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length
        : 0;

      const slowQueryCount = recentMetrics.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
      const errorRate = this.poolStats.failedQueries / Math.max(this.poolStats.totalQueries, 1);

      // Determine health status
      const connectionPoolStatus = connectionUtilization > 0.9 ? 'critical' : 
                                 connectionUtilization > 0.7 ? 'warning' : 'healthy';
      
      const queryPerformanceStatus = averageResponseTime > 2000 ? 'critical' :
                                   averageResponseTime > 1000 ? 'warning' : 'healthy';

      const overallStatus = [connectionPoolStatus, queryPerformanceStatus].includes('critical') ? 'critical' :
                          [connectionPoolStatus, queryPerformanceStatus].includes('warning') ? 'warning' : 'healthy';

      const alerts: DatabaseHealth['alerts'] = [];
      
      if (connectionUtilization > 0.8) {
        alerts.push({
          type: 'connection_pool',
          severity: connectionUtilization > 0.9 ? 'critical' : 'high',
          message: `Connection pool utilization is ${(connectionUtilization * 100).toFixed(1)}%`,
          timestamp: new Date()
        });
      }

      if (slowQueryCount > 10) {
        alerts.push({
          type: 'slow_queries',
          severity: slowQueryCount > 50 ? 'critical' : 'high',
          message: `${slowQueryCount} slow queries detected in the last 5 minutes`,
          timestamp: new Date()
        });
      }

      return {
        overall: overallStatus,
        connectionPool: {
          status: connectionPoolStatus,
          utilization: connectionUtilization,
          errors: this.poolStats.connectionErrors
        },
        queryPerformance: {
          status: queryPerformanceStatus,
          averageResponseTime,
          slowQueryCount,
          errorRate
        },
        resourceUsage: {
          cpu: Math.random() * 100, // Mock values
          memory: Math.random() * 100,
          disk: Math.random() * 100,
          connections: connectionUtilization * 100
        },
        replication: {
          status: 'healthy',
          lag: Math.random() * 100,
          errors: 0
        },
        alerts
      };

    } catch {
      console.error('Error getting database health:');
      return {
        overall: 'critical',
        connectionPool: { status: 'critical', utilization: 0, errors: 1 },
        queryPerformance: { status: 'critical', averageResponseTime: 0, slowQueryCount: 0, errorRate: 1 },
        resourceUsage: { cpu: 0, memory: 0, disk: 0, connections: 0 },
        replication: { status: 'critical', lag: 0, errors: 1 },
        alerts: [{
          type: 'system',
          severity: 'critical',
          message: 'Unable to retrieve database health metrics',
          timestamp: new Date()
        }]
      };
    }
  }

  async optimizeConnectionPool(targetUtilization = 0.7): Promise<{
    currentSettings: Partial<DatabaseConfig>;
    recommendedSettings: Partial<DatabaseConfig>;
    expectedImprovements: {
      connectionWaitTime: number;
      queryThroughput: number;
      resourceUsage: number;
    };
  }> {
    const currentUtilization = this.poolStats.activeConnections / this.poolStats.maxConnections;
    
    let recommendedConnectionLimit = this.config.connectionLimit;
    
    if (currentUtilization > targetUtilization) {
      // Increase pool size
      recommendedConnectionLimit = Math.ceil(this.config.connectionLimit * 1.5);
    } else if (currentUtilization < targetUtilization * 0.5) {
      // Decrease pool size to save resources
      recommendedConnectionLimit = Math.max(
        Math.floor(this.config.connectionLimit * 0.8),
        10 // Minimum connections
      );
    }

    return {
      currentSettings: {
        connectionLimit: this.config.connectionLimit,
        acquireTimeout: this.config.acquireTimeout,
        timeout: this.config.timeout
      },
      recommendedSettings: {
        connectionLimit: recommendedConnectionLimit,
        acquireTimeout: this.config.acquireTimeout,
        timeout: this.config.timeout
      },
      expectedImprovements: {
        connectionWaitTime: currentUtilization > targetUtilization ? 30 : -10,
        queryThroughput: currentUtilization > targetUtilization ? 20 : -5,
        resourceUsage: currentUtilization < targetUtilization * 0.5 ? -15 : 10
      }
    };
  }

  private initializeConnectionPool(): void {
    // Mock connection pool - in production, use mysql2, pg, or similar
    this.connectionPool = {
      getConnection: async (): Promise<MockConnection> => {
        this.poolStats.activeConnections++;
        return { id: this.generateConnectionId() };
      },
      releaseConnection: (): void => {
        this.poolStats.activeConnections--;
        this.poolStats.idleConnections++;
      },
      end: async (): Promise<void> => {
        console.log('Connection pool closed');
      }
    };

    this.poolStats.totalConnections = this.config.connectionLimit;
    this.poolStats.idleConnections = this.config.connectionLimit;
    
    console.log(`🔗 Database connection pool initialized with ${this.config.connectionLimit} connections`);
  }

  private async getConnection(): Promise<MockConnection> {
    const startTime = Date.now();
    
    try {
      const connection = await this.connectionPool.getConnection();
      const connectionTime = Date.now() - startTime;
      
      // Update average connection time
      const totalConnections = this.poolStats.totalQueries;
      this.poolStats.averageConnectionTime = 
        (this.poolStats.averageConnectionTime * totalConnections + connectionTime) / (totalConnections + 1);
      
      return connection;
    } catch {
      this.poolStats.connectionErrors++;
      throw _error;
    }
  }

  private releaseConnection(connection: MockConnection): void {
    this.connectionPool.releaseConnection(connection);
  }

  private async executeQueryOnConnection(): Promise<MockQueryResult> {
    // Mock query execution - in production, use actual database driver
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    return {
      rows: [],
      affectedRows: Math.floor(Math.random() * 10),
      rowsExamined: Math.floor(Math.random() * 100),
      indexesUsed: ['idx_primary'],
      fullTableScan: Math.random() > 0.8,
      lockTime: Math.random() * 10,
      memoryUsage: Math.random() * 1024 * 1024,
      cpuTime: Math.random() * 50,
      ioOperations: Math.floor(Math.random() * 20)
    };
  }

  private recordQueryMetrics(metrics: QueryMetrics): void {
    this.queryMetrics.set(metrics.id, metrics);
    
    // Clean up old metrics
    if (this.queryMetrics.size > this.MAX_METRICS_RETENTION) {
      const oldestEntries = Array.from(this.queryMetrics.entries())
        .sort(([,a], [,b]) => a.timestamp.getTime() - b.timestamp.getTime())
        .slice(0, this.queryMetrics.size - this.MAX_METRICS_RETENTION);
      
      for (const [id] of oldestEntries) {
        this.queryMetrics.delete(id);
      }
    }
  }

  private handleSlowQuery(metrics: QueryMetrics): void {
    const alertId = this.generateAlertId(metrics.normalizedQuery);
    const existing = this.slowQueryAlerts.get(alertId);
    
    if (existing) {
      existing.frequency++;
      existing.lastSeen = new Date();
      if (metrics.executionTime > existing.executionTime) {
        existing.executionTime = metrics.executionTime;
      }
    } else {
      const alert: SlowQueryAlert = {
        id: alertId,
        query: metrics.normalizedQuery,
        executionTime: metrics.executionTime,
        threshold: this.SLOW_QUERY_THRESHOLD,
        frequency: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        severity: this.calculateSeverity(metrics.executionTime),
        recommendations: this.generateQueryRecommendations(metrics),
        affectedTables: metrics.table ? [metrics.table] : [],
        estimatedImpact: {
          performanceDegradation: Math.min((metrics.executionTime / this.SLOW_QUERY_THRESHOLD) * 20, 100),
          resourceUsage: Math.min((metrics.memoryUsage / (1024 * 1024)) * 10, 100),
          userExperience: Math.min((metrics.executionTime / 1000) * 15, 100)
        }
      };
      
      this.slowQueryAlerts.set(alertId, alert);
      console.warn(`🐌 Slow query detected: ${metrics.executionTime}ms - ${metrics.normalizedQuery.substring(0, 100)}...`);
    }
  }

  private generateOptimizationRecommendations(metrics: QueryMetrics[]): QueryOptimizationSuggestion[] {
    const recommendations: QueryOptimizationSuggestion[] = [];
    const queryGroups = new Map<string, QueryMetrics[]>();
    
    // Group queries by normalized query
    for (const metric of metrics) {
      const existing = queryGroups.get(metric.normalizedQuery) || [];
      existing.push(metric);
      queryGroups.set(metric.normalizedQuery, existing);
    }
    
    // Analyze each query group
    for (const [normalizedQuery, queryMetrics] of queryGroups) {
      const avgExecutionTime = queryMetrics.reduce((sum, m) => sum + m.executionTime, 0) / queryMetrics.length;
      const frequency = queryMetrics.length;
      
      if (avgExecutionTime > this.SLOW_QUERY_THRESHOLD && frequency > 5) {
        // Check for missing indexes
        const fullTableScans = queryMetrics.filter(m => m.fullTableScan).length;
        if (fullTableScans > frequency * 0.5) {
          recommendations.push({
            type: 'index',
            priority: 'high',
            description: 'Add database index to avoid full table scans',
            originalQuery: normalizedQuery,
            expectedImprovement: {
              executionTime: 70,
              resourceUsage: 50,
              scalability: 80
            },
            implementation: {
              difficulty: 'easy',
              estimatedTime: '1-2 hours',
              risks: ['Increased storage usage', 'Slower write operations'],
              dependencies: ['Database schema access']
            },
            affectedQueries: queryMetrics.map(m => m.id)
          });
        }
        
        // Check for query rewrite opportunities
        if (normalizedQuery.includes('SELECT *')) {
          recommendations.push({
            type: 'rewrite',
            priority: 'medium',
            description: 'Replace SELECT * with specific column names',
            originalQuery: normalizedQuery,
            optimizedQuery: normalizedQuery.replace('SELECT *', 'SELECT specific_columns'),
            expectedImprovement: {
              executionTime: 20,
              resourceUsage: 40,
              scalability: 30
            },
            implementation: {
              difficulty: 'easy',
              estimatedTime: '30 minutes',
              risks: ['Application code changes required'],
              dependencies: ['Code review and testing']
            },
            affectedQueries: queryMetrics.map(m => m.id)
          });
        }
      }
    }
    
    return recommendations;
  }

  private generateQueryRecommendations(metrics: QueryMetrics): string[] {
    const recommendations: string[] = [];
    
    if (metrics.fullTableScan) {
      recommendations.push('Consider adding an index to avoid full table scan');
    }
    
    if (metrics.lockTime > 100) {
      recommendations.push('High lock time detected - consider query optimization or transaction management');
    }
    
    if (metrics.memoryUsage > 10 * 1024 * 1024) { // 10MB
      recommendations.push('High memory usage - consider result set optimization');
    }
    
    if (metrics.query.includes('SELECT *')) {
      recommendations.push('Avoid SELECT * - specify only needed columns');
    }
    
    return recommendations;
  }

  private calculateSeverity(executionTime: number): SlowQueryAlert['severity'] {
    if (executionTime > 10000) return 'critical'; // > 10s
    if (executionTime > 5000) return 'high';      // > 5s
    if (executionTime > 2000) return 'medium';    // > 2s
    return 'low';
  }

  private normalizeQuery(query: string): string {
    return query
      .replace(/\s+/g, ' ')
      .replace(/\b\d+\b/g, '?')
      .replace(/'[^']*'/g, '?')
      .replace(/"[^"]*"/g, '?')
      .trim()
      .toLowerCase();
  }

  private extractTableName(query: string): string | undefined {
    const match = query.match(/(?:FROM|UPDATE|INTO)\s+([`"]?)(\w+)\1/i);
    return match ? match[2] : undefined;
  }

  private extractOperation(query: string): QueryMetrics['operation'] {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.startsWith('select')) return 'SELECT';
    if (trimmed.startsWith('insert')) return 'INSERT';
    if (trimmed.startsWith('update')) return 'UPDATE';
    if (trimmed.startsWith('delete')) return 'DELETE';
    return 'OTHER';
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(normalizedQuery: string): string {
    return `alert_${Buffer.from(normalizedQuery).toString('base64').substr(0, 16)}`;
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePoolStats();
    }, 10000); // Every 10 seconds
    
    console.log('📊 Started database performance monitoring');
  }

  private startQueryAnalysis(): void {
    setInterval(() => {
      this.analyzeRecentQueries();
    }, this.ANALYSIS_INTERVAL);
    
    console.log('🔍 Started query analysis');
  }

  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
    
    console.log('❤️ Started database health checks');
  }

  private updatePoolStats(): void {
    // Update connection pool statistics
    this.poolStats.idleConnections = this.poolStats.totalConnections - this.poolStats.activeConnections;
    
    // Log stats periodically
    if (this.poolStats.totalQueries % 100 === 0 && this.poolStats.totalQueries > 0) {
      console.log(`📊 Pool Stats: ${this.poolStats.activeConnections}/${this.poolStats.totalConnections} active, ${this.poolStats.slowQueries} slow queries`);
    }
  }

  private analyzeRecentQueries(): void {
    const recentQueries = Array.from(this.queryMetrics.values())
      .filter(m => Date.now() - m.timestamp.getTime() < this.ANALYSIS_INTERVAL);
    
    if (recentQueries.length > 0) {
      // Calculate average time for monitoring
      // const avgTime = recentQueries.reduce((sum, m) => sum + m.executionTime, 0) / recentQueries.length;
      const slowQueries = recentQueries.filter(m => m.executionTime > this.SLOW_QUERY_THRESHOLD).length;
      
      if (slowQueries > recentQueries.length * 0.1) { // More than 10% slow queries
        console.warn(`⚠️ High slow query rate: ${slowQueries}/${recentQueries.length} (${(slowQueries/recentQueries.length*100).toFixed(1)}%)`);
      }
    }
  }

  private async performHealthCheck(): Promise<void> {
    try {
      // Perform basic connectivity check
      const connection = await this.getConnection();
      this.releaseConnection(connection);
      
      // Check for connection pool exhaustion
      const utilization = this.poolStats.activeConnections / this.poolStats.maxConnections;
      if (utilization > 0.9) {
        console.warn(`⚠️ Connection pool utilization high: ${(utilization * 100).toFixed(1)}%`);
      }
      
    } catch {
      console.error('❌ Database health check failed:');
      this.poolStats.connectionErrors++;
    }
  }
}

// Export singleton instance with default config
export const databaseOptimization = DatabaseOptimization.getInstance({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'contravo',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ssl: process.env.DB_SSL === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '20'),
  acquireTimeout: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'),
  timeout: parseInt(process.env.DB_TIMEOUT || '60000'),
  reconnect: true,
  reconnectInterval: 1000,
  maxReconnectAttempts: 3
});

// Helper functions
export async function executeOptimizedQuery<T = unknown>(
  query: string, 
  options?: Parameters<typeof databaseOptimization.executeQuery>[1]
): Promise<{ data: T[]; metrics: QueryMetrics; fromCache: boolean }> {
  return databaseOptimization.executeQuery<T>(query, options);
}

export function getDatabaseHealth(): Promise<DatabaseHealth> {
  return databaseOptimization.getDatabaseHealth();
}

export function getConnectionPoolStats(): ConnectionPoolStats {
  return databaseOptimization.getConnectionPoolStats();
}

export function analyzeQueryPerformance(timeRange: { from: Date; to: Date }): ReturnType<typeof databaseOptimization.analyzeQueryPerformance> {
  return databaseOptimization.analyzeQueryPerformance(timeRange);
} 