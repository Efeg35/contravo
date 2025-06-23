import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth-helpers';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get current user for department filtering
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return new NextResponse('User not found', { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    const whereClause: any = {
      department: (currentUser as any).department,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    // Eğer admin ise tüm departmanlarda arama yapabilsin
    if(currentUser.role === 'ADMIN'){
      delete whereClause.department;
    }

    const users = await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentRole: true,
      },
      take: 10,
    });

    return NextResponse.json({ 
      users,
      departmentInfo: {
        currentUserDepartment: (currentUser as any).department,
        filteredResults: users.length
      }
    });
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 