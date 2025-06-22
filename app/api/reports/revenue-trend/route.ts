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

    // Check if user can view all contracts
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Son 6 ayın tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);

    // Build department-based where clause
    const whereClause: Prisma.ContractWhereInput = (() => {
      const baseWhere: Prisma.ContractWhereInput = {
        createdAt: {
          gte: startDate,
          lte: endDate
        },
        // Sadece değeri olan sözleşmeleri al
        value: {
          not: null,
          gt: 0
        }
      };

      if (canViewAll) {
        return baseWhere;
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

      return {
        ...baseWhere,
        OR: accessConditions
      };
    })();

    // Veritabanından sözleşme verilerini çek (DEPARTMENT FILTERED)
    const contracts = await db.contract.findMany({
      where: whereClause,
      select: {
        value: true,
        createdAt: true,
        status: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Ayları grupla ve topla
    const monthlyData = new Map<string, { revenue: number; contracts: number }>();
    
    // Son 6 ayı başlat
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      
      const monthKey = date.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      monthlyData.set(monthKey, { revenue: 0, contracts: 0 });
    }

    // Sözleşmeleri aylara göre grupla
    contracts.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthKey = contractDate.toLocaleDateString('tr-TR', { 
        year: 'numeric', 
        month: 'short' 
      });
      
      if (monthlyData.has(monthKey)) {
        const existing = monthlyData.get(monthKey)!;
        existing.revenue += contract.value || 0;
        existing.contracts += 1;
      }
    });

    // Sonuçları düzenle
    const result = Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      contracts: data.contracts
    }));

    return NextResponse.json({
      data: result,
      totalRevenue: result.reduce((sum, item) => sum + item.revenue, 0),
      totalContracts: result.reduce((sum, item) => sum + item.contracts, 0),
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      departmentInfo: {
        department: (user as any).department,
        canViewAll,
        filteredByDepartment: !canViewAll
      }
    });

  } catch (error) {
    console.error('Revenue trend API hatası:', error);
    
    return NextResponse.json(
      { 
        error: 'Gelir trend verileri alınamadı',
        message: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500 }
    );
  }
} 