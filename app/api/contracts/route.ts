import { NextRequest, NextResponse } from 'next/server'
// import { authOptions } from '../../../lib/auth' // TODO: implement auth if needed
import prisma from '../../../lib/prisma'
import { z } from 'zod'
import { getCurrentUser, userHasPermission, checkPermissionOrThrow, AuthorizationError } from '../../../lib/auth-helpers'
import { Permission } from '../../../lib/permissions'
import { Prisma } from '@prisma/client'

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

// GET /api/contracts - List contracts with permission-based filtering
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
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user can view all contracts
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL)

    // Build where clause with proper typing
    const whereClause: Prisma.ContractWhereInput = {}

    if (!canViewAll) {
      // User can only see their own contracts or company contracts they have access to
      whereClause.OR = [
        { createdById: user.id },
        {
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
      ]
    }

    // Apply filters
    if (query.status && query.status !== 'all') {
      whereClause.status = query.status as ContractStatus
    }

    if (query.type && query.type !== 'all') {
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

    // Fetch contracts with permission-based filtering
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
              email: true,
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
      }
    })
  } catch (error) {
    console.error('Error fetching contracts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/contracts - Create new contract with permission check
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createContractSchema.parse(body)

    // Check if user has permission to create contracts
    await checkPermissionOrThrow(Permission.CONTRACT_CREATE, validatedData.companyId)

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
        return NextResponse.json(
          { error: 'Company access denied' },
          { status: 403 }
        )
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
        return NextResponse.json(
          { error: 'Template not found or access denied' },
          { status: 404 }
        )
      }
    }

    // Create the contract
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
            email: true,
          }
        }
      }
    })

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      )
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error creating contract:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 