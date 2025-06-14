import { PrismaClient, ContractStatus } from '@prisma/client'


// Database Performance Utilities
export class DatabaseOptimizer {
  private static instance: DatabaseOptimizer
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  static getInstance(prisma: PrismaClient): DatabaseOptimizer {
    if (!DatabaseOptimizer.instance) {
      DatabaseOptimizer.instance = new DatabaseOptimizer(prisma)
    }
    return DatabaseOptimizer.instance
  }

  // Optimized Contract Queries
  async getContractsByCompany(
    companyId: string,
    options: {
      page?: number
      limit?: number
      status?: ContractStatus[]
      type?: string
      sortBy?: 'createdAt' | 'updatedAt' | 'title' | 'status'
      sortOrder?: 'asc' | 'desc'
    } = {}
  ) {
    const {
      page = 1,
      limit = 20,
      status,
      type,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options

    const skip = (page - 1) * limit

    const where = {
      companyId,
      ...(status && { status: { in: status } }),
      ...(type && { type })
    }

    // Parallel queries for better performance
    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          company: {
            select: { id: true, name: true }
          },
          _count: {
            select: {
              attachments: true,
              approvals: true,
              versions: true
            }
          }
        }
      }),
      this.prisma.contract.count({ where })
    ])

    return {
      contracts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Optimized User Dashboard Data
  async getUserDashboardData(userId: string) {
    const [
      userStats,
      recentContracts,
      pendingApprovals,
      notifications
    ] = await Promise.all([
      // User statistics
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          _count: {
            select: {
              createdContracts: true,
              createdCompanies: true,
              approvals: true
            }
          }
        }
      }),

      // Recent contracts (last 10)
      this.prisma.contract.findMany({
        where: { createdById: userId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          company: {
            select: { id: true, name: true }
          }
        }
      }),

      // Pending approvals
      this.prisma.contractApproval.findMany({
        where: {
          approverId: userId,
          status: 'PENDING'
        },
        include: {
          contract: {
            select: {
              id: true,
              title: true,
              createdAt: true,
              company: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Recent notifications (last 5)
      this.prisma.notification.findMany({
        where: { userId },
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          type: true,
          title: true,
          message: true,
          isRead: true,
          createdAt: true
        }
      })
    ])

    return {
      userStats,
      recentContracts,
      pendingApprovals,
      notifications
    }
  }

  // Optimized Contract Search with Full-Text Search Simulation
  async searchContracts(
    searchTerm: string,
    options: {
      companyId?: string
      userId?: string
      status?: ContractStatus[]
      type?: string
      dateFrom?: Date
      dateTo?: Date
      page?: number
      limit?: number
    } = {}
  ) {
    const {
      companyId,
      userId,
      status,
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20
    } = options

    const skip = (page - 1) * limit

    // Build search conditions
    const searchConditions = searchTerm
      ? {
          OR: [
            { title: { contains: searchTerm, mode: 'insensitive' as const } },
            { description: { contains: searchTerm, mode: 'insensitive' as const } },
            { otherPartyName: { contains: searchTerm, mode: 'insensitive' as const } }
          ]
        }
      : {}

    const where = {
      ...searchConditions,
      ...(companyId && { companyId }),
      ...(userId && { createdById: userId }),
      ...(status && { status: { in: status } }),
      ...(type && { type }),
      ...(dateFrom && { createdAt: { gte: dateFrom } }),
      ...(dateTo && { createdAt: { lte: dateTo } })
    }

    const [contracts, total] = await Promise.all([
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          // Relevance-based sorting (title matches first)
          { title: 'asc' },
          { createdAt: 'desc' }
        ],
        include: {
          createdBy: {
            select: { id: true, name: true }
          },
          company: {
            select: { id: true, name: true }
          }
        }
      }),
      this.prisma.contract.count({ where })
    ])

    return {
      contracts,
      searchTerm,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    }
  }

  // Batch Operations for Better Performance
  async batchUpdateContractStatus(
    contractIds: string[],
    status: ContractStatus,
    updatedById: string
  ) {
    return await this.prisma.contract.updateMany({
      where: {
        id: { in: contractIds }
      },
      data: {
        status,
        updatedById,
        updatedAt: new Date()
      }
    })
  }

  // Database Health Check
  async performHealthCheck() {
    try {
      const [
        userCount,
        companyCount,
        contractCount,
        notificationCount
      ] = await Promise.all([
        this.prisma.user.count(),
        this.prisma.company.count(),
        this.prisma.contract.count(),
        this.prisma.notification.count()
      ])

      return {
        status: 'healthy',
        timestamp: new Date(),
        counts: {
          users: userCount,
          companies: companyCount,
          contracts: contractCount,
          notifications: notificationCount
        }
      }
    } catch (_error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: _error instanceof Error ? _error.message : 'Unknown error'
      }
    }
  }

  // Clean up old data (maintenance)
  async cleanupOldData(daysOld: number = 90) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    // Clean up old notifications
    const deletedNotifications = await this.prisma.notification.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isRead: true
      }
    })

    // Clean up expired invites
    const deletedInvites = await this.prisma.companyInvite.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        status: 'EXPIRED'
      }
    })

    return {
      deletedNotifications: deletedNotifications.count,
      deletedInvites: deletedInvites.count,
      cleanupDate: cutoffDate
    }
  }
}

