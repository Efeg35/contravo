import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { handleApiError, createSuccessResponse } from '@/lib/api-error-handler';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';
import { ContractStatusEnum } from '@/app/types';

// 🚀 PROAKTIF DASHBOARD API - "Kör Depolama" Probleminin Çözümü
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build department-based access control
    const getBaseWhereClause = (additionalWhere: Prisma.ContractWhereInput = {}): Prisma.ContractWhereInput => {
      if (canViewAll) {
        return additionalWhere; // Can see all contracts
      }

      // Build department-based access control
      const accessConditions: Prisma.ContractWhereInput[] = [
        // User is the creator
        { createdById: user.id }
      ];

      // Company access
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

      // If user has department and department role, add department-based filtering
      if ((user as any).department && (user as any).departmentRole) {
        // Get all contract types this department can access
        const accessibleContractTypes: string[] = [];
        
        Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING).forEach(([contractType, departments]) => {
          if (departments.includes((user as any).department as Department)) {
            // Check if user has permission to view this contract type
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
          // Add department-filtered company contracts
          accessConditions.push({
            ...companyAccess,
            type: {
              in: accessibleContractTypes
            }
          });
        }
      } else {
        // If no department role, fall back to basic company access
        accessConditions.push(companyAccess);
      }

      return {
        ...additionalWhere,
        OR: accessConditions
      };
    };

    const today = new Date();
    
    // 🔔 YAKLAŞAN TARİHLER - Çoklu Seviyeli Hatırlatma
    const [
      critical7Days,    // 🚨 Kritik: 7 gün içinde
      urgent30Days,     // ⚠️ Acil: 30 gün içinde  
      upcoming60Days,   // 📅 Yaklaşan: 60 gün içinde
      planning90Days,   // 📋 Planlama: 90 gün içinde
      overdueContracts, // 🔴 Süresi Dolmuş
      renewalsDue       // 🔄 Yenilemesi Gelen
    ] = await Promise.all([
      // Kritik: 7 gün içinde bitenler - WITH DEPARTMENT FILTERING
      prisma.contract.findMany({
        where: getBaseWhereClause({
          status: { in: [ContractStatusEnum.SIGNING] },
          endDate: {
            gte: today,
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        }),
        select: {
          id: true,
          title: true,
          endDate: true,
          type: true,
          otherPartyName: true,
          value: true,
          createdBy: {
            select: {
              name: true,
              department: true
            }
          }
        },
        orderBy: { endDate: 'asc' },
        take: 10
      }),

      // Acil: 30 gün içinde bitenler - WITH DEPARTMENT FILTERING
      prisma.contract.findMany({
        where: getBaseWhereClause({
          status: { in: [ContractStatusEnum.SIGNING] },
          endDate: {
            gt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          }
        }),
        select: {
          id: true,
          title: true,
          endDate: true,
          type: true,
          otherPartyName: true,
          createdBy: {
            select: {
              name: true,
              department: true
            }
          }
        },
        orderBy: { endDate: 'asc' },
        take: 5
      }),

      // Yaklaşan: 60 gün içinde bitenler - WITH DEPARTMENT FILTERING
      prisma.contract.count({
        where: getBaseWhereClause({
          status: { in: [ContractStatusEnum.SIGNING] },
          endDate: {
            gt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
          }
        })
      }),

      // Planlama: 90 gün içinde bitenler - WITH DEPARTMENT FILTERING
      prisma.contract.count({
        where: getBaseWhereClause({
          status: { in: [ContractStatusEnum.SIGNING] },
          endDate: {
            gt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          }
        })
      }),

      // Süresi dolmuş ama henüz arşivlenmemiş - WITH DEPARTMENT FILTERING
      prisma.contract.findMany({
        where: getBaseWhereClause({
          status: { in: [ContractStatusEnum.SIGNING] },
          endDate: {
            lt: today
          }
        }),
        select: {
          id: true,
          title: true,
          endDate: true,
          type: true,
          otherPartyName: true,
          createdBy: {
            select: {
              name: true,
              department: true
            }
          }
        },
        orderBy: { endDate: 'desc' },
        take: 5
      }),

      // TODO: Yenileme tarihi yaklaşanlar (yeni alanlar aktif olduktan sonra)
      Promise.resolve([])
    ]);

    // 📊 İSTATİSTİKLER VE TRENDLERİ - WITH DEPARTMENT FILTERING
    const totalActive = await prisma.contract.count({
      where: getBaseWhereClause({
        status: { in: [ContractStatusEnum.SIGNING] }
      })
    });

    // 💰 TOPLAM DEĞERLENDİRME
    const totalValue = await prisma.contract.aggregate({
      where: {
        OR: [
          { createdById: session.user.id },
          {
            company: {
              OR: [
                { createdById: session.user.id },
                {
                  users: {
                    some: { userId: session.user.id }
                  }
                }
              ]
            }
          }
        ],
        status: { in: [ContractStatusEnum.SIGNING] },
        endDate: {
          gte: today
        }
      },
      _sum: {
        value: true
      }
    });

    return createSuccessResponse({
      // 🚨 ACIL AKSYON GEREKTİREN
      criticalActions: {
        expiring7Days: critical7Days.map(contract => ({
          ...contract,
          daysRemaining: Math.ceil((new Date(contract.endDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          urgencyLevel: 'CRITICAL',
          actionRequired: 'Acil karar gerekli'
        })),
        overdue: overdueContracts.map(contract => ({
          ...contract,
          daysOverdue: Math.ceil((today.getTime() - new Date(contract.endDate!).getTime()) / (1000 * 60 * 60 * 24)),
          urgencyLevel: 'EXPIRED',
          actionRequired: 'Derhal arşivle veya yenile'
        }))
      },

      // ⚠️ DİKKAT GEREKTİREN
      upcomingActions: {
        expiring30Days: urgent30Days.map(contract => ({
          ...contract,
          daysRemaining: Math.ceil((new Date(contract.endDate!).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          urgencyLevel: 'HIGH',
          actionRequired: 'Yenileme müzakereleri başlat'
        })),
        renewalsDue: renewalsDue // Gelecekte implement edilecek
      },

      // 📊 PLANLAMA VE İSTATİSTİKLER
      planningData: {
        expiring60Days: upcoming60Days,
        expiring90Days: planning90Days,
        totalActiveContracts: totalActive,
        totalActiveValue: totalValue._sum.value || 0,
        riskScore: calculateRiskScore(critical7Days.length, overdueContracts.length, totalActive)
      },

      // 🎯 AKSİYON ÖZETİ
      actionSummary: {
        immediateAction: critical7Days.length + overdueContracts.length,
        planningRequired: urgent30Days.length,
        monitoring: upcoming60Days + planning90Days,
        healthScore: calculateHealthScore(critical7Days.length, overdueContracts.length, urgent30Days.length, totalActive)
      }
    }, {
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return handleApiError(error, 'GET /api/dashboard/expiring-contracts');
  }
}

// 🚨 RİSK SKORLAMA ALGORİTMASI
function calculateRiskScore(critical: number, overdue: number, total: number): string {
  if (total === 0) return 'NO_DATA';
  
  const riskRatio = ((critical * 3) + (overdue * 5)) / total;
  
  if (riskRatio > 1) return 'VERY_HIGH';
  if (riskRatio > 0.5) return 'HIGH';
  if (riskRatio > 0.2) return 'MEDIUM';
  if (riskRatio > 0.1) return 'LOW';
  return 'VERY_LOW';
}

// 💚 SAĞLIK SKORLAMA ALGORİTMASI
function calculateHealthScore(critical: number, overdue: number, urgent: number, total: number): number {
  if (total === 0) return 100;
  
  const penalties = (critical * 15) + (overdue * 25) + (urgent * 5);
  const healthScore = Math.max(0, 100 - (penalties / total) * 100);
  
  return Math.round(healthScore);
} 