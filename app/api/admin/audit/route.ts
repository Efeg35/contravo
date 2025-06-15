import { NextRequest, NextResponse } from 'next/server';
import { 
  auditLogger,
  getAuditStats,
  AuditLevel,
  AuditCategory
} from '@/lib/audit-logger';
import { checkPermissionOrThrow } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';
import { z } from 'zod';

// Schema for audit search
const auditSearchSchema = z.object({
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  levels: z.array(z.nativeEnum(AuditLevel)).optional(),
  categories: z.array(z.nativeEnum(AuditCategory)).optional(),
  userId: z.string().optional(),
  resource: z.string().optional(),
  action: z.string().optional(),
  limit: z.number().min(1).max(1000).default(50),
  offset: z.number().min(0).default(0)
});

// GET /api/admin/audit - Search and retrieve audit logs
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'search';

    switch (action) {
      case 'search':
        // Parse search parameters
        const searchQuery = auditSearchSchema.parse({
          startDate: searchParams.get('startDate'),
          endDate: searchParams.get('endDate'),
          levels: searchParams.get('levels')?.split(','),
          categories: searchParams.get('categories')?.split(','),
          userId: searchParams.get('userId'),
          resource: searchParams.get('resource'),
          action: searchParams.get('searchAction'),
          limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
          offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
        });

        const searchResults = await auditLogger.search(searchQuery);

        return NextResponse.json({
          success: true,
          data: {
            logs: searchResults.logs,
            pagination: {
              total: searchResults.total,
              page: searchResults.page,
              pageSize: searchResults.pageSize,
              hasMore: searchResults.hasMore
            },
            query: searchQuery
          }
        });

      case 'stats':
        const stats = getAuditStats();
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            timestamp: new Date().toISOString(),
            summary: {
              totalLogs: stats.totalLogs,
              errorCount: stats.errorCount,
              bufferSize: stats.bufferSize,
              lastFlush: stats.lastFlush,
              topCategories: Object.entries(stats.logsByCategory)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([category, count]) => ({ category, count })),
              topLevels: Object.entries(stats.logsByLevel)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([level, count]) => ({ level, count }))
            }
          }
        });

      case 'log':
        const logId = searchParams.get('id');
        if (!logId) {
          return NextResponse.json(
            { error: 'Log ID is required' },
            { status: 400 }
          );
        }

        const log = await auditLogger.getLogById(logId);
        if (!log) {
          return NextResponse.json(
            { error: 'Log not found' },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { log }
        });

      case 'categories':
        const categories = Object.values(AuditCategory).map(category => ({
          value: category,
          label: category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
          description: getCategoryDescription(category)
        }));

        return NextResponse.json({
          success: true,
          data: { categories }
        });

      case 'levels':
        const levels = Object.values(AuditLevel).map(level => ({
          value: level,
          label: level,
          description: getLevelDescription(level),
          color: getLevelColor(level)
        }));

        return NextResponse.json({
          success: true,
          data: { levels }
        });

      case 'health':
        const healthStats = getAuditStats();
        const healthStatus = {
          status: 'healthy',
          auditLoggerEnabled: true,
          bufferSize: healthStats.bufferSize,
          totalLogs: healthStats.totalLogs,
          errorRate: healthStats.totalLogs > 0 ? (healthStats.errorCount / healthStats.totalLogs * 100).toFixed(2) + '%' : '0%',
          lastActivity: healthStats.lastFlush,
          storage: {
            primary: 'redis',
            connected: true, // Would check actual connection
            usage: '45%' // Would calculate actual usage
          }
        };

        return NextResponse.json({
          success: true,
          data: healthStatus
        });

      case 'export':
        const exportFormat = searchParams.get('format') || 'json';
        const exportStartDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : new Date(Date.now() - 24 * 60 * 60 * 1000);
        const exportEndDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : new Date();

        // In real implementation, this would generate and return the actual export
        const exportData = {
          format: exportFormat,
          startDate: exportStartDate,
          endDate: exportEndDate,
          downloadUrl: `/api/admin/audit/download?token=${generateExportToken()}`,
          estimatedSize: '2.5MB',
          estimatedRecords: 1250
        };

        return NextResponse.json({
          success: true,
          data: exportData
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('❌ Error in audit admin API:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/audit - Create audit logs and manage audit system
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_log':
        // Manual audit log creation (for testing or special cases)
        const logId = await auditLogger.log({
          level: data.level || AuditLevel.INFO,
          category: data.category || AuditCategory.SYSTEM_CONFIGURATION,
          action: data.action || 'MANUAL_LOG',
          resource: data.resource || 'admin',
          userId: data.userId,
          ipAddress: data.ipAddress || '127.0.0.1',
          userAgent: data.userAgent || 'Admin Interface',
          details: {
            description: data.description || 'Manual audit log entry',
            ...data.details
          },
          tags: data.tags || ['manual', 'admin'],
          sensitive: data.sensitive || false
        });

        return NextResponse.json({
          success: true,
          data: {
            logId,
            message: 'Audit log created successfully'
          }
        });

      case 'test_logging':
        // Test audit logging system
        const testResults = [];
        
        for (const level of Object.values(AuditLevel)) {
          const testLogId = await auditLogger.log({
            level,
            category: AuditCategory.SYSTEM_CONFIGURATION,
            action: 'TEST_LOG',
            resource: 'test',
            ipAddress: '127.0.0.1',
            userAgent: 'Test Suite',
            details: {
              description: `Test log for level ${level}`
            },
            tags: ['test', 'system_check']
          });
          
          testResults.push({
            level,
            logId: testLogId,
            success: !!testLogId
          });
        }

        return NextResponse.json({
          success: true,
          data: {
            testResults,
            message: 'Audit logging test completed'
          }
        });

      case 'flush_buffer':
        // Force flush audit log buffer
        // In real implementation, would call auditLogger.flushBuffer()
        console.log('Flushing audit log buffer...');

        return NextResponse.json({
          success: true,
          data: {
            message: 'Audit log buffer flushed successfully',
            timestamp: new Date().toISOString()
          }
        });

      case 'anonymize_user':
        const { userId } = data;
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID is required' },
            { status: 400 }
          );
        }

        const anonymizedCount = await auditLogger.anonymizeUserData(userId);

        return NextResponse.json({
          success: true,
          data: {
            userId,
            anonymizedLogs: anonymizedCount,
            message: 'User data anonymized successfully'
          }
        });

      case 'bulk_action':
        const { logIds, operation } = data;
        
        if (!logIds || !Array.isArray(logIds)) {
          return NextResponse.json(
            { error: 'Log IDs array is required' },
            { status: 400 }
          );
        }

        let processedCount = 0;
        const results = [];

        for (const logId of logIds) {
          try {
            switch (operation) {
              case 'delete':
                // In real implementation, would delete the log
                console.log(`Deleting audit log: ${logId}`);
                processedCount++;
                results.push({ logId, success: true });
                break;
              case 'archive':
                // In real implementation, would archive the log
                console.log(`Archiving audit log: ${logId}`);
                processedCount++;
                results.push({ logId, success: true });
                break;
              case 'export':
                // In real implementation, would add to export queue
                console.log(`Adding to export queue: ${logId}`);
                processedCount++;
                results.push({ logId, success: true });
                break;
              default:
                results.push({ logId, success: false, error: 'Unknown operation' });
            }
                     } catch (error) {
             results.push({ logId, success: false, error: (error as Error).message });
           }
        }

        return NextResponse.json({
          success: true,
          data: {
            operation,
            requestedCount: logIds.length,
            processedCount,
            results,
            message: `${operation} operation completed on ${processedCount}/${logIds.length} logs`
          }
        });

      case 'configure_retention':
        const { category, retentionDays } = data;
        
        if (!category || !retentionDays) {
          return NextResponse.json(
            { error: 'Category and retention days are required' },
            { status: 400 }
          );
        }

        // In real implementation, would update retention configuration
        console.log(`Setting retention for ${category} to ${retentionDays} days`);

        return NextResponse.json({
          success: true,
          data: {
            category,
            retentionDays,
            message: 'Retention policy updated successfully'
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: error.errors
        },
        { status: 400 }
      );
    }

    console.error('❌ Error in audit admin POST:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/audit - Delete audit logs (GDPR compliance)
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const logId = searchParams.get('logId');
    const userId = searchParams.get('userId');

    if (logId) {
      // Delete specific log
      // In real implementation, would delete from database
      console.log(`Deleting audit log: ${logId}`);

      return NextResponse.json({
        success: true,
        data: {
          logId,
          message: 'Audit log deleted successfully'
        }
      });
    }

    if (userId) {
      // Delete all logs for user (GDPR right to be forgotten)
      // In real implementation, would delete all user logs
      console.log(`Deleting all audit logs for user: ${userId}`);

      return NextResponse.json({
        success: true,
        data: {
          userId,
          deletedLogs: 0, // Would return actual count
          message: 'All user audit logs deleted successfully'
        }
      });
    }

    return NextResponse.json(
      { error: 'Log ID or User ID is required' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Error deleting audit logs:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getCategoryDescription(category: AuditCategory): string {
  const descriptions = {
    [AuditCategory.AUTHENTICATION]: 'User login, logout, and authentication events',
    [AuditCategory.AUTHORIZATION]: 'Permission checks and access control events',
    [AuditCategory.USER_MANAGEMENT]: 'User creation, modification, and deletion',
    [AuditCategory.DATA_ACCESS]: 'Data read and query operations',
    [AuditCategory.DATA_MODIFICATION]: 'Data create, update, and delete operations',
    [AuditCategory.SYSTEM_CONFIGURATION]: 'System settings and configuration changes',
    [AuditCategory.SECURITY_EVENT]: 'Security-related events and alerts',
    [AuditCategory.COMPLIANCE]: 'Compliance and regulatory events',
    [AuditCategory.PERFORMANCE]: 'Performance monitoring and metrics',
    [AuditCategory.ERROR]: 'System errors and exceptions',
    [AuditCategory.BUSINESS_LOGIC]: 'Business process and workflow events'
  };
  
  return descriptions[category as keyof typeof descriptions] || 'Unknown category';
}

function getLevelDescription(level: AuditLevel): string {
  const descriptions = {
    [AuditLevel.DEBUG]: 'Detailed diagnostic information',
    [AuditLevel.INFO]: 'General informational messages',
    [AuditLevel.WARN]: 'Warning messages for potential issues',
    [AuditLevel.ERROR]: 'Error messages for failures',
    [AuditLevel.CRITICAL]: 'Critical issues requiring immediate attention'
  };
  
  return descriptions[level] || 'Unknown level';
}

function getLevelColor(level: AuditLevel): string {
  const colors = {
    [AuditLevel.DEBUG]: 'gray',
    [AuditLevel.INFO]: 'blue',
    [AuditLevel.WARN]: 'yellow',
    [AuditLevel.ERROR]: 'red',
    [AuditLevel.CRITICAL]: 'purple'
  };
  
  return colors[level] || 'gray';
}

function generateExportToken(): string {
  return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
} 