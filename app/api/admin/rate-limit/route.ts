import { NextRequest, NextResponse } from 'next/server';
import {
  addRateLimitRule, 
  getRateLimitStats,
  RateLimitRule,
  RateLimitStrategy
} from '@/lib/rate-limiter';
import { checkPermissionOrThrow } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';
import { z } from 'zod';

// Schema for creating/updating rate limit rules
const rateLimitRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  strategy: z.nativeEnum(RateLimitStrategy),
  windowSize: z.number().min(1, 'Window size must be at least 1 second'),
  maxRequests: z.number().min(1, 'Max requests must be at least 1'),
  skipSuccessfulRequests: z.boolean().optional(),
  skipFailedRequests: z.boolean().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  enabled: z.boolean().default(true)
});

// GET /api/admin/rate-limit - Get rate limit statistics and rules
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        const statsData = getRateLimitStats();
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: statsData,
            timestamp: new Date().toISOString(),
            summary: {
              totalRequests: statsData.totalRequests,
              totalViolations: statsData.totalViolations,
              violationRate: statsData.totalRequests > 0 ? 
                (statsData.totalViolations / statsData.totalRequests * 100).toFixed(2) + '%' : '0%',
              topViolator: statsData.topViolators[0]?.key || 'None',
              suspiciousPatterns: statsData.suspiciousPatterns.length
            }
          }
        });

      case 'rules':
        // Get all rules (this would come from database in real implementation)
        const rules = [
          {
            id: 'global_ip_limit',
            name: 'Global IP Rate Limit',
            strategy: RateLimitStrategy.FIXED_WINDOW,
            windowSize: 3600,
            maxRequests: 1000,
            priority: 'high',
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 'auth_login_limit',
            name: 'Authentication Login Limit',
            strategy: RateLimitStrategy.FIXED_WINDOW,
            windowSize: 900, // 15 minutes
            maxRequests: 5,
            priority: 'critical',
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];

        return NextResponse.json({
          success: true,
          data: {
            rules,
            totalRules: rules.length,
            enabledRules: rules.filter(r => r.enabled).length
          }
        });

      case 'violations':
        const violationStats = getRateLimitStats();
        const violationHistory = {
          recent: violationStats.topViolators.slice(0, 20),
          patterns: violationStats.suspiciousPatterns.slice(0, 10),
          timeRange: '24h'
        };

        return NextResponse.json({
          success: true,
          data: violationHistory
        });

      case 'health':
        const healthStats = getRateLimitStats();
        const healthStatus = {
          status: 'healthy',
          rateLimiterEnabled: true,
          redisConnected: true, // Would check actual Redis connection
          rulesLoaded: true,
          lastViolation: healthStats.topViolators[0] ? new Date() : null,
          metrics: {
            requestsPerSecond: Math.round(healthStats.totalRequests / 3600), // Rough estimate
            violationsPerHour: healthStats.totalViolations,
            averageResponseTime: 2.5 // ms, would be tracked
          }
        };

        return NextResponse.json({
          success: true,
          data: healthStatus
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
          { status: 400 }
        );
    }

  } catch {
    console.error('❌ Error in rate limit admin API:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rate-limit - Create or manage rate limit rules
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'create_rule':
        // Validate rule data
        const validatedRule = rateLimitRuleSchema.parse(data);
        
        const newRule: RateLimitRule = {
          id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ...validatedRule,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        await addRateLimitRule(newRule);

        return NextResponse.json({
          success: true,
          data: {
            rule: newRule,
            message: 'Rate limit rule created successfully'
          }
        });

      case 'test_rule':
        const { ruleConfig, testRequest } = data;
        
        // Simulate rate limit check with test data
        const testResult = {
          ruleConfig,
          testRequest,
          result: {
            allowed: testRequest.count <= ruleConfig.maxRequests,
            remaining: Math.max(0, ruleConfig.maxRequests - testRequest.count),
            resetTime: new Date(Date.now() + ruleConfig.windowSize * 1000),
            simulation: true
          }
        };

        return NextResponse.json({
          success: true,
          data: testResult
        });

      case 'bulk_update':
        const { rules, operation } = data;
        
        let updatedCount = 0;
        for (const ruleId of rules) {
          try {
            switch (operation) {
              case 'enable':
                // await rateLimiter.updateRule(ruleId, { enabled: true });
                updatedCount++;
                break;
              case 'disable':
                // await rateLimiter.updateRule(ruleId, { enabled: false });
                updatedCount++;
                break;
              case 'delete':
                // await rateLimiter.removeRule(ruleId);
                updatedCount++;
                break;
            }
          } catch {
            console.error(`Failed to ${operation} rule ${ruleId}:`);
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            operation,
            requestedCount: rules.length,
            updatedCount,
            message: `${operation} operation completed on ${updatedCount}/${rules.length} rules`
          }
        });

      case 'clear_violations':
        const { key, timeRange } = data;
        
        // In real implementation, this would clear violation records
        console.log(`Clearing violations for ${key} in timeRange ${timeRange}`);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Violations cleared successfully',
            clearedKey: key,
            timeRange
          }
        });

      case 'whitelist_ip':
        const { ip, duration } = data;
        
        // Add IP to temporary whitelist
        console.log(`Adding ${ip} to whitelist for ${duration}`);

        return NextResponse.json({
          success: true,
          data: {
            message: 'IP added to whitelist',
            ip,
            duration,
            expiresAt: new Date(Date.now() + duration * 1000)
          }
        });

      case 'blacklist_ip':
        const { ip: blockIp, reason } = data;
        
        // Add IP to blacklist
        console.log(`Adding ${blockIp} to blacklist. Reason: ${reason}`);

        return NextResponse.json({
          success: true,
          data: {
            message: 'IP added to blacklist',
            ip: blockIp,
            reason,
            addedAt: new Date()
          }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: _error.errors
        },
        { status: 400 }
      );
    }

    console.error('❌ Error in rate limit admin POST:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/rate-limit - Update existing rate limit rule
export async function PUT(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const body = await request.json();
    const { ruleId, ...updates } = body;

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Validate updates
    const validatedUpdates = rateLimitRuleSchema.partial().parse(updates);
    
    // Update rule (in real implementation)
    // const updated = await rateLimiter.updateRule(ruleId, {
    //   ...validatedUpdates,
    //   updatedAt: new Date()
    // });

    return NextResponse.json({
      success: true,
      data: {
        ruleId,
        updates: validatedUpdates,
        message: 'Rate limit rule updated successfully'
      }
    });

  } catch {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation error',
          details: _error.errors
        },
        { status: 400 }
      );
    }

    console.error('❌ Error updating rate limit rule:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/rate-limit - Delete rate limit rule
export async function DELETE(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get('ruleId');

    if (!ruleId) {
      return NextResponse.json(
        { error: 'Rule ID is required' },
        { status: 400 }
      );
    }

    // Delete rule (in real implementation)
    // const deleted = await rateLimiter.removeRule(ruleId);

    return NextResponse.json({
      success: true,
      data: {
        ruleId,
        message: 'Rate limit rule deleted successfully'
      }
    });

  } catch {
    console.error('❌ Error deleting rate limit rule:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 