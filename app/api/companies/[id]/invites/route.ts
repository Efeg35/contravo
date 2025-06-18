import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getCurrentUser } from '@/lib/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: companyId } = await params

    // Simple permission check - user must be admin or company owner
    const hasAccess = user.role === 'ADMIN' || await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: user.id },
          {
            users: {
              some: {
                userId: user.id,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
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
    console.error('Error fetching invites:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { id: companyId } = await params
    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: 'Email and role are required' }, { status: 400 })
    }

    // Simple permission check - user must be admin or company owner
    const hasAccess = user.role === 'ADMIN' || await prisma.company.findFirst({
      where: {
        id: companyId,
        OR: [
          { createdById: user.id },
          {
            users: {
              some: {
                userId: user.id,
                role: 'ADMIN'
              }
            }
          }
        ]
      }
    })

    if (!hasAccess) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if user is already a member
    const existingUser = await prisma.companyUser.findFirst({
      where: {
        user: { email: email as string }
      }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }

    // Check if invite already exists
    const existingInvite = await prisma.companyInvite.findFirst({
      where: {
        email: email as string,
        companyId,
        status: 'PENDING'
      }
    })

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 400 })
    }

    // Create the invite
    const invite = await prisma.companyInvite.create({
      data: {
        email: email as string,
        role: role as string,
        companyId,
        invitedById: user.id
      },
      include: {
        company: true,
        invitedBy: {
          select: { name: true }
        }
      }
    })

    // Log invitation instead of sending email for now
    console.log(`Company invitation would be sent to ${email} for ${invite.company.name}`)

    return NextResponse.json({ message: 'Invitation sent successfully', invite })
  } catch (error) {
    console.error('Error sending invite:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 