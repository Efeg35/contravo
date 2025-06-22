import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// Durum çevirileri için mapping
const statusTranslations: { [key: string]: string } = {
  'DRAFT': 'Taslak',
  'REVIEW': 'İncelemede',
  'APPROVED': 'Onaylandı',
  'SIGNED': 'İmzalandı',
  'ACTIVE': 'Aktif',
  'EXPIRED': 'Süresi Dolmuş',
  'CANCELLED': 'İptal Edildi',
  'TERMINATED': 'Feshedildi'
};

// Her durum için renk paleti
const statusColors: { [key: string]: string } = {
  'DRAFT': '#94A3B8',      // Gri - Taslak
  'REVIEW': '#F59E0B',     // Turuncu - İncelemede
  'APPROVED': '#10B981',   // Yeşil - Onaylandı
  'SIGNED': '#3B82F6',     // Mavi - İmzalandı
  'ACTIVE': '#059669',     // Koyu yeşil - Aktif
  'EXPIRED': '#DC2626',    // Kırmızı - Süresi dolmuş
  'CANCELLED': '#6B7280',  // Koyu gri - İptal edildi
  'TERMINATED': '#7C2D12'  // Kahverengi - Feshedildi
};

export async function GET(request: NextRequest) {
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

    // Build department-based where clause
    const whereClause: Prisma.ContractWhereInput = (() => {
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

    const statusData = await prisma.contract.groupBy({
      by: ['status'],
      where: whereClause,
      _count: {
        status: true
      }
    });

    // Veriyi chart için uygun formata çevir
    const data = statusData.map(item => ({
      status: item.status,
      count: item._count.status,
      name: statusTranslations[item.status] || item.status,
      color: statusColors[item.status] || '#8B5CF6'
    }));

    // Toplam sözleşme sayısını hesapla
    const total = data.reduce((sum, item) => sum + item.count, 0);

    return NextResponse.json({
      data,
      total,
      departmentInfo: {
        department: (user as any).department,
        canViewAll,
        filteredByDepartment: !canViewAll
      }
    });

  } catch (error) {
    console.error('Status distribution API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 