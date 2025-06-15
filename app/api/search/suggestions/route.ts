import { NextRequest, NextResponse } from 'next/server';
import { getFilterSuggestions } from '@/lib/advanced-filtering';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table') || 'contracts';
    const field = searchParams.get('field');
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!field) {
      return NextResponse.json(
        { error: 'Field parameter is required' },
        { status: 400 }
      );
    }

    const suggestions = await getFilterSuggestions(table, field, query || undefined, limit);

    return NextResponse.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('Search suggestions API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 