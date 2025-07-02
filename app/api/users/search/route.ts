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
    const includeGroups = searchParams.get('includeGroups') === 'true';

    const results = [];

    // 1. Kullanıcıları ara
    const userWhereClause: any = {
      department: (currentUser as any).department,
    };

    if (query && query.trim().length > 0) {
      userWhereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ];
    }
    
    // Eğer admin ise tüm departmanlarda arama yapabilsin
    if(currentUser.role === 'ADMIN'){
      delete userWhereClause.department;
    }

    const users = await db.user.findMany({
      where: userWhereClause,
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
        departmentRole: true,
      },
      take: 15,
    });

    // Kullanıcıları results'a ekle
    results.push(...users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      type: 'user'
    })));

    // 2. Eğer isteniyorsa grupları (teams) da ara
    if (includeGroups) {
      const teamWhereClause: any = {};
      
      if (query && query.trim().length > 0) {
        teamWhereClause.name = { contains: query, mode: 'insensitive' };
      }

      const teams = await db.team.findMany({
        where: teamWhereClause,
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              members: true
            }
          }
        },
        take: 10,
      });

      // Grupları results'a ekle
      results.push(...teams.map(team => ({
        id: team.id,
        name: team.name,
        email: `${team._count.members} üye`, // Grup için email yerine üye sayısı
        department: 'Grup',
        type: 'group',
        memberCount: team._count.members
      })));
    }

    return NextResponse.json({ 
      users: results,
      departmentInfo: {
        currentUserDepartment: (currentUser as any).department,
        filteredResults: results.length,
        includesGroups: includeGroups
      }
    });
  } catch (error) {
    console.error('Kullanıcı arama hatası:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 