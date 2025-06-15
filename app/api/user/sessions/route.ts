import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { SessionManager } from '../../../../lib/session-manager';

interface SessionInfo {
  id: string;
  deviceInfo: {
    device: string;
    browser: string;
    os: string;
    location?: string;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
  expiresAt: Date;
}

// GET /api/user/sessions - Get user's active sessions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sessions = await SessionManager.getActiveSessions();

    return NextResponse.json({
      sessions: sessions.map((s: SessionInfo) => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        isActive: s.isActive,
        lastActivity: s.lastActivity,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
      })),
      total: sessions.length,
    });
  } catch (error) {
    console.error('Error getting sessions:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/user/sessions - Logout from all other sessions
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const action = searchParams.get('action'); // 'single' or 'all-others'

    if (action === 'all-others') {
      const count = await SessionManager.invalidateAllOtherSessions();
      return NextResponse.json({
        message: `${count} sessions invalidated`,
        count,
      });
    } else if (sessionId) {
      await SessionManager.invalidateSession();
      return NextResponse.json({
        message: 'Session invalidated',
      });
    } else {
      return NextResponse.json(
        { error: 'Session ID or action required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error invalidating sessions:');
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 