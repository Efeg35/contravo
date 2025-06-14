import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../../lib/prisma'
import { authOptions } from '../../../../../lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: inviteId } = await params

    const invite = await prisma.companyInvite.findUnique({
      where: { id: inviteId },
      include: {
        company: true
      }
    })

    if (!invite) {
      return NextResponse.json({ error: 'Davet bulunamadı' }, { status: 404 })
    }

    if (invite.status !== 'PENDING') {
      return NextResponse.json({ error: 'Bu davet artık geçerli değil' }, { status: 400 })
    }

    // Check if invite is expired (7 days)
    const expiryDate = new Date(invite.createdAt)
    expiryDate.setDate(expiryDate.getDate() + 7)
    
    if (new Date() > expiryDate) {
      await prisma.companyInvite.update({
        where: { id: inviteId },
        data: { status: 'EXPIRED' }
      })
      return NextResponse.json({ error: 'Bu davet süresi dolmuş' }, { status: 410 })
    }

    // Check if user email matches invite email
    if (session.user.email !== invite.email) {
      return NextResponse.json({ error: 'Bu davet sizin email adresinize gönderilmemiş' }, { status: 403 })
    }

    // Check if user is already a member
    const existingMember = await prisma.companyUser.findFirst({
      where: {
        companyId: invite.companyId,
        userId: session.user.id
      }
    })

    if (existingMember) {
      // Update invite status anyway
      await prisma.companyInvite.update({
        where: { id: inviteId },
        data: { status: 'ACCEPTED' }
      })
      return NextResponse.json({ error: 'Bu şirketin zaten üyesisiniz', companyId: invite.companyId }, { status: 400 })
    }

    // Create member without storing in unused variable
    await prisma.companyUser.create({
      data: {
        companyId: invite.companyId,
        userId: session.user.id,
        role: invite.role
      }
    })

    // Update invite status in a transaction
    await prisma.companyInvite.update({
      where: { id: inviteId },
      data: { status: 'ACCEPTED' }
    })

    return NextResponse.json({ 
      message: 'Davet başarıyla kabul edildi',
      companyId: invite.companyId
    })
  } catch (_error) {
    console.error('Error accepting invite:', _error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 