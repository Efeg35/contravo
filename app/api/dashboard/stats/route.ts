import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { Prisma } from '@prisma/client';

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
    const getBaseWhereClause = (): Prisma.ContractWhereInput => {
      if (canViewAll) {
        return {}; // Can see all contracts
      }

      // Build department-based access control (same as contracts API)
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

      return { OR: accessConditions };
    };

    const baseWhere = getBaseWhereClause();

    // Get total contracts with department filtering
    const totalContracts = await prisma.contract.count({
      where: baseWhere
    });

    // Get contracts by status with department filtering
    const contractsByStatus = await prisma.contract.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: {
        id: true
      }
    });

    // Convert to the expected format
    const statusCounts = contractsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    // Get this month's contracts with department filtering
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyContracts = await prisma.contract.count({
      where: {
        ...baseWhere,
        createdAt: {
          gte: startOfMonth
        }
      }
    });

    // Get recent contracts with department filtering
    const recentContracts = await prisma.contract.findMany({
      where: baseWhere,
      orderBy: {
        createdAt: 'desc'
      },
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        otherPartyName: true,
        createdBy: {
          select: {
            name: true,
            department: true
          }
        }
      }
    });

    const stats = {
      totalContracts,
      draftContracts: statusCounts['DRAFT'] || 0,
      reviewContracts: statusCounts['IN_REVIEW'] || 0,
      signedContracts: statusCounts['SIGNED'] || 0,
      monthlyContracts,
      recentContracts: recentContracts.map(contract => ({
        ...contract,
        createdAt: contract.createdAt.toISOString()
      })),
      departmentInfo: {
        userDepartment: (user as any).department,
        userDepartmentRole: (user as any).departmentRole,
        canViewAll,
        accessLevel: canViewAll ? 'ALL_DEPARTMENTS' : 'DEPARTMENT_LIMITED'
      }
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 