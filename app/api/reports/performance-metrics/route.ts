import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

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

    // İmzalanmış sözleşmeleri al (SIGNED status) - WITH DEPARTMENT FILTERING
    const signedContracts = await prisma.contract.findMany({
      where: getBaseWhereClause({ status: 'SIGNED' }),
      select: {
        createdAt: true,
        updatedAt: true,
        status: true,
        createdBy: {
          select: {
            name: true,
            department: true
          }
        }
      }
    });

    // Toplam sözleşme sayıları - WITH DEPARTMENT FILTERING
    const totalContracts = await prisma.contract.count({
      where: getBaseWhereClause()
    });
    const activeContracts = await prisma.contract.count({
      where: getBaseWhereClause({ status: 'ACTIVE' })
    });
    const pendingContracts = await prisma.contract.count({
      where: getBaseWhereClause({ status: { in: ['DRAFT', 'REVIEW'] } })
    });

    // Ortalama tamamlanma süresini hesapla
    let averageCompletionDays = 0;
    if (signedContracts.length > 0) {
      const totalDays = signedContracts.reduce((sum, contract) => {
        const start = new Date(contract.createdAt);
        const end = new Date(contract.updatedAt);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return sum + diffDays;
      }, 0);
      
      averageCompletionDays = Math.round((totalDays / signedContracts.length) * 10) / 10;
    }

    const data = {
      averageCompletionDays,
      totalContracts,
      activeContracts,
      pendingContracts,
      signedContracts: signedContracts.length,
      departmentInfo: {
        userDepartment: (user as any).department,
        userDepartmentRole: (user as any).departmentRole,
        canViewAll,
        accessLevel: canViewAll ? 'ALL_DEPARTMENTS' : 'DEPARTMENT_LIMITED'
      }
    };

    return NextResponse.json({
      data
    });

  } catch (error) {
    console.error('Performance metrics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 