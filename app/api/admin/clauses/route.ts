import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission } from '@/lib/permissions';

// GET - Tüm clause'ları getir (Admin için) - DEPARTMENT FILTERED
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Get current user for department filtering
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check admin permissions
    const canViewAll = await userHasPermission(Permission.SYSTEM_ADMIN);

    // Build department-based where clause
    let whereClause: any = {};

    // Apply department filtering for non-super-admins
    if (!canViewAll && (currentUser as any).department !== 'Genel Müdürlük') {
      // User can only see clauses from their department + public clauses
      whereClause = {
        OR: [
          { visibility: 'PUBLIC' },
          { 
            visibility: 'COMPANY',
            company: {
              users: {
                some: {
                  userId: currentUser.id,
                  user: {
                    department: {
                      in: [(currentUser as any).department, 'Genel Müdürlük', 'Hukuk']
                    }
                  }
                }
              }
            }
          },
          { 
            visibility: 'PRIVATE',
            createdById: currentUser.id 
          }
        ]
      };
    }
    
    const clauses = await db.clause.findMany({
      where: whereClause,
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            department: true,
            departmentRole: true
          }
        },
        company: {
          select: {
            name: true
          }
        },
        variables: true,
        _count: {
          select: {
            usageStats: true,
            contracts: {
              where: {
                isModified: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      clauses,
      departmentInfo: {
        department: (currentUser as any).department,
        canViewAll,
        filteredResults: clauses.length
      }
    });

  } catch (error) {
    console.error('Admin clauses fetch error:', error);
    return NextResponse.json(
      { error: 'Clause\'lar yüklenemedi' },
      { status: 500 }
    );
  }
}

// POST - Yeni clause oluştur (Admin için) - DEPARTMENT AWARE
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Get current user for department info
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, content, category, visibility = 'COMPANY', companyId } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: 'Başlık, içerik ve kategori gerekli' },
        { status: 400 }
      );
    }

    const clause = await db.clause.create({
      data: {
        title,
        description,
        content,
        category,
        visibility,
        companyId,
        createdById: session.user.id
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true,
            department: true,
            departmentRole: true
          }
        },
        company: {
          select: {
            name: true
          }
        },
        variables: true
      }
    });

    return NextResponse.json({
      success: true,
      clause,
      departmentInfo: {
        creatorDepartment: (currentUser as any).department
      }
    });

  } catch (error) {
    console.error('Admin clause creation error:', error);
    return NextResponse.json(
      { error: 'Clause oluşturulamadı' },
      { status: 500 }
    );
  }
} 