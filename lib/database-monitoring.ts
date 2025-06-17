/* eslint-disable */
import { PrismaClient } from '@prisma/client'
import fs from 'fs/promises'
import path from 'path'
// Database Monitoring & Health Check System
export class DatabaseMonitor {
  private prisma: PrismaClient
  private monitoringInterval?: NodeJS.Timeout
  private alertThresholds = {
    responseTime: 1000, // ms
    connectionCount: 20,
    errorRate: 0.05, // 5%
    diskUsage: 0.85 // 85%
  }

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // Start monitoring
  startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
    }

    console.log('Starting database monitoring...')

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performHealthCheck()
      } catch (error) {
        console.error('Monitoring health check failed:', error)
      }
    }, intervalMs)
  }

  // Stop monitoring
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
      console.log('Database monitoring stopped')
    }
  }

  // Comprehensive health check
  async performHealthCheck(): Promise<DatabaseHealthReport> {
    const startTime = Date.now()

    try {
      // Test database connectivity
      const connectionTest = await this.testDatabaseConnection()

      // Get database statistics
      const statistics = await this.getDatabaseStatistics()

      // Check query performance
      const performance = await this.checkQueryPerformance()

      // Check disk usage
      const diskUsage = await this.checkDiskUsage()

      // Check for slow queries
      const slowQueries = await this.identifySlowQueries()

      // Check connection pool status
      const connectionPool = await this.checkConnectionPool()

      const totalTime = Date.now() - startTime

      const report: DatabaseHealthReport = {
        timestamp: new Date(),
        status: connectionTest.connected ? 'healthy' : 'unhealthy',
        responseTime: totalTime,
        connection: connectionTest,
        statistics,
        performance,
        diskUsage,
        slowQueries,
        connectionPool,
        alerts: []
      }

      // Generate alerts based on thresholds
      report.alerts = this.generateAlerts(report)

      // Log critical issues
      if (report.alerts.length > 0) {
        console.warn('Database health issues detected:', report.alerts)
      }

      return report
    } catch (error) {
      return {
        timestamp: new Date(),
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        alerts: [{ type: 'critical', message: 'Health check failed', timestamp: new Date() }]
      } as DatabaseHealthReport
    }
  }

  // Test database connection
  private async testDatabaseConnection(): Promise<ConnectionTest> {
    const startTime = performance.now()

    try {
      // Simple query to test connection
      await this.prisma.$queryRaw`SELECT 1`
      
      const responseTime = performance.now() - startTime

      return {
        connected: true,
        responseTime: Math.round(responseTime),
        error: null
      }
    } catch (error) {
      return {
        connected: false,
        responseTime: performance.now() - startTime,
        error: error instanceof Error ? error.message : 'Connection failed'
      }
    }
  }

  // Get database statistics
  private async getDatabaseStatistics(): Promise<DatabaseStatistics> {
    try {
      const [
        userCount,
        companyCount,
        contractCount,
        templateCount,
        notificationCount,
        totalAttachmentSize
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.company.count(),
        this.prisma.contract.count(),
        this.prisma.contractTemplate.count(),
        this.prisma.notification.count(),
        this.getTotalAttachmentSize()
      ])

      // Get recent activity (last 24 hours)
      const recentActivity = await this.getRecentActivity()

      return {
        totalRecords: {
          users: userCount,
          companies: companyCount,
          contracts: contractCount,
          templates: templateCount,
          notifications: notificationCount
        },
        recentActivity,
        totalAttachmentSize
      }
    } catch (error) {
      throw new Error(`Failed to get database statistics: ${error}`)
    }
  }

  // Get total attachment size
  private async getTotalAttachmentSize(): Promise<number> {
    try {
      const result = await this.prisma.contractAttachment.aggregate({
        _sum: {
          fileSize: true
        }
      })
      
      return result._sum.fileSize || 0
    } catch (error) {
      return 0
    }
  }

  // Get recent activity (last 24 hours)
  private async getRecentActivity(): Promise<{
    period: string;
    newUsers: number;
    newCompanies: number;
    newContracts: number;
    newNotifications: number;
  }> {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000)

    try {
      const [
        newUsers,
        newCompanies,
        newContracts,
        newNotifications
      ] = await Promise.all([
        this.prisma.user.count({
          where: { createdAt: { gte: last24Hours } }
        }),
        this.prisma.company.count({
          where: { createdAt: { gte: last24Hours } }
        }),
        this.prisma.contract.count({
          where: { createdAt: { gte: last24Hours } }
        }),
        this.prisma.notification.count({
          where: { createdAt: { gte: last24Hours } }
        })
      ])

      return {
        period: '24h',
        newUsers,
        newCompanies,
        newContracts,
        newNotifications
      }
    } catch (error) {
      return {
        period: '24h',
        newUsers: 0,
        newCompanies: 0,
        newContracts: 0,
        newNotifications: 0
      }
    }
  }

  // Check query performance
  private async checkQueryPerformance(): Promise<PerformanceMetrics> {
    const startTime = performance.now()

    try {
      // Test common queries
      const queries: Array<{
        name: string;
        query: () => Promise<unknown>;
      }> = [
        { name: 'user_lookup', query: () => this.prisma.user.findFirst() },
        { name: 'contract_list', query: () => this.prisma.contract.findMany({ take: 10 }) },
        { name: 'company_stats', query: () => this.prisma.company.count() }
      ]

      const results = []

      for (const { name, query } of queries) {
        const queryStart = performance.now()
        await query()
        const queryTime = performance.now() - queryStart

        results.push({
          queryName: name,
          executionTime: Math.round(queryTime),
          timestamp: new Date()
        })
      }

      const totalTime = performance.now() - startTime
      const avgTime = results.reduce((sum, r) => sum + r.executionTime, 0) / results.length

      return {
        averageQueryTime: Math.round(avgTime),
        slowestQuery: results.reduce((max, current) => 
          current.executionTime > max.executionTime ? current : max
        ),
        queryResults: results,
        totalTestTime: Math.round(totalTime)
      }
    } catch (error) {
      throw new Error(`Failed to check query performance: ${error}`)
    }
  }

  // Check disk usage (for SQLite)
  private async checkDiskUsage(): Promise<DiskUsage> {
    try {
      const dbPath = 'prisma/dev.db'
      
      try {
        const stats = await fs.stat(dbPath)
        const fileSizeBytes = stats.size
        const fileSizeMB = Math.round(fileSizeBytes / (1024 * 1024) * 100) / 100

        // For SQLite, we can't easily get total disk space, so we'll estimate
        const estimatedMaxSize = 1000 // 1GB reasonable limit for development
        const usagePercentage = fileSizeMB / estimatedMaxSize

        return {
          totalSizeMB: estimatedMaxSize,
          usedSizeMB: fileSizeMB,
          freeSizeMB: estimatedMaxSize - fileSizeMB,
          usagePercentage: Math.round(usagePercentage * 10000) / 100,
          path: dbPath
        }
      } catch (error) {
        return {
          totalSizeMB: 0,
          usedSizeMB: 0,
          freeSizeMB: 0,
          usagePercentage: 0,
          path: dbPath,
          error: 'Cannot access database file'
        }
      }
    } catch (error) {
      throw new Error(`Disk usage check failed: ${error}`)
    }
  }

  // Identify slow queries (simulated for SQLite)
  private async identifySlowQueries(): Promise<SlowQuery[]> {
    // For SQLite, we'll simulate slow query detection
    // In production with PostgreSQL/MySQL, you'd query system tables
    
    try {
      const slowQueries: SlowQuery[] = []

      // Test some potentially slow operations
      const tests = [
        {
          name: 'Large contract search',
          test: async () => {
            const start = performance.now()
            await this.prisma.contract.findMany({
              include: { attachments: true, approvals: true }
            })
            return performance.now() - start
          }
        },
        {
          name: 'User activity aggregation',
          test: async () => {
            const start = performance.now()
            await this.prisma.user.findMany({
              include: { _count: { select: { createdContracts: true } } }
            })
            return performance.now() - start
          }
        }
      ]

      for (const { name, test } of tests) {
        const executionTime = await test()
        
        if (executionTime > this.alertThresholds.responseTime) {
          slowQueries.push({
            query: name,
            executionTime: Math.round(executionTime),
            timestamp: new Date(),
            suggestion: 'Consider adding indexes or optimizing query'
          })
        }
      }

      return slowQueries
    } catch (error) {
      return []
    }
  }

  // Check connection pool status
  private async checkConnectionPool(): Promise<ConnectionPoolStatus> {
    try {
      // For SQLite, connection pooling is simpler
      // In production databases, you'd check actual pool metrics
      
      return {
        totalConnections: 1, // SQLite typically uses single connection
        activeConnections: 1,
        idleConnections: 0,
        waitingRequests: 0,
        maxConnections: 1,
        status: 'healthy'
      }
    } catch (error) {
      return {
        totalConnections: 0,
        activeConnections: 0,
        idleConnections: 0,
        waitingRequests: 0,
        maxConnections: 1,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Generate alerts based on metrics
  private generateAlerts(report: DatabaseHealthReport): Alert[] {
    const alerts: Alert[] = []

    // Check response time
    if (report.responseTime > this.alertThresholds.responseTime) {
      alerts.push({
        type: 'warning',
        message: `High response time: ${report.responseTime}ms (threshold: ${this.alertThresholds.responseTime}ms)`,
        timestamp: new Date()
      })
    }

    // Check disk usage
    if (report.diskUsage && report.diskUsage.usagePercentage > this.alertThresholds.diskUsage * 100) {
      alerts.push({
        type: 'critical',
        message: `High disk usage: ${report.diskUsage.usagePercentage}% (threshold: ${this.alertThresholds.diskUsage * 100}%)`,
        timestamp: new Date()
      })
    }

    // Check slow queries
    if (report.slowQueries && report.slowQueries.length > 0) {
      alerts.push({
        type: 'warning',
        message: `${report.slowQueries.length} slow queries detected`,
        timestamp: new Date()
      })
    }

    // Check connection issues
    if (!report.connection?.connected) {
      alerts.push({
        type: 'critical',
        message: 'Database connection failed',
        timestamp: new Date()
      })
    }

    return alerts
  }

  // Get monitoring history
  async getMonitoringHistory(hours: number = 24): Promise<DatabaseHealthReport[]> {
    // In a real implementation, you'd store monitoring data in a separate table
    // For now, we'll return a simulated history
    
    const history: DatabaseHealthReport[] = []
    const now = new Date()
    
    for (let i = 0; i < hours; i++) {
      const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
      
      // Simulate historical data
      history.push({
        timestamp,
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 200) + 50,
        connection: { connected: true, responseTime: 50, error: null },
        alerts: []
      } as DatabaseHealthReport)
    }
    
    return history.reverse()
  }

  // Export monitoring report
  async exportMonitoringReport(): Promise<string> {
    const report = await this.performHealthCheck()
    const history = await this.getMonitoringHistory()
    
    const exportData = {
      currentStatus: report,
      history,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    }

    const filename = `db-monitoring-report-${new Date().toISOString().split('T')[0]}.json`
    const filepath = path.join('./reports', filename)

    // Ensure reports directory exists
    await fs.mkdir('./reports', { recursive: true })
    
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2))
    
    console.log(`Monitoring report exported: ${filepath}`)
    return filepath
  }

  // Update alert thresholds
  updateAlertThresholds(thresholds: Partial<typeof DatabaseMonitor.prototype.alertThresholds>): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds }
    console.log('Alert thresholds updated:', this.alertThresholds)
  }


}

