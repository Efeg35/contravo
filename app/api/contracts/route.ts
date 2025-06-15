import { NextRequest, NextResponse } from 'next/server'
// import { authOptions } from '../../../lib/auth' // TODO: implement auth if needed
import prisma from '../../../lib/prisma'
import { z } from 'zod'
import { getCurrentUser, userHasPermission, checkPermissionOrThrow, AuthorizationError } from '../../../lib/auth-helpers'
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '../../../lib/permissions'
import { Prisma } from '@prisma/client'
import { handleApiError, createSuccessResponse, commonErrors, withErrorHandler } from '@/lib/api-error-handler'

const createContractSchema = z.object({
  title: z.string().min(1, 'Contract title is required'),
  description: z.string().optional(),
  type: z.string().min(1, 'Contract type is required'),
  value: z.union([z.number().positive(), z.string().transform(val => val === '' ? undefined : parseFloat(val))]).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  otherPartyName: z.string().optional(),
  otherPartyEmail: z.string().email().optional().or(z.literal('')),
  companyId: z.string().optional(),
  templateId: z.string().optional(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SIGNED', 'ARCHIVED']).optional(),
})

type ContractStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'ARCHIVED'

// const contractQuerySchema = z.object({
//   page: z.string().optional(),
//   limit: z.string().optional(),
//   status: z.string().optional(),
//   type: z.string().optional(),
//   companyId: z.string().optional(),
//   search: z.string().optional(),
// }) // TODO: implement query validation if needed

// GET /api/contracts - List contracts with department-based filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = (page - 1) * limit

    const query = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      search: searchParams.get('search') || undefined,
    }

    const user = await getCurrentUser()
    if (!user) {
      throw commonErrors.unauthorized()
    }

    // Check if user can view all contracts (ADMIN or OWNER)
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL)

    // Build where clause with proper typing
    const whereClause: Prisma.ContractWhereInput = {}

    if (!canViewAll) {
      // Build department-based access control
      const accessConditions: Prisma.ContractWhereInput[] = [
        // User is the creator
        { createdById: user.id }
      ]

      // Company access (existing logic)
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
      }

      // If user has department and department role, add department-based filtering
      if ((user as any).department && (user as any).departmentRole) {
        // Get all contract types this department can access
        const accessibleContractTypes: string[] = []
        
        Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING).forEach(([contractType, departments]) => {
          if (departments.includes((user as any).department as Department)) {
            // Check if user has permission to view this contract type
            if (PermissionManager.canAccessContractByType(
              contractType, 
              (user as any).department as Department, 
              (user as any).departmentRole
            )) {
              accessibleContractTypes.push(contractType)
            }
          }
        })

        if (accessibleContractTypes.length > 0) {
          // Add department-filtered company contracts
          accessConditions.push({
            ...companyAccess,
            type: {
              in: accessibleContractTypes
            }
          })
        }
      } else {
        // If no department role, fall back to basic company access
        accessConditions.push(companyAccess)
      }

      whereClause.OR = accessConditions
    }

    // Apply filters
    if (query.status && query.status !== 'all') {
      whereClause.status = query.status as ContractStatus
    }

    if (query.type && query.type !== 'all') {
      // If user has department restrictions, ensure they can access this type
      if (!canViewAll && (user as any).department && (user as any).departmentRole) {
        const canAccessType = PermissionManager.canAccessContractByType(
          query.type,
          (user as any).department as Department,
          (user as any).departmentRole
        )
        
        if (!canAccessType) {
          // Return empty result if user can't access this contract type
          return NextResponse.json({
            contracts: [],
            pagination: {
              page,
              limit,
              totalCount: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
            permissions: {
              canViewAll: false,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canApprove: false,
            },
            departmentRestriction: {
              reason: 'Bu sözleşme tipini görüntüleme yetkiniz bulunmamaktadır',
              userDepartment: (user as any).department,
              requiredDepartments: CONTRACT_TYPE_DEPARTMENT_MAPPING[query.type] || []
            }
          })
        }
      }
      
      whereClause.type = query.type
    }

    if (query.companyId) {
      whereClause.companyId = query.companyId
    }

    if (query.search) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { title: { contains: query.search } },
        { description: { contains: query.search } },
        { otherPartyName: { contains: query.search } },
      ]
    }

    // Fetch contracts with department-based filtering
    const [contracts, totalCount] = await Promise.all([
      prisma.contract.findMany({
        where: whereClause,
        include: {
          company: {
            select: {
              id: true,
              name: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              name: true,
            }
          },
          template: {
            select: {
              id: true,
              title: true,
              category: true,
            }
          },
          _count: {
            select: {
              attachments: true,
              approvals: true,
              versions: true,
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        skip: offset,
        take: limit,
      }),
      prisma.contract.count({ where: whereClause })
    ])

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      contracts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      permissions: {
        canViewAll,
        canCreate: await userHasPermission(Permission.CONTRACT_CREATE, query.companyId),
        canUpdate: await userHasPermission(Permission.CONTRACT_UPDATE, query.companyId),
        canDelete: await userHasPermission(Permission.CONTRACT_DELETE, query.companyId),
        canApprove: await userHasPermission(Permission.CONTRACT_APPROVE, query.companyId),
      },
      departmentInfo: {
        userDepartment: (user as any).department,
        userDepartmentRole: (user as any).departmentRole,
        accessibleContractTypes: (user as any).department && (user as any).departmentRole ? 
          Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING)
            .filter(([contractType, departments]) => 
              departments.includes((user as any).department as Department) &&
              PermissionManager.canAccessContractByType(
                contractType, 
                (user as any).department as Department, 
                (user as any).departmentRole!
              )
            )
            .map(([contractType]) => contractType) : []
      }
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/contracts')
  }
}

