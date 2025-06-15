import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders } from '@/lib/security-headers';

// CSP Violation Report interface
interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code'?: number;
    'script-sample'?: string;
  };
}

// POST /api/security/csp-report - Handle CSP violation reports
export async function POST(request: NextRequest) {
  try {
    const contentType = (request as any).headers.get('content-type');
    
    // CSP reports are sent as application/csp-report or application/json
    if (!contentType?.includes('application/json') && !contentType?.includes('application/csp-report')) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    const body = await request.json() as CSPViolationReport;
    const report = body['csp-report'];

    if (!report) {
      return NextResponse.json(
        { error: 'Invalid CSP report format' },
        { status: 400 }
      );
    }

    // Extract violation details
    const violation = {
      documentUri: report['document-uri'],
      referrer: report.referrer,
      blockedUri: report['blocked-uri'],
      violatedDirective: report['violated-directive'],
      originalPolicy: report['original-policy'],
      disposition: report.disposition,
      sourceFile: report['source-file'],
      lineNumber: report['line-number'],
      columnNumber: report['column-number']
    };

    // Report violation to security headers manager
    await securityHeaders.reportCSPViolation(violation);

    // Log violation for monitoring
    console.warn('🚨 CSP Violation reported:', {
      documentUri: violation.documentUri,
      violatedDirective: violation.violatedDirective,
      blockedUri: violation.blockedUri,
      sourceFile: violation.sourceFile,
      userAgent: (request as any).headers.get('user-agent'),
      ip: (request as any).headers.get('x-forwarded-for') || (request as any).headers.get('x-real-ip') || 'unknown'
    });

    return NextResponse.json({ status: 'ok' }, { status: 204 });

  } catch (error) {
    console.error('❌ Error processing CSP report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/security/csp-report - Get CSP violation statistics (admin only)
export async function GET() {
  try {
    const stats = securityHeaders.getStats();
    
    return NextResponse.json({
      success: true,
      data: {
        violations: {
          total: stats.cspViolations,
          blockedResources: stats.cspBlockedResources,
          lastViolation: stats.lastViolation,
          topViolations: stats.topViolations
        },
        summary: {
          violationRate: stats.totalRequests > 0 ? 
            (stats.cspViolations / stats.totalRequests * 100).toFixed(2) + '%' : '0%',
          mostViolatedDirective: stats.topViolations[0]?.type || 'None',
          recentViolations: stats.topViolations.slice(0, 5)
        }
      }
    });

  } catch (error) {
    console.error('❌ Error getting CSP statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 