// Type definitions
export interface DatabaseHealthReport {
  timestamp: Date
  status: 'healthy' | 'warning' | 'unhealthy' | 'error'
  responseTime: number
  connection?: ConnectionTest
  statistics?: DatabaseStatistics
  performance?: PerformanceMetrics
  diskUsage?: DiskUsage
  slowQueries?: SlowQuery[]
  connectionPool?: ConnectionPoolStatus
  alerts: Alert[]
  error?: string
}

export interface ConnectionTest {
  connected: boolean
  responseTime: number
  error: string | null
}

export interface DatabaseStatistics {
  totalRecords: {
    users: number;
    companies: number;
    contracts: number;
    templates: number;
    notifications: number;
  };
  recentActivity: {
    period: string;
    newUsers: number;
    newCompanies: number;
    newContracts: number;
    newNotifications: number;
  };
  totalAttachmentSize: number;
}

export interface PerformanceMetrics {
  averageQueryTime: number
  slowestQuery: {
    queryName: string
    executionTime: number
    timestamp: Date
  }
  queryResults: {
    queryName: string
    executionTime: number
    timestamp: Date
  }[]
  totalTestTime: number
}

export interface DiskUsage {
  totalSizeMB: number
  usedSizeMB: number
  freeSizeMB: number
  usagePercentage: number
  path: string
  error?: string
}

export interface SlowQuery {
  query: string
  executionTime: number
  timestamp: Date
  suggestion: string
}

export interface ConnectionPoolStatus {
  totalConnections: number
  activeConnections: number
  idleConnections: number
  waitingRequests: number
  maxConnections: number
  status: 'healthy' | 'warning' | 'error'
  error?: string
}

export interface Alert {
  type: 'info' | 'warning' | 'critical'
  message: string
  timestamp: Date
}

// Performance tracking decorator
export function trackPerformance(
  target: object,
  propertyName: string,
  descriptor: PropertyDescriptor
): PropertyDescriptor {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: unknown[]) {
    const startTime = performance.now();
    try {
      const result = await originalMethod.apply(this, args);
      const executionTime = performance.now() - startTime;
      console.log(`${propertyName} executed in ${executionTime}ms`);
      return result;
    } catch (error) {
      const executionTime = performance.now() - startTime;
      console.error(`${propertyName} failed after ${executionTime}ms:`, error);
      throw error;
    }
  };

  return descriptor;
}

export default DatabaseMonitor 