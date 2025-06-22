import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../lib/prisma'
import { authOptions } from '../../../../lib/auth'
import { z } from 'zod'
import { getCurrentUser, userHasPermission } from '../../../../lib/auth-helpers'
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '../../../../lib/permissions'
import { Prisma } from '@prisma/client'

const companyUpdateSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  settings: z.string().optional(),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: {
        id,
      },
      include: {
        users: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        },
      },
    })
    
    if (!company) {
      return new NextResponse("Company not found", { status: 404 })
    }

    // Transform the response to match frontend expectations
    const transformedCompany = {
      ...company,
      members: company.users.map(member => ({
        id: member.id,
        role: member.role,
        status: "ACTIVE", // Default to ACTIVE since there's no status field in CompanyUser model
        createdAt: member.createdAt,
        user: member.user
      }))
    }
    
    // Remove the original users field
    delete (transformedCompany as { users?: any }).users

    return NextResponse.json(transformedCompany)
  } catch (error) {
    console.error("[COMPANY_GET]", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = companyUpdateSchema.parse(body)

    // Remove undefined values
    const updateData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined)
    )

    const company = await prisma.company.update({
      where: {
        id,
        createdById: session.user.id,
      },
      data: {
        ...updateData,
        updatedAt: new Date(),
        settings: validatedData.settings ? 
          (typeof validatedData.settings === 'string' ? 
            JSON.parse(validatedData.settings) : 
            validatedData.settings as Record<string, unknown>) : 
          undefined
      },
      include: {
        createdBy: {
          select: {
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            contracts: true,
            users: true,
          }
        }
      }
    })

    return NextResponse.json(company)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Get current user for department filtering
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build department-based where clause for contract count
    let contractWhereClause: Prisma.ContractWhereInput = { companyId: id };

    if (!canViewAll) {
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

      contractWhereClause = {
        companyId: id,
        OR: accessConditions
      };
    }
    
    // Check if company has contracts - WITH DEPARTMENT FILTERING
    const contractCount = await prisma.contract.count({
      where: contractWhereClause
    })

    if (contractCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete company with existing contracts' },
        { status: 400 }
      )
    }

    await prisma.company.delete({
      where: {
        id,
        createdById: session.user.id,
      }
    })

    return NextResponse.json({ message: 'Company deleted successfully' })
  } catch (error) {
    console.error('Error deleting company:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 