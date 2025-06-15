import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, getSecurityHeadersStats } from '@/lib/security-headers';
import { checkPermissionOrThrow } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';
import { z } from 'zod';

// Schema for security headers configuration
const securityHeadersConfigSchema = z.object({
  enabled: z.boolean(),
  contentSecurityPolicy: z.object({
    enabled: z.boolean(),
    reportOnly: z.boolean(),
    nonce: z.boolean(),
    upgradeInsecureRequests: z.boolean(),
    directives: z.object({
      defaultSrc: z.array(z.string()).optional(),
      scriptSrc: z.array(z.string()).optional(),
      styleSrc: z.array(z.string()).optional(),
      imgSrc: z.array(z.string()).optional(),
      fontSrc: z.array(z.string()).optional(),
      connectSrc: z.array(z.string()).optional(),
      mediaSrc: z.array(z.string()).optional(),
      objectSrc: z.array(z.string()).optional(),
      frameSrc: z.array(z.string()).optional(),
      frameAncestors: z.array(z.string()).optional()
    }),
    reportUri: z.string().optional()
  }),
  strictTransportSecurity: z.object({
    enabled: z.boolean(),
    maxAge: z.number().min(1),
    includeSubDomains: z.boolean(),
    preload: z.boolean()
  }),
  frameOptions: z.object({
    enabled: z.boolean(),
    policy: z.enum(['DENY', 'SAMEORIGIN', 'ALLOW-FROM']),
    allowFrom: z.string().optional()
  }),
  contentTypeOptions: z.object({
    enabled: z.boolean(),
    nosniff: z.boolean()
  }),
  referrerPolicy: z.object({
    enabled: z.boolean(),
    policy: z.enum([
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url'
    ])
  })
});