// POST /api/contracts - Create new contract with department validation
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      throw commonErrors.unauthorized()
    }

    const body = await request.json()
    const validatedData = createContractSchema.parse(body)

    // Check if user has permission to create contracts
    await checkPermissionOrThrow(Permission.CONTRACT_CREATE, validatedData.companyId)

    // Department-based validation for contract creation
    if ((user as any).department && (user as any).departmentRole) {
      const canCreateType = PermissionManager.canCreateContractByType(
        validatedData.type,
        (user as any).department as Department,
        (user as any).departmentRole
      )

      if (!canCreateType) {
        const allowedDepartments = CONTRACT_TYPE_DEPARTMENT_MAPPING[validatedData.type] || [Department.GENERAL]
        throw commonErrors.forbidden(
          `Bu sözleşme tipini (${validatedData.type}) oluşturma yetkiniz bulunmamaktadır. ` +
          `Gerekli departmanlar: ${allowedDepartments.join(', ')}`
        )
      }
    }

    // If creating for a company, verify company access
    if (validatedData.companyId) {
      const hasCompanyAccess = await prisma.company.findFirst({
        where: {
          id: validatedData.companyId,
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
      })

      if (!hasCompanyAccess) {
        throw commonErrors.forbidden('Şirket')
      }
    }

    // If using a template, verify template access
    if (validatedData.templateId) {
      const template = await prisma.contractTemplate.findFirst({
        where: {
          id: validatedData.templateId,
          OR: [
            { isPublic: true },
            { createdById: user.id },
            ...(validatedData.companyId ? [{
              companyId: validatedData.companyId
            }] : [])
          ]
        }
      })

      if (!template) {
        throw commonErrors.notFound('Şablon')
      }
    }

    // Create the contract with department tracking
    const contract = await prisma.contract.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        value: validatedData.value,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        otherPartyName: validatedData.otherPartyName || undefined,
        otherPartyEmail: validatedData.otherPartyEmail || undefined,
        companyId: validatedData.companyId,
        templateId: validatedData.templateId,
        createdById: user.id,
        status: validatedData.status || 'DRAFT',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          }
        },
        template: {
          select: {
            id: true,
            title: true,
            category: true,
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    })

    return createSuccessResponse(contract, {
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/contracts')
  }
} 