import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { SessionManager } from '../../../../lib/session-manager';

// interface SessionAnalyticsQuery {
//   days?: string;
// }

interface SessionAnalyticsResponse {
  analytics: {
    totalSessions: number;
    activeSessions: number;
    uniqueDevices: number;
    uniqueLocations: number;
    activityByDay: Array<{ date: string; sessions: number; activities: number }>;
    deviceBreakdown: Array<{ device: string; count: number }>;
    browserBreakdown: Array<{ browser: string; count: number }>;
  };
  activeSessions: {
    count: number;
    sessions: Array<{
      id: string;
      deviceInfo: {
        device: string;
        browser: string;
        os: string;
        location?: string;
      };
      lastActivity: Date;
      createdAt: Date;
      expiresAt: Date;
    }>;
  };
  summary: {
    totalSessionsCreated: number;
    currentActiveSessions: number;
    uniqueDevicesUsed: number;
    uniqueLocationsUsed: number;
    averageSessionsPerDay: number;
  };
  period: string;
  userId: string;
}

// GET /api/user/session-analytics - Get detailed session analytics
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Optional query params for future use
    // const { searchParams } = new URL(request.url);

    const analytics = await SessionManager.getSessionAnalytics();
    const activeSessions = await SessionManager.getActiveSessions();

    const response: SessionAnalyticsResponse = {
      analytics,
      activeSessions: {
        count: activeSessions.length,
        sessions: activeSessions.map(session => ({
          id: session.id,
          deviceInfo: {
            device: session.deviceInfo.device,
            browser: session.deviceInfo.browser,
            os: session.deviceInfo.os,
            location: session.deviceInfo.location,
          },
          lastActivity: session.lastActivity,
          createdAt: session.createdAt,
          expiresAt: session.expiresAt,
        })),
      },
      summary: {
        totalSessionsCreated: analytics.totalSessions,
        currentActiveSessions: analytics.activeSessions,
        uniqueDevicesUsed: analytics.uniqueDevices,
        uniqueLocationsUsed: analytics.uniqueLocations,
        averageSessionsPerDay: Math.round(analytics.totalSessions / 30 * 10) / 10,
      },
      period: '30 days',
      userId: session.user.id,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting session analytics:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 