import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../lib/prisma'
import { authOptions } from '../../../../lib/auth'
import { z } from 'zod'

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
                email: true,
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
  } catch {
    console.error("[COMPANY_GET]", _error)
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
  } catch {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: _error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating company:', _error)
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
    
    // Check if company has contracts
    const contractCount = await prisma.contract.count({
      where: { companyId: id }
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
  } catch {
    console.error('Error deleting company:', _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 