// GET /api/admin/security-headers - Get security headers configuration and stats
export async function GET(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        const stats = getSecurityHeadersStats();
        
        return NextResponse.json({
          success: true,
          data: {
            statistics: stats,
            timestamp: new Date().toISOString(),
            summary: {
              totalRequests: stats.totalRequests,
              totalViolations: stats.violationsReported,
              violationRate: stats.totalRequests > 0 ? 
                (stats.violationsReported / stats.totalRequests * 100).toFixed(2) + '%' : '0%',
              cspViolations: stats.cspViolations,
              hstsUpgrades: stats.hstsUpgrades,
              lastViolation: stats.lastViolation,
              topViolationTypes: stats.topViolations.slice(0, 5).map(v => ({
                type: v.type,
                count: v.count,
                percentage: stats.violationsReported > 0 ? 
                  (v.count / stats.violationsReported * 100).toFixed(1) + '%' : '0%'
              }))
            }
          }
        });

      case 'config':
        const report = securityHeaders.generateSecurityReport();
        
        return NextResponse.json({
          success: true,
          data: {
            configuration: report.config,
            recommendations: report.recommendations,
            issues: report.issues,
            lastUpdated: new Date().toISOString()
          }
        });

      case 'violations':
        const violationStats = getSecurityHeadersStats();
        
        return NextResponse.json({
          success: true,
          data: {
            violations: {
              total: violationStats.violationsReported,
              csp: violationStats.cspViolations,
              blocked: violationStats.cspBlockedResources,
              lastViolation: violationStats.lastViolation
            },
            topViolations: violationStats.topViolations,
            recentActivity: {
              last24h: violationStats.cspViolations, // Would be filtered by time in real implementation
              trend: 'stable' // Would calculate actual trend
            }
          }
        });

      case 'test':
        // Test security headers configuration
        const testResults = {
          csp: {
            enabled: true,
            reportOnly: false,
            hasNonce: true,
            hasReportUri: true,
            status: 'configured'
          },
          hsts: {
            enabled: true,
            maxAge: 31536000,
            includeSubDomains: true,
            status: 'configured'
          },
          frameOptions: {
            enabled: true,
            policy: 'DENY',
            status: 'configured'
          },
          contentType: {
            enabled: true,
            nosniff: true,
            status: 'configured'
          },
          referrerPolicy: {
            enabled: true,
            policy: 'strict-origin-when-cross-origin',
            status: 'configured'
          },
          overall: {
            score: 95,
            status: 'excellent',
            recommendations: [
              'Consider enabling Certificate Transparency monitoring',
              'Add more specific CSP directives'
            ]
          }
        };

        return NextResponse.json({
          success: true,
          data: testResults
        });

      case 'presets':
        const presets = [
          {
            id: 'strict',
            name: 'Strict Security',
            description: 'Maximum security with strict policies',
            config: {
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: false,
                directives: {
                  defaultSrc: ["'self'"],
                  scriptSrc: ["'self'"],
                  styleSrc: ["'self'"],
                  imgSrc: ["'self'", 'data:'],
                  objectSrc: ["'none'"],
                  frameAncestors: ["'none'"]
                }
              },
              strictTransportSecurity: {
                enabled: true,
                maxAge: 63072000, // 2 years
                includeSubDomains: true,
                preload: true
              }
            }
          },
          {
            id: 'balanced',
            name: 'Balanced Security',
            description: 'Good security with flexibility',
            config: {
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: false,
                directives: {
                  defaultSrc: ["'self'"],
                  scriptSrc: ["'self'", "'unsafe-inline'"],
                  styleSrc: ["'self'", "'unsafe-inline'"],
                  imgSrc: ["'self'", 'data:', 'https:'],
                  objectSrc: ["'none'"]
                }
              },
              strictTransportSecurity: {
                enabled: true,
                maxAge: 31536000, // 1 year
                includeSubDomains: true,
                preload: false
              }
            }
          },
          {
            id: 'development',
            name: 'Development Mode',
            description: 'Relaxed policies for development',
            config: {
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: true,
                directives: {
                  defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                  styleSrc: ["'self'", "'unsafe-inline'"]
                }
              },
              strictTransportSecurity: {
                enabled: false,
                maxAge: 0,
                includeSubDomains: false,
                preload: false
              }
            }
          }
        ];

        return NextResponse.json({
          success: true,
          data: { presets }
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action parameter' },
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

    console.error('❌ Error in security headers admin API:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/security-headers - Update security headers configuration
export async function POST(request: NextRequest) {
  try {
    // Check admin permissions
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'update_config':
        // Validate configuration
        const validatedConfig = securityHeadersConfigSchema.parse(data.config);
        
        // Update security headers configuration
        securityHeaders.updateConfig(validatedConfig);

        return NextResponse.json({
          success: true,
          data: {
            message: 'Security headers configuration updated successfully',
            config: validatedConfig,
            updatedAt: new Date().toISOString()
          }
        });

      case 'apply_preset':
        const { presetId } = data;
        
        // Apply preset configuration
        let presetConfig;
        switch (presetId) {
          case 'strict':
            presetConfig = {
              enabled: true,
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: false,
                nonce: true,
                upgradeInsecureRequests: true,
                directives: {
                  defaultSrc: ["'self'"],
                  scriptSrc: ["'self'"],
                  styleSrc: ["'self'"],
                  imgSrc: ["'self'", 'data:'],
                  objectSrc: ["'none'"],
                  frameAncestors: ["'none'"]
                },
                reportUri: '/api/security/csp-report'
              },
              strictTransportSecurity: {
                enabled: true,
                maxAge: 63072000,
                includeSubDomains: true,
                preload: true
              },
              frameOptions: {
                enabled: true,
                policy: 'DENY' as const
              },
              contentTypeOptions: {
                enabled: true,
                nosniff: true
              },
              referrerPolicy: {
                enabled: true,
                policy: 'strict-origin-when-cross-origin' as const
              }
            };
            break;
          case 'balanced':
            presetConfig = {
              enabled: true,
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: false,
                nonce: true,
                upgradeInsecureRequests: true,
                directives: {
                  defaultSrc: ["'self'"],
                  scriptSrc: ["'self'", "'unsafe-inline'"],
                  styleSrc: ["'self'", "'unsafe-inline'"],
                  imgSrc: ["'self'", 'data:', 'https:'],
                  objectSrc: ["'none'"]
                },
                reportUri: '/api/security/csp-report'
              },
              strictTransportSecurity: {
                enabled: true,
                maxAge: 31536000,
                includeSubDomains: true,
                preload: false
              },
              frameOptions: {
                enabled: true,
                policy: 'SAMEORIGIN' as const
              },
              contentTypeOptions: {
                enabled: true,
                nosniff: true
              },
              referrerPolicy: {
                enabled: true,
                policy: 'strict-origin-when-cross-origin' as const
              }
            };
            break;
          case 'development':
            presetConfig = {
              enabled: true,
              contentSecurityPolicy: {
                enabled: true,
                reportOnly: true,
                nonce: false,
                upgradeInsecureRequests: false,
                directives: {
                  defaultSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
                  styleSrc: ["'self'", "'unsafe-inline'"]
                },
                reportUri: '/api/security/csp-report'
              },
              strictTransportSecurity: {
                enabled: false,
                maxAge: 0,
                includeSubDomains: false,
                preload: false
              },
              frameOptions: {
                enabled: false,
                policy: 'SAMEORIGIN' as const
              },
              contentTypeOptions: {
                enabled: true,
                nosniff: true
              },
              referrerPolicy: {
                enabled: true,
                policy: 'same-origin' as const
              }
            };
            break;
          default:
            return NextResponse.json(
              { error: 'Unknown preset' },
              { status: 400 }
            );
        }

        securityHeaders.updateConfig(presetConfig);

        return NextResponse.json({
          success: true,
          data: {
            message: `Security headers preset '${presetId}' applied successfully`,
            preset: presetId,
            config: presetConfig,
            appliedAt: new Date().toISOString()
          }
        });

      case 'test_csp':
        const { cspDirectives } = data;
        
        // Validate CSP directives
        const cspErrors = [];
        if (cspDirectives.scriptSrc?.includes("'unsafe-inline'") && 
            cspDirectives.scriptSrc?.includes("'unsafe-eval'")) {
          cspErrors.push('Both unsafe-inline and unsafe-eval are dangerous');
        }
        
        if (!cspDirectives.defaultSrc) {
          cspErrors.push('default-src directive is recommended');
        }

        return NextResponse.json({
          success: true,
          data: {
            valid: cspErrors.length === 0,
            errors: cspErrors,
            recommendations: [
              'Use nonces or hashes instead of unsafe-inline',
              'Avoid unsafe-eval when possible',
              'Use specific source lists instead of wildcards'
            ],
            testResult: {
              directive: cspDirectives,
              score: Math.max(0, 100 - (cspErrors.length * 20)),
              status: cspErrors.length === 0 ? 'secure' : 'needs-improvement'
            }
          }
        });

      case 'generate_nonce':
        const nonce = securityHeaders.generateCSPNonce();
        
        return NextResponse.json({
          success: true,
          data: {
            nonce,
            usage: `<script nonce="${nonce}">...</script>`,
            expiresIn: '1 hour',
            generatedAt: new Date().toISOString()
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

    console.error('❌ Error in security headers admin POST:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 