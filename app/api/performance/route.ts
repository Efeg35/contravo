import { NextRequest, NextResponse } from 'next/server';
import { performanceMonitoring, recordCustomMetric, getPerformanceMetrics, getActiveAlerts, PerformanceMetric } from '@/lib/performance-monitoring';
import { redisCache, getCacheStats } from '@/lib/redis-cache';
import { databaseOptimization, getDatabaseHealth, getConnectionPoolStats } from '@/lib/database-optimization';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'metrics' | 'alerts' | 'cache' | 'database' | 'health';
    const timeRange = searchParams.get('timeRange');
    const metricType = searchParams.get('metricType') as PerformanceMetric['type'] | null;

    let from: Date | undefined;
    let to: Date | undefined;

    if (timeRange) {
      const [fromStr, toStr] = timeRange.split(',');
      from = new Date(fromStr);
      to = new Date(toStr);
    }

    switch (type) {
      case 'metrics':
        const metrics = getPerformanceMetrics(
          metricType || undefined,
          from && to ? { from, to } : undefined
        );
        
        return NextResponse.json({
          success: true,
          data: metrics,
          count: metrics.length
        });

      case 'alerts':
        const alerts = getActiveAlerts();
        
        return NextResponse.json({
          success: true,
          data: alerts,
          count: alerts.length
        });

      case 'cache':
        const cacheStats = getCacheStats();
        const detailedCacheStats = await redisCache.getDetailedStats();
        
        return NextResponse.json({
          success: true,
          data: {
            basic: cacheStats,
            detailed: detailedCacheStats
          }
        });

      case 'database':
        const dbHealth = await getDatabaseHealth();
        const poolStats = getConnectionPoolStats();
        
        return NextResponse.json({
          success: true,
          data: {
            health: dbHealth,
            connectionPool: poolStats
          }
        });

      case 'health':
        const systemHealth = {
          cache: getCacheStats(),
          database: await getDatabaseHealth(),
          alerts: getActiveAlerts().length,
          timestamp: new Date()
        };
        
        return NextResponse.json({
          success: true,
          data: systemHealth
        });

      default:
        // Return overview
        const overview = {
          performance: {
            metrics: getPerformanceMetrics().slice(0, 100),
            alerts: getActiveAlerts()
          },
          cache: getCacheStats(),
          database: {
            health: await getDatabaseHealth(),
            pool: getConnectionPoolStats()
          },
          timestamp: new Date()
        };
        
        return NextResponse.json({
          success: true,
          data: overview
        });
    }

  } catch (error) {
    console.error('Performance API error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case 'record_metric':
        const { name, value, unit, tags } = data;
        recordCustomMetric(name, value, unit, tags);
        
        return NextResponse.json({
          success: true,
          message: 'Metric recorded successfully'
        });

      case 'cache_invalidate':
        const { keys, tags: invalidateTags, pattern } = data;
        let invalidatedCount = 0;
        
        if (keys) {
          invalidatedCount = await redisCache.delete(keys);
        } else if (invalidateTags) {
          invalidatedCount = await redisCache.invalidateByTags(invalidateTags);
        } else if (pattern) {
          invalidatedCount = await redisCache.invalidateByPattern(pattern);
        }
        
        return NextResponse.json({
          success: true,
          data: { invalidatedCount },
          message: `Invalidated ${invalidatedCount} cache entries`
        });

      case 'cache_flush':
        const flushed = await redisCache.flush();
        
        return NextResponse.json({
          success: flushed,
          message: flushed ? 'Cache flushed successfully' : 'Failed to flush cache'
        });

      case 'cache_warmup':
        const { warmupKeys } = data;
        const warmupResult = await redisCache.warmup(warmupKeys || []);
        
        return NextResponse.json({
          success: true,
          data: warmupResult,
          message: `Warmed up ${warmupResult.success} cache entries`
        });

      case 'resolve_alert':
        const { alertId } = data;
        const resolved = performanceMonitoring.resolveAlert(alertId);
        
        return NextResponse.json({
          success: resolved,
          message: resolved ? 'Alert resolved successfully' : 'Alert not found or already resolved'
        });

      case 'analyze_queries':
        const { timeRange: queryTimeRange } = data;
        const queryFrom = new Date(queryTimeRange.from);
        const queryTo = new Date(queryTimeRange.to);
        
        const queryAnalysis = await databaseOptimization.analyzeQueryPerformance({
          from: queryFrom,
          to: queryTo
        });
        
        return NextResponse.json({
          success: true,
          data: queryAnalysis
        });

      case 'optimize_connection_pool':
        const { targetUtilization } = data;
        const optimization = await databaseOptimization.optimizeConnectionPool(targetUtilization);
        
        return NextResponse.json({
          success: true,
          data: optimization
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action',
          message: `Action '${action}' is not supported`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Performance API POST error:');
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 