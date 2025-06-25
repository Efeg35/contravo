import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'
import { getCurrentUser, userHasPermission } from '../../../../lib/auth-helpers'
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '../../../../lib/permissions'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL)

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

    // Get contract statistics with department filtering
    const [
      totalContracts,
      activeContracts,
      inReviewContracts,
      draftContracts,
      totalValue
    ] = await Promise.all([
      prisma.contract.count({
        where: baseWhere
      }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          status: 'ACTIVE'
        }
      }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          status: 'REVIEW'
        }
      }),
      prisma.contract.count({
        where: {
          ...baseWhere,
          status: 'DRAFT'
        }
      }),
      prisma.contract.aggregate({
        where: baseWhere,
        _sum: {
          value: true
        }
      })
    ])

    return NextResponse.json({
      totalContracts,
      signedContracts: activeContracts, // Backward compatibility
      activeContracts,
      inReviewContracts,
      draftContracts,
      totalValue: totalValue._sum.value || 0,
      departmentInfo: {
        userDepartment: (user as any).department,
        userDepartmentRole: (user as any).departmentRole,
        canViewAll,
        accessLevel: canViewAll ? 'ALL_DEPARTMENTS' : 'DEPARTMENT_LIMITED'
      }
    })
  } catch (error) {
    console.error('Error fetching contract stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 