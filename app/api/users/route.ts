import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';

// GET /api/users - Get users list for approvers selection with department filtering
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all users (ADMIN)
    const canViewAll = await userHasPermission(Permission.USER_VIEW) && 
                      (user.role === 'ADMIN' || (user as any).department === 'Genel Müdürlük');

    const whereClause: any = {
      id: {
        not: session.user.id
      },
      // Apply department-based filtering
      ...((!canViewAll && (user as any).department) ? {
        department: {
          in: [(user as any).department, 'Genel Müdürlük', 'Hukuk']
        }
      } : {})
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentRole: true,
        role: true,
      },
      orderBy: [
        { department: 'asc' },
        { name: 'asc' }
      ]
    });

    return NextResponse.json({
      users,
      departmentInfo: {
        userDepartment: (user as any).department,
        canViewAll,
        accessLevel: canViewAll ? 'ALL_DEPARTMENTS' : 'DEPARTMENT_LIMITED'
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 