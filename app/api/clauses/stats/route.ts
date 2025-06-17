import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth-helpers';
import { db } from '@/lib/db';

// GET /api/clauses/stats - Get clause statistics
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Get user's accessible companies
    const userCompanies = await db.company.findMany({
      where: {
        OR: [
          { createdById: user.id },
          {
            users: {
              some: {
                userId: user.id
              }
            }
          }
        ]
      },
      select: { id: true }
    });

    const accessibleCompanyIds = userCompanies.map(c => c.id);

    // Build base filter for accessible clauses
    const baseFilter = {
      isActive: true,
      approvalStatus: 'APPROVED' as const,
      OR: [
        { visibility: 'PUBLIC' as const },
        { 
          visibility: 'COMPANY' as const,
          OR: [
            { companyId: { in: accessibleCompanyIds } },
            { companyId: null }
          ]
        },
        { 
          visibility: 'PRIVATE' as const,
          createdById: user.id 
        }
      ]
    };

    // Get total clauses count
    const totalClauses = await (db as any).clause.count({
      where: baseFilter
    });

    // Get public clauses count
    const publicClauses = await (db as any).clause.count({
      where: {
        ...baseFilter,
        visibility: 'PUBLIC'
      }
    });

    // Get company clauses count
    const companyClauses = await (db as any).clause.count({
      where: {
        ...baseFilter,
        visibility: 'COMPANY'
      }
    });

    // Get private clauses count
    const privateClauses = await (db as any).clause.count({
      where: {
        ...baseFilter,
        visibility: 'PRIVATE',
        createdById: user.id
      }
    });

    // Get most used category
    const categoryStats = await (db as any).clause.groupBy({
      by: ['category'],
      where: baseFilter,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 1
    });

    const mostUsedCategory = categoryStats.length > 0 ? categoryStats[0].category : 'LEGAL';

    // Get total usage count
    const totalUsage = await (db as any).clauseUsage.count({
      where: {
        clause: {
          ...baseFilter
        }
      }
    });

    // Get category breakdown
    const categoryBreakdown = await (db as any).clause.groupBy({
      by: ['category'],
      where: baseFilter,
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      }
    });

    // Get recent activity (last 10 clause usages)
    const recentActivity = await (db as any).clauseUsage.findMany({
      where: {
        clause: {
          ...baseFilter
        }
      },
      include: {
        clause: {
          select: {
            id: true,
            title: true,
            category: true
          }
        },
        user: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        usedAt: 'desc'
      },
      take: 10
    });

    return NextResponse.json({
      totalClauses,
      publicClauses,
      companyClauses,
      privateClauses,
      mostUsedCategory,
      totalUsage,
      categoryBreakdown,
      recentActivity
    });

  } catch (error) {
    console.error('Clause istatistikleri getirme hatası:', error);
    return NextResponse.json(
      { error: 'İstatistikler getirilemedi' },
      { status: 500 }
    );
  }
} 