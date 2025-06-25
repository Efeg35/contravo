import { NextRequest, NextResponse } from 'next/server'
// import { authOptions } from '../../../lib/auth' // TODO: implement auth if needed
import prisma from '../../../lib/prisma'
import { z } from 'zod'
import { getCurrentUser } from '../../../lib/auth-helpers'
import { getContractsVisibilityFilter } from '../../../lib/permissions'
import { Prisma } from '@prisma/client'
import { handleApiError, createSuccessResponse, commonErrors } from '@/lib/api-error-handler'
import { ContractStatusEnum } from '@/app/types'

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
  workflowTemplateId: z.string().optional().or(z.null()),
  status: z.enum(['DRAFT', 'REVIEW', 'SIGNING', 'ACTIVE', 'ARCHIVED', 'REJECTED']).optional(),
})

type ContractStatus = 'DRAFT' | 'REVIEW' | 'SIGNING' | 'ACTIVE' | 'ARCHIVED' | 'REJECTED'

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

    // Merkezi yetki filtresi kullan
    const visibilityFilter = await getContractsVisibilityFilter(user.id, user.role);

    // Build where clause with proper typing
    const whereClause: Prisma.ContractWhereInput = {
      AND: [
        visibilityFilter, // Merkezi güvenlik filtresi
        // Diğer filtreler
        ...(query.status && query.status !== 'all' ? [{ status: query.status as ContractStatus }] : []),
        ...(query.type && query.type !== 'all' ? [{ type: query.type }] : []),
        ...(query.companyId ? [{ companyId: query.companyId }] : []),
        ...(query.search ? [{
          OR: [
            { title: { contains: query.search } },
            { description: { contains: query.search } },
            { otherPartyName: { contains: query.search } },
          ]
        }] : [])
      ]
    }

    // Handle view filters (Ironclad-style)
    if (query.view && query.view !== 'all') {
      switch (query.view) {
        case 'myworkflows':
          // All workflows (no additional filter needed)
          break
        case 'assignedToMe':
          // User has a task assigned to them (approval, signature, or revision)
          const assignedConditions = [
            // Direct assignment
            { assignedToId: user.id },
            // Pending approvals
            {
              approvals: {
            some: {
              approverId: user.id,
              status: 'PENDING'
            }
              }
            },
            // Pending signatures
            {
              digitalSignatures: {
                some: {
                  userId: user.id,
                  status: 'PENDING'
                }
              }
            }
          ]
          
          if (whereClause.OR && Array.isArray(whereClause.OR) && whereClause.OR.length > 0) {
            // Apply assigned filter within department restrictions
            whereClause.AND = [
              ...(whereClause.AND ? (Array.isArray(whereClause.AND) ? whereClause.AND : [whereClause.AND]) : []),
              { OR: whereClause.OR }, // Department restrictions
              { OR: assignedConditions } // Assigned conditions
            ]
            delete whereClause.OR
          } else {
            // No department restrictions, apply assigned directly
            whereClause.OR = assignedConditions
          }
          break
        case 'participating':
          // User is either creator or has approval responsibility
          const participatingConditions = [
            { createdById: user.id },
            {
              approvals: {
                some: {
                  approverId: user.id
                }
              }
            }
          ]
          
          if (whereClause.OR && Array.isArray(whereClause.OR) && whereClause.OR.length > 0) {
            // Apply participating filter within department restrictions
            whereClause.AND = [
              ...(whereClause.AND ? (Array.isArray(whereClause.AND) ? whereClause.AND : [whereClause.AND]) : []),
              { OR: whereClause.OR }, // Department restrictions
              { OR: participatingConditions } // Participating conditions
            ]
            delete whereClause.OR
          } else {
            // No department restrictions, apply participating directly
            whereClause.OR = participatingConditions
          }
          break
        case 'completed':
          whereClause.status = { in: [ContractStatusEnum.SIGNING] }
          break
        case 'archived':
          whereClause.status = { in: [ContractStatusEnum.ARCHIVED] }
          break
        case 'overdue':
          const overdueConditions = [
            {
              endDate: {
                lt: new Date()
              },
              status: { not: ContractStatusEnum.SIGNING }
            },
            {
              expirationDate: {
                lt: new Date()
              },
              status: { not: ContractStatusEnum.SIGNING }
            }
          ]
          
          if (whereClause.OR && Array.isArray(whereClause.OR) && whereClause.OR.length > 0) {
            // Apply overdue filter within department restrictions
            whereClause.AND = [
              ...(whereClause.AND ? (Array.isArray(whereClause.AND) ? whereClause.AND : [whereClause.AND]) : []),
              { OR: whereClause.OR }, // Department restrictions
              { OR: overdueConditions } // Overdue conditions
            ]
            delete whereClause.OR
          } else {
            // No department restrictions, apply overdue directly
            whereClause.OR = overdueConditions
          }
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
          whereClause.status = ContractStatusEnum.REVIEW
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
          whereClause.status = { in: [ContractStatusEnum.SIGNING, ContractStatusEnum.ARCHIVED] }
          whereClause.updatedAt = { gte: yearStart }
          break
        default:
          // Active/in progress contracts by default
          whereClause.status = { in: [ContractStatusEnum.DRAFT, ContractStatusEnum.REVIEW, ContractStatusEnum.SIGNING] }
          break
      }
    } else {
      // Default view - active contracts
      whereClause.status = { in: [ContractStatusEnum.DRAFT, ContractStatusEnum.REVIEW, ContractStatusEnum.SIGNING] }
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
        orderBy: orderBy,
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
        canViewAll: true,
        canCreate: true,
        canUpdate: true,
        canDelete: true,
        canApprove: true,
      },
      departmentInfo: {
        userDepartment: user.department,
        userDepartmentRole: user.departmentRole,
        accessibleContractTypes: [] // Temporarily disabled permission check
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

    // Check if user has permission to create contracts (simplified check)
    // await checkPermissionOrThrow(Permission.CONTRACT_CREATE, validatedData.companyId)

    // Department-based validation temporarily disabled
    // if ((user as any).department && (user as any).departmentRole) {
    //   const canCreateType = PermissionManager.canCreateContractByType(
    //     validatedData.type,
    //     (user as any).department as Department,
    //     (user as any).departmentRole
    //   )

    //   if (!canCreateType) {
    //     const allowedDepartments = CONTRACT_TYPE_DEPARTMENT_MAPPING[validatedData.type] || [Department.GENERAL]
    //     throw commonErrors.forbidden(
    //       `Bu sözleşme tipini (${validatedData.type}) oluşturma yetkiniz bulunmamaktadır. ` +
    //       `Gerekli departmanlar: ${allowedDepartments.join(', ')}`
    //     )
    //   }
    // }

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
        // workflowTemplateId: validatedData.workflowTemplateId, // Temporarily disabled
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

    // Eğer workflowTemplateId varsa şablonu kaydet ama onayları burada oluşturma
    // Onaylar SmartActionButton'dan REQUEST_APPROVAL yapıldığında oluşturulacak
    if (validatedData.workflowTemplateId) {
      // Contract'a workflowTemplateId'yi eklemek için ayrı güncelleme yapabilir
      // veya zaten body'de varsa otomatik olarak işlenecek
    }

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