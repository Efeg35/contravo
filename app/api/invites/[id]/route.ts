import { NextRequest, NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inviteId } = await params

    const invite = await prisma.companyInvite.findUnique({
      where: { id: inviteId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        invitedBy: {
          select: {
            name: true,
            email: true
          }
        }
      }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Davet bulunamadı' }, { status: 404 })
    }

    // Check if invite is expired (7 days)
    const expiryDate = new Date(invite.createdAt)
    expiryDate.setDate(expiryDate.getDate() + 7)
    
    if (new Date() > expiryDate && invite.status === 'PENDING') {
      // Mark as expired
      await prisma.companyInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' }
      })
      
      return NextResponse.json({ error: 'Bu davet süresi dolmuş' }, { status: 410 })
    }

    return NextResponse.json(invite)
  } catch (_error) {
    console.error('Error fetching invite:', _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 