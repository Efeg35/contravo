import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { canManageUserRole, getCurrentUser } from '@/lib/auth-helpers';

// Available roles
const ROLES = ['ADMIN', 'EDITOR', 'VIEWER'] as const;
type UserRole = typeof ROLES[number];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user for department filtering
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build where clause with department filtering
    const whereClause: any = ((currentUser as any).department !== 'Genel Müdürlük' && currentUser.role !== 'ADMIN') ? {
      department: {
        in: [(currentUser as any).department, 'Genel Müdürlük', 'Hukuk']
      }
    } : {};

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        departmentRole: true,
        createdAt: true,
      },
      orderBy: [
        { department: 'asc' },
        { departmentRole: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({ 
      users, 
      roles: ROLES,
      departmentInfo: {
        currentUserDepartment: (currentUser as any).department,
        canViewAllDepartments: (currentUser as any).department === 'Genel Müdürlük' || currentUser.role === 'ADMIN',
        totalUsers: users.length
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ error: 'User ID and new role are required' }, { status: 400 });
    }

    if (!ROLES.includes(newRole as UserRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Check if the current user can manage the target user's role
    const canManage = await canManageUserRole(userId as string);
    if (!canManage) {
      return NextResponse.json({ error: 'Cannot manage this user\'s role' }, { status: 403 });
    }

    // Get current user data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId as string },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId as string },
      data: { role: newRole as string },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({ 
      message: 'Role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 