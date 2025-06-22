import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

// Ay isimlerini Türkçe'ye çevirmek için
const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Son 6 ayın tarih aralığını hesapla
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 5); // 6 ay geriye git (current + 5 önceki = 6 toplam)
    startDate.setDate(1); // Ayın ilk günü
    startDate.setHours(0, 0, 0, 0);
    
    // Son güne ayarla
    endDate.setHours(23, 59, 59, 999);

    // Build department-based access control
    const getBaseWhereClause = (): Prisma.ContractWhereInput => {
      const baseWhere: Prisma.ContractWhereInput = {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (canViewAll) {
        return baseWhere; // Can see all contracts
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
        ...baseWhere,
        OR: accessConditions
      };
    };

    // Veritabanından veri çek - DEPARTMENT FILTERING APPLIED
    const contracts = await prisma.contract.findMany({
      where: getBaseWhereClause(),
      select: {
        createdAt: true,
        createdBy: {
          select: {
            name: true,
            department: true
          }
        }
      }
    });

    // Ay bazında grupla
    const monthlyData: { [key: string]: number } = {};
    
    // Son 6 ayı döngüyle oluştur
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = 0;
    }

    // Sözleşmeleri aylara göre say
    contracts.forEach(contract => {
      const contractDate = new Date(contract.createdAt);
      const monthKey = `${contractDate.getFullYear()}-${String(contractDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.hasOwnProperty(monthKey)) {
        monthlyData[monthKey]++;
      }
    });

    // Chart için uygun formata çevir
    const data = Object.entries(monthlyData).map(([monthKey, count]) => {
      const [year, month] = monthKey.split('-');
      const monthIndex = parseInt(month) - 1;
      const monthName = monthNames[monthIndex];
      
      return {
        month: monthName,
        count,
        fullDate: `${monthName} ${year}`
      };
    });

    return NextResponse.json({
      data,
      departmentInfo: {
        userDepartment: (user as any).department,
        canViewAll,
        totalFilteredContracts: contracts.length
      }
    });

  } catch (error) {
    console.error('Monthly volume API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 