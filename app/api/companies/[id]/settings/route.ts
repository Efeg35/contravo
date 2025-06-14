import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../../lib/prisma'
import { authOptions } from '../../../../../lib/auth'
import { z } from 'zod'

const settingsUpdateSchema = z.object({
  defaultContractType: z.string().nullish(),
  requireApproval: z.boolean(),
  allowSelfApproval: z.boolean(),
  notificationSettings: z.object({
    email: z.boolean(),
    contractExpiryReminder: z.number().min(1).max(365),
    weeklyReport: z.boolean(),
  }).optional(),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: companyId } = await params
    const body = await request.json()
    const validatedData = settingsUpdateSchema.parse(body)

    // Check if user has access to this company
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: session.user.id },
          {
            users: {
              some: {
                userId: session.user.id,
                role: { in: ['ADMIN'] }
              }
            }
          }
        ]
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 })
    }

    // Update or create company settings
    const settings = await prisma.companySettings.upsert({
      where: {
        companyId: companyId,
      },
      update: {
        defaultContractType: validatedData.defaultContractType,
        requireApproval: validatedData.requireApproval,
        allowSelfApproval: validatedData.allowSelfApproval,
        notificationSettings: validatedData.notificationSettings,
      },
      create: {
        companyId: companyId,
        defaultContractType: validatedData.defaultContractType,
        requireApproval: validatedData.requireApproval,
        allowSelfApproval: validatedData.allowSelfApproval,
        notificationSettings: validatedData.notificationSettings,
      },
    })

    return NextResponse.json(settings)
  } catch (_error) {
    if (_error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: _error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating company settings:', _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user has access to this company
    const company = await prisma.company.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          {
            users: {
              some: {
                userId: session.user.id
              }
            }
          }
        ]
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 })
    }

    const settings = await prisma.companySettings.findUnique({
      where: { companyId: id }
    })

    return NextResponse.json(settings || {})
  } catch (_error) {
    console.error('Error fetching company settings:', _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 