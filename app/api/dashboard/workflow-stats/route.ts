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

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get real contract counts from database with proper permissions
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = user.id;

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build base where clause with permission filtering
    const getBaseWhereClause = (): Prisma.ContractWhereInput => {
      if (canViewAll) {
        return {}; // Can see all contracts
      }

      // Build department-based access control (same as contracts API)
      const accessConditions: Prisma.ContractWhereInput[] = [
        // User is the creator
        { createdById: userId }
      ];

      // Company access
      const companyAccess: Prisma.ContractWhereInput = {
        company: {
          OR: [
            { createdById: userId },
            {
              users: {
                some: {
                  userId: userId
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

    // Basic counts with permission filtering
    const baseWhere = getBaseWhereClause();
    
    const totalCount = await prisma.contract.count({ where: baseWhere });
    const inProgressCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        status: { in: ['DRAFT', 'REVIEW', 'SIGNING'] } 
      }
    });
    const assignedToMeCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        createdById: userId 
      }
    });
    const participatingCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        OR: [
          { createdById: userId },
          { updatedById: userId }
        ]
      }
    });
    const completedCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        status: 'ACTIVE'
      }
    });
    const archivedCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        status: 'ARCHIVED'
      }
    });
    const overdueCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        OR: [
          {
            endDate: { lt: new Date() },
            status: { not: 'ACTIVE' }
          },
          {
            expirationDate: { lt: new Date() },
            status: { not: 'ACTIVE' }
          }
        ]
      }
    });
    const expiringSoonCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        endDate: { 
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        },
        status: { notIn: ['ACTIVE', 'ARCHIVED'] }
      }
    });

    // Specific category counts matching contracts API logic with permissions
    const procurementRfpCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        type: 'RFP'
      }
    });
    const procurementSpendCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        type: { in: ['PURCHASE_AGREEMENT', 'VENDOR_AGREEMENT'] },
        value: { gte: 1000000 }
      }
    });
    const generalMndaCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        type: 'NDA',
        status: 'REVIEW'
      }
    });
    const salesHighValueCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        type: { in: ['SALES_AGREEMENT', 'SERVICE_AGREEMENT'] },
        value: { gte: 500000 }
      }
    });
    const financeBusinessCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        description: { contains: 'finance' }
      }
    });
    const ytdCompletedCount = await prisma.contract.count({
      where: { 
        ...baseWhere,
        status: 'ACTIVE',
        updatedAt: { gte: new Date(new Date().getFullYear(), 0, 1) }
      }
    });

    const stats = {
      total: totalCount,
      inProgress: inProgressCount,
      assignedToMe: assignedToMeCount,
      participating: participatingCount,
      completed: completedCount,
      archived: archivedCount,
      overdue: overdueCount,
      expiringSoon: expiringSoonCount,
      procurementRfp: procurementRfpCount,
      procurementSpend: procurementSpendCount,
      generalMnda: generalMndaCount,
      salesHighValue: salesHighValueCount,
      financeBusiness: financeBusinessCount,
      ytdCompleted: ytdCompletedCount
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching workflow stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 