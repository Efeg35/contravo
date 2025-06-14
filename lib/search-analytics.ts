export interface SearchEvent {
  id: string;
  userId: string;
  sessionId: string;
  query: string;
  normalizedQuery: string;
  timestamp: Date;
  resultCount: number;
  executionTime: number;
  clickedResults: string[];
  filters: Record<string, unknown>;
  sort: string;
  page: number;
  userAgent: string;
  ipAddress: string;
  source: 'web' | 'mobile' | 'api';
  context: {
    section: string;
    previousQuery?: string;
    refinement?: boolean;
  };
}

export interface ClickEvent {
  id: string;
  searchEventId: string;
  userId: string;
  resultId: string;
  resultType: string;
  position: number;
  timestamp: Date;
  dwellTime?: number; // Time spent on clicked result
}

export interface SearchSession {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  queries: string[];
  totalSearches: number;
  successfulSearches: number; // Searches that led to clicks
  abandonedSearches: number;
  averageResultCount: number;
  totalDwellTime: number;
  conversionEvents: string[]; // Actions taken after search
}

export interface SearchMetrics {
  totalSearches: number;
  uniqueUsers: number;
  averageSearchesPerUser: number;
  averageResultsPerSearch: number;
  averageExecutionTime: number;
  clickThroughRate: number;
  zeroResultRate: number;
  refinementRate: number;
  abandonmentRate: number;
  topQueries: Array<{ query: string; count: number; ctr: number }>;
  topFailedQueries: Array<{ query: string; count: number; avgResults: number }>;
  searchTrends: Array<{ date: string; searches: number; users: number }>;
  performanceMetrics: {
    fastQueries: number; // < 100ms
    mediumQueries: number; // 100ms - 1s
    slowQueries: number; // > 1s
    averageTime: number;
    p95Time: number;
    p99Time: number;
  };
}

export interface UserSearchBehavior {
  userId: string;
  totalSearches: number;
  uniqueQueries: number;
  averageQueryLength: number;
  preferredFilters: Record<string, number>;
  searchPatterns: {
    timeOfDay: Record<string, number>;
    dayOfWeek: Record<string, number>;
    queryTypes: Record<string, number>;
  };
  clickBehavior: {
    averagePosition: number;
    clickThroughRate: number;
    averageDwellTime: number;
  };
  conversionRate: number;
  lastSearchDate: Date;
}

export interface SearchInsight {
  type: 'opportunity' | 'issue' | 'trend' | 'performance';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  metrics: Record<string, number>;
  recommendations: string[];
  dateRange: { from: Date; to: Date };
}

export class SearchAnalytics {
  private static instance: SearchAnalytics;
  private searchEvents: Map<string, SearchEvent> = new Map();
  private clickEvents: Map<string, ClickEvent> = new Map();
  private searchSessions: Map<string, SearchSession> = new Map();
  private userBehaviors: Map<string, UserSearchBehavior> = new Map();
  
  private readonly MAX_EVENTS = 100000; // Keep last 100k events
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private readonly ANALYTICS_BATCH_SIZE = 1000;

  private constructor() {
    this.startAnalyticsProcessing();
  }

  static getInstance(): SearchAnalytics {
    if (!SearchAnalytics.instance) {
      SearchAnalytics.instance = new SearchAnalytics();
    }
    return SearchAnalytics.instance;
  }

  // Track search event
  trackSearch(event: Omit<SearchEvent, 'id' | 'timestamp' | 'normalizedQuery'>): void {
    const searchEvent: SearchEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      normalizedQuery: this.normalizeQuery(event.query)
    };

    this.searchEvents.set(searchEvent.id, searchEvent);
    this.updateSearchSession(searchEvent);
    this.updateUserBehavior(searchEvent);

    // Cleanup old events
    this.cleanupOldEvents();

