import { NextRequest, NextResponse } from 'next/server';
import { getSearchMetrics, getSearchInsights, getRealTimeSearchStats, exportSearchAnalytics } from '@/lib/search-analytics';

export async function GET(request: NextRequest) {
  try {
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

  } catch (_error) {
    console.error('Search analytics API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: _error instanceof Error ? _error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 