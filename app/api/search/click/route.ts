import { NextRequest, NextResponse } from 'next/server';
import { trackClick, trackDwellTime } from '@/lib/search-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchEventId, resultId, resultType, position, dwellTime } = body;

    if (!searchEventId || !resultId || !resultType || position === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: searchEventId, resultId, resultType, position' },
        { status: 400 }
      );
    }

    const userId = (request as any).headers.get('x-user-id') || 'anonymous';

    // Track click event
    trackClick({
      searchEventId,
      userId,
      resultId,
      resultType,
      position: parseInt(position),
      dwellTime: dwellTime ? parseInt(dwellTime) : undefined
    });

    return NextResponse.json({
      success: true,
      message: 'Click tracked successfully'
    });

  } catch {
    console.error('Click tracking API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: _error instanceof Error ? _error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { clickEventId, dwellTime } = body;

    if (!clickEventId || !dwellTime) {
      return NextResponse.json(
        { error: 'Missing required fields: clickEventId, dwellTime' },
        { status: 400 }
      );
    }

    // Track dwell time
    trackDwellTime(clickEventId, parseInt(dwellTime));

    return NextResponse.json({
      success: true,
      message: 'Dwell time tracked successfully'
    });

  } catch {
    console.error('Dwell time tracking API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: _error instanceof Error ? _error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 