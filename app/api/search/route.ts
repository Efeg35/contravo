import { NextRequest, NextResponse } from 'next/server';
import { searchEngine, SearchQuery } from '@/lib/search-engine';
import { trackSearch } from '@/lib/search-analytics';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      query, 
      type, 
      filters, 
      sort, 
      pagination, 
      highlight = true, 
      fuzzy = false,
      boost,
      indexName = 'default'
    } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query parameter is required and must be a string' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Build search query
    const searchQuery: SearchQuery = {
      query,
      type,
      filters,
      sort,
      pagination,
      highlight,
      fuzzy,
      boost
    };

    // Execute search
    const results = await searchEngine.search(indexName, searchQuery);

    // Track search analytics
    const userAgent = (request as any).headers.get('user-agent') || '';
    const userId = (request as any).headers.get('x-user-id') || 'anonymous';
    const sessionId = (request as any).headers.get('x-session-id') || `session_${Date.now()}`;
    const ipAddress = (request as any).headers.get('x-forwarded-for') || 
                     (request as any).headers.get('x-real-ip') || 
                     'unknown';

    trackSearch({
      userId,
      sessionId,
      query,
      resultCount: results.total,
      executionTime: results.took,
      clickedResults: [],
      filters: filters || {},
      sort: sort ? sort.map((s: { field: string; order: string }) => `${s.field}:${s.order}`).join(',') : '',
      page: pagination?.page || 1,
      userAgent,
      ipAddress,
      source: 'api',
      context: {
        section: 'search',
        refinement: false
      }
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query: searchQuery,
        executionTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Search API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort');
    const highlight = searchParams.get('highlight') !== 'false';
    const fuzzy = searchParams.get('fuzzy') === 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter (q) is required' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    // Build search query from URL parameters
    const searchQuery: SearchQuery = {
      query,
      type: type as 'document' | 'user' | 'company' | undefined,
      pagination: { page, limit },
      highlight,
      fuzzy
    };

    // Add sort if provided
    if (sort) {
      searchQuery.sort = sort.split(',').map(s => {
        const [field, direction] = s.split(':');
        return { field, order: (direction as 'asc' | 'desc') || 'asc' };
      });
    }

    // Add filters from query parameters
    const filters: Record<string, string> = {};
    const searchParamsArray = Array.from(searchParams.entries());
    for (const [key, value] of searchParamsArray) {
      if (!['q', 'type', 'page', 'limit', 'sort', 'highlight', 'fuzzy'].includes(key)) {
        filters[key] = value;
      }
    }

    if (Object.keys(filters).length > 0) {
      // Convert simple filters to SearchQuery filters format
      const filterEntries = Object.entries(filters);
      if (filterEntries.some(([key]) => ['tags', 'createdBy', 'status'].includes(key))) {
        searchQuery.filters = {};
        for (const [key, value] of filterEntries) {
          if (key === 'tags' || key === 'createdBy' || key === 'status') {
            (searchQuery.filters as Record<string, string[]>)[key] = Array.isArray(value) ? value : [value];
          } else if (key.startsWith('metadata.')) {
            if (!searchQuery.filters.metadata) {
              searchQuery.filters.metadata = {};
            }
            searchQuery.filters.metadata[key.replace('metadata.', '')] = value;
          }
        }
      }
    }

    // Execute search
    const results = await searchEngine.search('default', searchQuery);

    // Track search analytics
    const userAgent = (request as any).headers.get('user-agent') || '';
    const userId = (request as any).headers.get('x-user-id') || 'anonymous';
    const sessionId = (request as any).headers.get('x-session-id') || `session_${Date.now()}`;
    const ipAddress = (request as any).headers.get('x-forwarded-for') || 
                     (request as any).headers.get('x-real-ip') || 
                     'unknown';

    trackSearch({
      userId,
      sessionId,
      query,
      resultCount: results.total,
      executionTime: results.took,
      clickedResults: [],
      filters,
      sort: sort || '',
      page,
      userAgent,
      ipAddress,
      source: 'api',
      context: {
        section: 'search',
        refinement: false
      }
    });

    return NextResponse.json({
      success: true,
      data: results,
      meta: {
        query: searchQuery,
        executionTime: Date.now() - startTime
      }
    });

  } catch (error) {
    console.error('Search API error:');
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 