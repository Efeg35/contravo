import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../../lib/prisma'
import { authOptions } from '../../../../../lib/auth'
import { emailService } from '../../../../../lib/email'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  role: z.enum(['ADMIN', 'USER'], { required_error: 'Rol seçimi zorunludur' }),
})

export async function POST(
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
    const { email, role } = inviteSchema.parse(body)

    // Check if user has permission to invite
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: session.user.id },
          {
            users: {
              some: {
                userId: session.user.id,
                role: 'ADMIN'
              }
            }
          }
        ]
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found or access denied' }, { status: 404 })
    }

    // Check if user is already a member
    const existingMember = await prisma.companyUser.findFirst({
      where: {
        companyId,
        user: { email }
      }
    })

    if (existingMember) {
      return NextResponse.json({ error: 'Bu kullanıcı zaten şirket üyesi' }, { status: 400 })
    }

    // Check if there's already a pending invite
    const existingInvite = await prisma.companyInvite.findFirst({
      where: {
        companyId,
        email,
        status: 'PENDING'
      }
    })

    if (existingInvite) {
      return NextResponse.json({ error: 'Bu email adresine zaten davet gönderilmiş' }, { status: 400 })
    }

    // Create invite
    const invite = await prisma.companyInvite.create({
      data: {
        email,
        role,
        companyId,
        invitedById: session.user.id,
        status: 'PENDING'
      }
    })

    // Create invite URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/invites/${invite.id}`

    // Send email
    const emailResult = await emailService.sendCompanyInvitation({
      email,
      companyName: company.name,
      inviterName: session.user.name || session.user.email || 'Bir kullanıcı',
      role,
      inviteUrl,
    })

    if (!emailResult.success) {
      console.error('Failed to send invite email:', emailResult.error)
      // Don't fail the request if email fails, just log it
    }

    return NextResponse.json({ 
      message: 'Davet başarıyla gönderildi',
      invite: {
        id: invite.id,
        email: invite.email,
        role: invite.role,
        status: invite.status,
        createdAt: invite.createdAt
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error creating company invite:', error)
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

    const { id: companyId } = await params

    // Check if user has access to this company
    const company = await prisma.company.findFirst({
      where: {
        id: companyId,
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

    const invites = await prisma.companyInvite.findMany({
      where: { companyId },
      include: {
        invitedBy: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(invites)
  } catch (error) {
    console.error('Error fetching company invites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 