    console.log(`📊 Tracked search: "${event.query}" - ${event.resultCount} results in ${event.executionTime}ms`);
  }

  // Track click event
  trackClick(event: Omit<ClickEvent, 'id' | 'timestamp'>): void {
    const clickEvent: ClickEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date()
    };

    this.clickEvents.set(clickEvent.id, clickEvent);
    this.updateClickBehavior(clickEvent);

    console.log(`👆 Tracked click: result ${event.resultId} at position ${event.position}`);
  }

  // Track dwell time (time spent on clicked result)
  trackDwellTime(clickEventId: string, dwellTime: number): void {
    const clickEvent = this.clickEvents.get(clickEventId);
    if (clickEvent) {
      clickEvent.dwellTime = dwellTime;
      this.updateUserDwellTime(clickEvent.userId);
      console.log(`⏱️ Tracked dwell time: ${dwellTime}ms for click ${clickEventId}`);
    }
  }

  // Track conversion event (action taken after search)
  trackConversion(searchEventId: string, conversionType: string): void {
    const searchEvent = this.searchEvents.get(searchEventId);
    if (searchEvent) {
      const session = this.searchSessions.get(searchEvent.sessionId);
      if (session) {
        session.conversionEvents.push(conversionType);
        this.updateUserConversion(searchEvent.userId);
        console.log(`🎯 Tracked conversion: ${conversionType} for search ${searchEventId}`);
      }
    }
  }

  // Get comprehensive search metrics
  getSearchMetrics(dateRange?: { from: Date; to: Date }): SearchMetrics {
    const events = this.getEventsInRange(dateRange);
    const clicks = this.getClicksInRange(dateRange);

    const totalSearches = events.length;
    const uniqueUsers = new Set(events.map(e => e.userId)).size;
    const totalResults = events.reduce((sum, e) => sum + e.resultCount, 0);
    const totalExecutionTime = events.reduce((sum, e) => sum + e.executionTime, 0);
    const searchesWithClicks = new Set(clicks.map(c => c.searchEventId)).size;
    const zeroResultSearches = events.filter(e => e.resultCount === 0).length;

    // Calculate refinement rate (searches that are modifications of previous queries)
    const refinements = events.filter(e => e.context.refinement).length;

    // Calculate abandonment rate (sessions with no clicks)
    const sessions = Array.from(this.searchSessions.values());
    const sessionsInRange = sessions.filter(s => 
      !dateRange || (s.startTime >= dateRange.from && s.startTime <= dateRange.to)
    );
    const abandonedSessions = sessionsInRange.filter(s => s.successfulSearches === 0).length;

    // Top queries analysis
    const queryFrequency = new Map<string, { count: number; clicks: number }>();
    for (const event of events) {
      const existing = queryFrequency.get(event.normalizedQuery) || { count: 0, clicks: 0 };
      existing.count++;
      queryFrequency.set(event.normalizedQuery, existing);
    }

    for (const click of clicks) {
      const searchEvent = this.searchEvents.get(click.searchEventId);
      if (searchEvent) {
        const existing = queryFrequency.get(searchEvent.normalizedQuery);
        if (existing) {
          existing.clicks++;
        }
      }
    }

    const topQueries = Array.from(queryFrequency.entries())
      .map(([query, stats]) => ({
        query,
        count: stats.count,
        ctr: stats.count > 0 ? stats.clicks / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topFailedQueries = events
      .filter(e => e.resultCount === 0)
      .reduce((acc, e) => {
        acc[e.normalizedQuery] = (acc[e.normalizedQuery] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topFailedQueriesArray = Object.entries(topFailedQueries)
      .map(([query, count]) => ({ query, count, avgResults: 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Search trends (daily aggregation)
    const trends = this.calculateSearchTrends(events);

    // Performance metrics
    const executionTimes = events.map(e => e.executionTime).sort((a, b) => a - b);
    const performanceMetrics = {
      fastQueries: events.filter(e => e.executionTime < 100).length,
      mediumQueries: events.filter(e => e.executionTime >= 100 && e.executionTime <= 1000).length,
      slowQueries: events.filter(e => e.executionTime > 1000).length,
      averageTime: totalExecutionTime / totalSearches || 0,
      p95Time: executionTimes[Math.floor(executionTimes.length * 0.95)] || 0,
      p99Time: executionTimes[Math.floor(executionTimes.length * 0.99)] || 0
    };

    return {
      totalSearches,
      uniqueUsers,
      averageSearchesPerUser: uniqueUsers > 0 ? totalSearches / uniqueUsers : 0,
      averageResultsPerSearch: totalSearches > 0 ? totalResults / totalSearches : 0,
      averageExecutionTime: totalSearches > 0 ? totalExecutionTime / totalSearches : 0,
      clickThroughRate: totalSearches > 0 ? searchesWithClicks / totalSearches : 0,
      zeroResultRate: totalSearches > 0 ? zeroResultSearches / totalSearches : 0,
      refinementRate: totalSearches > 0 ? refinements / totalSearches : 0,
      abandonmentRate: sessionsInRange.length > 0 ? abandonedSessions / sessionsInRange.length : 0,
      topQueries,
      topFailedQueries: topFailedQueriesArray,
      searchTrends: trends,
      performanceMetrics
    };
  }

  // Get user search behavior analysis
  getUserBehavior(userId: string): UserSearchBehavior | null {
    return this.userBehaviors.get(userId) || null;
  }

  // Get all user behaviors (for admin analysis)
  getAllUserBehaviors(): UserSearchBehavior[] {
    return Array.from(this.userBehaviors.values());
  }

  // Generate search insights and recommendations
  generateInsights(dateRange?: { from: Date; to: Date }): SearchInsight[] {
    const metrics = this.getSearchMetrics(dateRange);
    const insights: SearchInsight[] = [];

    // High zero result rate insight
    if (metrics.zeroResultRate > 0.2) {
      insights.push({
        type: 'issue',
        title: 'High Zero Result Rate',
        description: `${(metrics.zeroResultRate * 100).toFixed(1)}% of searches return no results`,
        impact: 'high',
        metrics: { zeroResultRate: metrics.zeroResultRate },
        recommendations: [
          'Improve search algorithm and indexing',
          'Add query suggestions and auto-complete',
          'Implement fuzzy matching for typos',
          'Analyze failed queries and add missing content'
        ],
        dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
      });
    }

    // Low click-through rate insight
    if (metrics.clickThroughRate < 0.3) {
      insights.push({
        type: 'issue',
        title: 'Low Click-Through Rate',
        description: `Only ${(metrics.clickThroughRate * 100).toFixed(1)}% of searches result in clicks`,
        impact: 'high',
        metrics: { clickThroughRate: metrics.clickThroughRate },
        recommendations: [
          'Improve search result relevance and ranking',
          'Enhance result snippets and previews',
          'Add more visual elements to results',
          'Implement better result categorization'
        ],
        dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
      });
    }

    // Slow query performance insight
    if (metrics.performanceMetrics.averageTime > 500) {
      insights.push({
        type: 'performance',
        title: 'Slow Search Performance',
        description: `Average search time is ${metrics.performanceMetrics.averageTime.toFixed(0)}ms`,
        impact: 'medium',
        metrics: { 
          averageTime: metrics.performanceMetrics.averageTime,
          slowQueries: metrics.performanceMetrics.slowQueries
        },
        recommendations: [
          'Optimize search indexes and database queries',
          'Implement search result caching',
          'Consider search engine scaling',
          'Add search performance monitoring'
        ],
        dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
      });
    }

    // High refinement rate opportunity
    if (metrics.refinementRate > 0.4) {
      insights.push({
        type: 'opportunity',
        title: 'High Query Refinement Rate',
        description: `${(metrics.refinementRate * 100).toFixed(1)}% of searches are refinements`,
        impact: 'medium',
        metrics: { refinementRate: metrics.refinementRate },
        recommendations: [
          'Improve initial search result quality',
          'Add better filtering and sorting options',
          'Implement search suggestions during typing',
          'Provide guided search experience'
        ],
        dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
      });
    }

    // Popular queries trend
    const topQuery = metrics.topQueries[0];
    if (topQuery && topQuery.count > metrics.totalSearches * 0.1) {
      insights.push({
        type: 'trend',
        title: 'Dominant Search Query',
        description: `"${topQuery.query}" accounts for ${((topQuery.count / metrics.totalSearches) * 100).toFixed(1)}% of all searches`,
        impact: 'medium',
        metrics: { 
          queryCount: topQuery.count,
          queryPercentage: topQuery.count / metrics.totalSearches
        },
        recommendations: [
          'Create dedicated landing page for this query',
          'Optimize content for this search term',
          'Consider featuring related content prominently',
          'Analyze user intent behind this popular query'
        ],
        dateRange: dateRange || { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() }
      });
    }

    return insights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  // Export analytics data
  exportAnalytics(format: 'json' | 'csv', dateRange?: { from: Date; to: Date }): string {
    const events = this.getEventsInRange(dateRange);
    const clicks = this.getClicksInRange(dateRange);
    const metrics = this.getSearchMetrics(dateRange);

    if (format === 'json') {
      return JSON.stringify({
        summary: metrics,
        events: events.slice(0, 10000), // Limit for performance
        clicks: clicks.slice(0, 10000),
        insights: this.generateInsights(dateRange)
      }, null, 2);
    } else {
      // CSV format
      const csvHeaders = [
        'timestamp', 'userId', 'query', 'resultCount', 'executionTime', 
        'clicked', 'clickPosition', 'dwellTime'
      ];

      const csvRows = events.map(event => {
        const eventClicks = clicks.filter(c => c.searchEventId === event.id);
        const clicked = eventClicks.length > 0;
        const clickPosition = clicked ? Math.min(...eventClicks.map(c => c.position)) : '';
        const dwellTime = eventClicks.reduce((sum, c) => sum + (c.dwellTime || 0), 0);

        return [
          event.timestamp.toISOString(),
          event.userId,
          event.query,
          event.resultCount,
          event.executionTime,
          clicked,
          clickPosition,
          dwellTime
        ].join(',');
      });

      return [csvHeaders.join(','), ...csvRows].join('\n');
    }
  }

  // Get real-time search statistics
  getRealTimeStats(): {
    activeUsers: number;
    searchesLastHour: number;
    averageResponseTime: number;
    topQueriesLastHour: Array<{ query: string; count: number }>;
    systemHealth: 'healthy' | 'warning' | 'critical';
  } {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentEvents = Array.from(this.searchEvents.values())
      .filter(e => e.timestamp >= oneHourAgo);

    const activeUsers = new Set(recentEvents.map(e => e.userId)).size;
    const searchesLastHour = recentEvents.length;
    const averageResponseTime = recentEvents.length > 0 
      ? recentEvents.reduce((sum, e) => sum + e.executionTime, 0) / recentEvents.length 
      : 0;

    const queryFreq = new Map<string, number>();
    for (const event of recentEvents) {
      queryFreq.set(event.normalizedQuery, (queryFreq.get(event.normalizedQuery) || 0) + 1);
    }

    const topQueriesLastHour = Array.from(queryFreq.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (averageResponseTime > 2000) {
      systemHealth = 'critical';
    } else if (averageResponseTime > 1000) {
      systemHealth = 'warning';
    }

    return {
      activeUsers,
      searchesLastHour,
      averageResponseTime,
      topQueriesLastHour,
      systemHealth
    };
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, '');
  }

  private updateSearchSession(event: SearchEvent): void {
    let session = this.searchSessions.get(event.sessionId);
    
    if (!session) {
      session = {
        id: event.sessionId,
        userId: event.userId,
        startTime: event.timestamp,
        queries: [],
        totalSearches: 0,
        successfulSearches: 0,
        abandonedSearches: 0,
        averageResultCount: 0,
        totalDwellTime: 0,
        conversionEvents: []
      };
      this.searchSessions.set(event.sessionId, session);
    }

    session.queries.push(event.query);
    session.totalSearches++;
    session.endTime = event.timestamp;
    session.averageResultCount = 
      (session.averageResultCount * (session.totalSearches - 1) + event.resultCount) / session.totalSearches;

    // Check if this is a refinement
    if (session.queries.length > 1) {
      const previousQuery = session.queries[session.queries.length - 2];
      if (this.isQueryRefinement(previousQuery, event.query)) {
        event.context.refinement = true;
        event.context.previousQuery = previousQuery;
      }
    }
  }

  private updateUserBehavior(event: SearchEvent): void {
    let behavior = this.userBehaviors.get(event.userId);
    
    if (!behavior) {
      behavior = {
        userId: event.userId,
        totalSearches: 0,
        uniqueQueries: 0,
        averageQueryLength: 0,
        preferredFilters: {},
        searchPatterns: {
          timeOfDay: {},
          dayOfWeek: {},
          queryTypes: {}
        },
        clickBehavior: {
          averagePosition: 0,
          clickThroughRate: 0,
          averageDwellTime: 0
        },
        conversionRate: 0,
        lastSearchDate: event.timestamp
      };
      this.userBehaviors.set(event.userId, behavior);
    }

    behavior.totalSearches++;
    behavior.lastSearchDate = event.timestamp;
    
    // Update average query length
    behavior.averageQueryLength = 
      (behavior.averageQueryLength * (behavior.totalSearches - 1) + event.query.length) / behavior.totalSearches;

    // Update search patterns
    const hour = event.timestamp.getHours();
    const timeSlot = `${Math.floor(hour / 4) * 4}-${Math.floor(hour / 4) * 4 + 3}`;
    behavior.searchPatterns.timeOfDay[timeSlot] = (behavior.searchPatterns.timeOfDay[timeSlot] || 0) + 1;

    const dayOfWeek = event.timestamp.toLocaleDateString('en', { weekday: 'long' });
    behavior.searchPatterns.dayOfWeek[dayOfWeek] = (behavior.searchPatterns.dayOfWeek[dayOfWeek] || 0) + 1;

    // Update preferred filters
    for (const [filter, value] of Object.entries(event.filters)) {
      const key = `${filter}:${value}`;
      behavior.preferredFilters[key] = (behavior.preferredFilters[key] || 0) + 1;
    }

    // Track unique queries
    const uniqueQueries = new Set();
    // In real implementation, we'd track this more efficiently
    behavior.uniqueQueries = uniqueQueries.size;
  }

  private updateClickBehavior(clickEvent: ClickEvent): void {
    const behavior = this.userBehaviors.get(clickEvent.userId);
    if (!behavior) return;

    // Update click-through rate and average position
    const userClicks = Array.from(this.clickEvents.values())
      .filter(c => c.userId === clickEvent.userId);
    
    const totalClicks = userClicks.length;
    const totalPosition = userClicks.reduce((sum, c) => sum + c.position, 0);
    
    behavior.clickBehavior.averagePosition = totalPosition / totalClicks;
    behavior.clickBehavior.clickThroughRate = totalClicks / behavior.totalSearches;

    // Mark search as successful
    const searchEvent = this.searchEvents.get(clickEvent.searchEventId);
    if (searchEvent) {
      const session = this.searchSessions.get(searchEvent.sessionId);
      if (session) {
        session.successfulSearches++;
      }
    }
  }

  private updateUserDwellTime(userId: string): void {
    const behavior = this.userBehaviors.get(userId);
    if (!behavior) return;

    const userClicks = Array.from(this.clickEvents.values())
      .filter(c => c.userId === userId && c.dwellTime);
    
    const totalDwellTime = userClicks.reduce((sum, c) => sum + (c.dwellTime || 0), 0);
    behavior.clickBehavior.averageDwellTime = totalDwellTime / userClicks.length;
  }

  private updateUserConversion(userId: string): void {
    const behavior = this.userBehaviors.get(userId);
    if (!behavior) return;

    const userSessions = Array.from(this.searchSessions.values())
      .filter(s => s.userId === userId);
    
    const sessionsWithConversions = userSessions.filter(s => s.conversionEvents.length > 0).length;
    behavior.conversionRate = sessionsWithConversions / userSessions.length;
  }

  private isQueryRefinement(previousQuery: string, currentQuery: string): boolean {
    const prev = this.normalizeQuery(previousQuery);
    const curr = this.normalizeQuery(currentQuery);
    
    // Check if current query contains previous query or vice versa
    return curr.includes(prev) || prev.includes(curr);
  }

  private getEventsInRange(dateRange?: { from: Date; to: Date }): SearchEvent[] {
    const events = Array.from(this.searchEvents.values());
    
    if (!dateRange) return events;
    
    return events.filter(e => 
      e.timestamp >= dateRange.from && e.timestamp <= dateRange.to
    );
  }

  private getClicksInRange(dateRange?: { from: Date; to: Date }): ClickEvent[] {
    const clicks = Array.from(this.clickEvents.values());
    
    if (!dateRange) return clicks;
    
    return clicks.filter(c => 
      c.timestamp >= dateRange.from && c.timestamp <= dateRange.to
    );
  }

  private calculateSearchTrends(events: SearchEvent[]): Array<{ date: string; searches: number; users: number }> {
    const dailyStats = new Map<string, { searches: number; users: Set<string> }>();
    
    for (const event of events) {
      const date = event.timestamp.toISOString().split('T')[0];
      
      if (!dailyStats.has(date)) {
        dailyStats.set(date, { searches: 0, users: new Set() });
      }
      
      const stats = dailyStats.get(date)!;
      stats.searches++;
      stats.users.add(event.userId);
    }
    
    return Array.from(dailyStats.entries())
      .map(([date, stats]) => ({
        date,
        searches: stats.searches,
        users: stats.users.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private cleanupOldEvents(): void {
    if (this.searchEvents.size > this.MAX_EVENTS) {
      const events = Array.from(this.searchEvents.entries())
        .sort(([,a], [,b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const toDelete = events.slice(0, events.length - this.MAX_EVENTS);
      for (const [id] of toDelete) {
        this.searchEvents.delete(id);
      }
    }

    if (this.clickEvents.size > this.MAX_EVENTS) {
      const clicks = Array.from(this.clickEvents.entries())
        .sort(([,a], [,b]) => a.timestamp.getTime() - b.timestamp.getTime());
      
      const toDelete = clicks.slice(0, clicks.length - this.MAX_EVENTS);
      for (const [id] of toDelete) {
        this.clickEvents.delete(id);
      }
    }
  }

  private startAnalyticsProcessing(): void {
    // Process analytics in batches every minute
    setInterval(() => {
      this.processAnalyticsBatch();
    }, 60000);

    // Cleanup old sessions every hour
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000);

    console.log('📊 Started search analytics processing');
  }

  private processAnalyticsBatch(): void {
    // In real implementation, this would:
    // 1. Aggregate recent events
    // 2. Update persistent storage
    // 3. Generate alerts for anomalies
    // 4. Update real-time dashboards
    
    const recentEvents = Array.from(this.searchEvents.values())
      .filter(e => Date.now() - e.timestamp.getTime() < 60000);
    
    if (recentEvents.length > 0) {
      console.log(`📈 Processed ${recentEvents.length} search events in analytics batch`);
    }
  }

  private cleanupOldSessions(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    let cleaned = 0;

    for (const [sessionId, session] of this.searchSessions) {
      if (session.endTime && session.endTime < cutoff) {
        this.searchSessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} old search sessions`);
    }
  }
}

// Export singleton instance
export const searchAnalytics = SearchAnalytics.getInstance();

// Helper functions
export function trackSearch(event: Omit<SearchEvent, 'id' | 'timestamp' | 'normalizedQuery'>): void {
  searchAnalytics.trackSearch(event);
}

export function trackClick(event: Omit<ClickEvent, 'id' | 'timestamp'>): void {
  searchAnalytics.trackClick(event);
}

export function trackDwellTime(clickEventId: string, dwellTime: number): void {
  searchAnalytics.trackDwellTime(clickEventId, dwellTime);
}

export function trackConversion(searchEventId: string, conversionType: string): void {
  searchAnalytics.trackConversion(searchEventId, conversionType);
}

export function getSearchMetrics(dateRange?: { from: Date; to: Date }): SearchMetrics {
  return searchAnalytics.getSearchMetrics(dateRange);
}

export function getSearchInsights(dateRange?: { from: Date; to: Date }): SearchInsight[] {
  return searchAnalytics.generateInsights(dateRange);
}

export function getUserSearchBehavior(userId: string): UserSearchBehavior | null {
  return searchAnalytics.getUserBehavior(userId);
}

export function getRealTimeSearchStats(): ReturnType<typeof searchAnalytics.getRealTimeStats> {
  return searchAnalytics.getRealTimeStats();
}

export function exportSearchAnalytics(format: 'json' | 'csv', dateRange?: { from: Date; to: Date }): string {
  return searchAnalytics.exportAnalytics(format, dateRange);
} 