// Query Performance Monitoring
export class QueryPerformanceMonitor {
  private static queryTimes: Map<string, number[]> = new Map()

  static async measureQuery<T>(
    queryName: string,
    queryFunction: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await queryFunction()
      const endTime = performance.now()
      const duration = endTime - startTime

      // Store query time
      if (!this.queryTimes.has(queryName)) {
        this.queryTimes.set(queryName, [])
      }
      
      const times = this.queryTimes.get(queryName)!
      times.push(duration)
      
      // Keep only last 100 measurements
      if (times.length > 100) {
        times.shift()
      }

      // Log slow queries (> 1000ms)
      if (duration > 1000) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }

      return result
    } catch (_error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      console.error(`Query ${queryName} failed after ${duration.toFixed(2)}ms:`, _error)
      throw _error
    }
  }

  static getQueryStats(queryName: string) {
    const times = this.queryTimes.get(queryName) || []
    if (times.length === 0) {
      return null
    }

    const avg = times.reduce((sum, time) => sum + time, 0) / times.length
    const min = Math.min(...times)
    const max = Math.max(...times)

    return {
      queryName,
      count: times.length,
      avgTime: Math.round(avg),
      minTime: Math.round(min),
      maxTime: Math.round(max)
    }
  }

  static getAllQueryStats() {
    const allStats = []
    for (const queryName of this.queryTimes.keys()) {
      const stats = this.getQueryStats(queryName)
      if (stats) {
        allStats.push(stats)
      }
    }
    return allStats.sort((a, b) => b.avgTime - a.avgTime)
  }
}

// Connection Pool Management
export class ConnectionPoolManager {
  private static connections: PrismaClient[] = []
  private static maxConnections = 10
  private static currentIndex = 0

  static initializePool() {
    for (let i = 0; i < this.maxConnections; i++) {
      this.connections.push(new PrismaClient())
    }
  }

  static getConnection(): PrismaClient {
    if (this.connections.length === 0) {
      this.initializePool()
    }

    const connection = this.connections[this.currentIndex]
    this.currentIndex = (this.currentIndex + 1) % this.connections.length
    
    return connection
  }

  static async closeAllConnections() {
    await Promise.all(
      this.connections.map(connection => connection.$disconnect())
    )
    this.connections = []
  }

  static async testConnection(): Promise<void> {
    try {
      // This is a simplified example - in practice, you'd use Prisma's query methods
      console.log('Testing connection...');
      return;
    } catch (_error) {
      console.error('Connection test failed:', _error);
      throw _error;
    }
  }

  static async executeQuery<T = any>(
    prisma: PrismaClient,
    query: string,
    params?: any[]
  ): Promise<T[]> {
    try {
      // This is a simplified example - in practice, you'd use Prisma's query methods
      console.log('Executing query:', query);
      return [];
    } catch (_error) {
      console.error('Query execution failed:', _error);
      throw _error;
    }
  }
}

export default DatabaseOptimizer 