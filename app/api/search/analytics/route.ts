import { NextRequest, NextResponse } from 'next/server';
import { getSearchMetrics, getSearchInsights, getRealTimeSearchStats, exportSearchAnalytics } from '@/lib/search-analytics';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { checkPermissionOrThrow } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions - only admins can see search analytics
    await checkPermissionOrThrow(Permission.SYSTEM_ADMIN);

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    const format = searchParams.get('format') as 'json' | 'csv' || 'json';
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');

    let dateRange: { from: Date; to: Date } | undefined;
    if (fromDate && toDate) {
      dateRange = {
        from: new Date(fromDate),
        to: new Date(toDate)
      };
    }

    switch (type) {
      case 'metrics':
        const metrics = getSearchMetrics(dateRange);
        return NextResponse.json({
          success: true,
          data: metrics
        });

      case 'insights':
        const insights = getSearchInsights(dateRange);
        return NextResponse.json({
          success: true,
          data: insights
        });

      case 'realtime':
        const realtimeStats = getRealTimeSearchStats();
        return NextResponse.json({
          success: true,
          data: realtimeStats
        });

      case 'export':
        const exportData = exportSearchAnalytics(format, dateRange);
        
        if (format === 'csv') {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': 'attachment; filename="search-analytics.csv"'
            }
          });
        } else {
          return new NextResponse(exportData, {
            headers: {
              'Content-Type': 'application/json',
              'Content-Disposition': 'attachment; filename="search-analytics.json"'
            }
          });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter. Use: metrics, insights, realtime, or export' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Search analytics API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 