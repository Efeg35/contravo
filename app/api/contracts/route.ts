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
  // 📅 ANAHTAR TARİH TAKİBİ - Yeni Doğrulama Alanları
  expirationDate: z.string().optional().refine(
    (val) => !val || !isNaN(Date.parse(val)), 
    { message: 'Geçerli bir bitiş tarihi giriniz' }
  ),
  noticePeriodDays: z.union([
    z.number().int().min(0).max(365),
    z.string().transform(val => val === '' ? undefined : parseInt(val, 10))
  ]).optional().refine(
    (val) => val === undefined || (Number.isInteger(val) && val >= 0 && val <= 365),
    { message: 'İhbar süresi 0-365 gün arasında olmalıdır' }
  ),
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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    const query = {
      status: searchParams.get('status') || undefined,
      type: searchParams.get('type') || undefined,
      companyId: searchParams.get('companyId') || undefined,
      search: searchParams.get('search') || undefined,
      view: searchParams.get('view') || 'all',
      sortBy: searchParams.get('sortBy') || 'lastActivity',
      order: searchParams.get('order') || 'desc',
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

    // Handle view filters (Ironclad-style)
    if (query.view && query.view !== 'all') {
      switch (query.view) {
        case 'myworkflows':
          // All workflows (no additional filter needed)
          break
        case 'assignedToMe':
          // User has approval responsibility
          whereClause.approvals = {
            some: {
              approverId: user.id,
              status: 'PENDING'
            }
          }
          break
        case 'participating':
          // User is either creator or has approval responsibility
          whereClause.OR = [
            ...(whereClause.OR || []),
            { createdById: user.id },
            {
              approvals: {
                some: {
                  approverId: user.id
                }
              }
            }
          ]
          break
        case 'completed':
          whereClause.status = 'SIGNED'
          break
        case 'archived':
          whereClause.status = 'ARCHIVED'
          break
        case 'overdue':
          whereClause.OR = [
            {
              endDate: {
                lt: new Date()
              },
              status: { not: 'SIGNED' }
            },
            {
              expirationDate: {
                lt: new Date()
              },
              status: { not: 'SIGNED' }
            }
          ]
          break
        case 'procurement-rfp':
          whereClause.type = 'RFP'
          break
        case 'procurement-spend':
          whereClause.type = { in: ['PURCHASE_AGREEMENT', 'VENDOR_AGREEMENT'] }
          whereClause.value = { gte: 1000000 }
          break
        case 'general-mnda':
          whereClause.type = 'NDA'
          whereClause.status = 'IN_REVIEW'
          break
        case 'sales-high-value':
          whereClause.type = { in: ['SALES_AGREEMENT', 'SERVICE_AGREEMENT'] }
          whereClause.value = { gte: 500000 }
          break
        case 'finance-business':
          whereClause.description = { contains: 'finance' }
          break
        case 'ytd-completed':
          const yearStart = new Date(new Date().getFullYear(), 0, 1)
          whereClause.status = { in: ['SIGNED', 'ARCHIVED'] }
          whereClause.updatedAt = { gte: yearStart }
          break
        default:
          // Active/in progress contracts by default
          whereClause.status = { in: ['DRAFT', 'IN_REVIEW', 'APPROVED'] }
          break
      }
    } else {
      // Default view - active contracts
      whereClause.status = { in: ['DRAFT', 'IN_REVIEW', 'APPROVED'] }
    }

    // Build order by clause
    let orderBy: Prisma.ContractOrderByWithRelationInput = {}
    switch (query.sortBy) {
      case 'title':
        orderBy = { title: query.order as 'asc' | 'desc' }
        break
      case 'currentStage':
        orderBy = { status: query.order as 'asc' | 'desc' }
        break
      case 'assignedTo':
        orderBy = { createdBy: { name: query.order as 'asc' | 'desc' } }
        break
      case 'value':
        orderBy = { value: query.order as 'asc' | 'desc' }
        break
      case 'createdAt':
        orderBy = { createdAt: query.order as 'asc' | 'desc' }
        break
      case 'lastActivity':
      default:
        orderBy = { updatedAt: query.order as 'asc' | 'desc' }
        break
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
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              }
            },
            where: {
              status: 'PENDING'
            },
            take: 1
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

    // Transform contracts to include assignedTo from approvals
    const transformedContracts = contracts.map(contract => ({
      ...contract,
      assignedTo: contract.approvals?.[0]?.approver || null,
      currentStage: contract.status,
      lastActivity: contract.updatedAt.toISOString(),
      // Mock additional fields for Ironclad-style dashboard
      department: contract.type === 'RFP' ? 'Procurement' : 
                 contract.type === 'NDA' ? 'Legal' :
                 contract.type === 'SALES_AGREEMENT' ? 'Sales' : 'General',
      contractType: contract.type,
      riskLevel: contract.value && contract.value > 1000000 ? 'HIGH' : 
                 contract.value && contract.value > 100000 ? 'MEDIUM' : 'LOW',
      turnsCompleted: Math.floor(Math.random() * 3) + 1,
      totalTurns: 5,
      priority: contract.value && contract.value > 500000 ? 'HIGH' : 'MEDIUM'
    }))

    return NextResponse.json({
      contracts: transformedContracts,
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

    // Create the contract with department tracking and key date tracking
    const contract = await prisma.contract.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        type: validatedData.type,
        value: validatedData.value,
        startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
        endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined,
        // 📅 ANAHTAR TARİH TAKİBİ - Kritik Tarih Verilerini Kaydet
        expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : undefined,
        noticePeriodDays: validatedData.noticePeriodDays,
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

    // Eğer approverIds varsa, her biri için ContractApproval kaydı oluştur
    if (Array.isArray(body.approverIds) && body.approverIds.length > 0) {
      await Promise.all(
        body.approverIds.map((approverId: string) =>
          prisma.contractApproval.create({
            data: {
              contractId: contract.id,
              approverId,
            },
          })
        )
      );
    }

    return createSuccessResponse(contract, {
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/contracts')
  }
} 