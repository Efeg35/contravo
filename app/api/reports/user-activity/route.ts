import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

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

    // Check if user can view all data
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build department-based where clause for contracts
    const contractWhereClause: Prisma.ContractWhereInput = (() => {
      if (canViewAll) {
        return {};
      }

      const accessConditions: Prisma.ContractWhereInput[] = [
        { createdById: user.id }
      ];

      const companyAccess: Prisma.ContractWhereInput = {
        company: {
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
        }
      };

      if ((user as any).department && (user as any).departmentRole) {
        const accessibleContractTypes: string[] = [];
        
        Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING).forEach(([contractType, departments]) => {
          if (departments.includes((user as any).department as Department)) {
            if (PermissionManager.canAccessContractByType(
              contractType, 
              (user as any).department as Department, 
              (user as any).departmentRole
            )) {
              accessibleContractTypes.push(contractType);
            }
          }
        });

        if (accessibleContractTypes.length > 0) {
          accessConditions.push({
            ...companyAccess,
            type: {
              in: accessibleContractTypes
            }
          });
        }
      } else {
        accessConditions.push(companyAccess);
      }

      return { OR: accessConditions };
    })();

    // Son 30 günün tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Add date range to contract filter
    const contractFilter = {
      ...contractWhereClause,
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    };

    // Günlük aktivite verilerini toplamak için Map kullan
    const dailyActivity = new Map<string, {
      contractsCreated: number;
      approvalsCompleted: number;
      signaturesCompleted: number;
    }>();

    // Son 30 günü başlat
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      dailyActivity.set(dateKey, {
        contractsCreated: 0,
        approvalsCompleted: 0,
        signaturesCompleted: 0
      });
    }

    // Sözleşme oluşturma aktivitelerini çek (DEPARTMENT FILTERED)
    const contracts = await db.contract.findMany({
      where: contractFilter,
      select: {
        createdAt: true
      }
    });

    // Sözleşme oluşturma aktivitelerini say
    contracts.forEach(contract => {
      const dateKey = contract.createdAt.toISOString().split('T')[0];
      const activity = dailyActivity.get(dateKey);
      if (activity) {
        activity.contractsCreated += 1;
      }
    });

    // Onay aktivitelerini çek (DEPARTMENT FILTERED)
    const approvals = await db.contractApproval.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'APPROVED',
        contract: contractWhereClause
      },
      select: {
        createdAt: true
      }
    });

    // Onay aktivitelerini say
    approvals.forEach(approval => {
      const dateKey = approval.createdAt.toISOString().split('T')[0];
      const activity = dailyActivity.get(dateKey);
      if (activity) {
        activity.approvalsCompleted += 1;
      }
    });

    // İmza aktivitelerini çek (DEPARTMENT FILTERED)
    const signatures = await db.digitalSignature.findMany({
      where: {
        signedAt: {
          gte: startDate,
          lte: endDate
        },
        status: 'SIGNED',
        contract: contractWhereClause
      },
      select: {
        signedAt: true
      }
    });

    // İmza aktivitelerini say
    signatures.forEach(signature => {
      if (signature.signedAt) {
        const dateKey = signature.signedAt.toISOString().split('T')[0];
        const activity = dailyActivity.get(dateKey);
        if (activity) {
          activity.signaturesCompleted += 1;
        }
      }
    });

    // Sonuçları formatla
    const result = Array.from(dailyActivity.entries()).map(([date, activity]) => {
      const dateObj = new Date(date);
      return {
        date,
        displayDate: dateObj.toLocaleDateString('tr-TR', { 
          month: 'short', 
          day: 'numeric' 
        }),
        contractsCreated: activity.contractsCreated,
        approvalsCompleted: activity.approvalsCompleted,
        signaturesCompleted: activity.signaturesCompleted,
        totalActivity: activity.contractsCreated + activity.approvalsCompleted + activity.signaturesCompleted
      };
    });

    // İstatistikler hesapla
    const totalActivity = result.reduce((sum, day) => sum + day.totalActivity, 0);
    const avgDailyActivity = result.length > 0 ? Math.round(totalActivity / result.length) : 0;
    const maxDailyActivity = Math.max(...result.map(day => day.totalActivity));

    return NextResponse.json({
      data: result,
      summary: {
        totalActivity,
        avgDailyActivity,
        maxDailyActivity,
        totalContracts: result.reduce((sum, day) => sum + day.contractsCreated, 0),
        totalApprovals: result.reduce((sum, day) => sum + day.approvalsCompleted, 0),
        totalSignatures: result.reduce((sum, day) => sum + day.signaturesCompleted, 0)
      },
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: 30
      },
      departmentInfo: {
        department: (user as any).department,
        canViewAll,
        filteredByDepartment: !canViewAll
      }
    });

  } catch (error) {
    console.error('User activity API hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Kullanıcı aktivite verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 