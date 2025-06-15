import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import prisma from '../../../../../../lib/prisma'
import { authOptions } from '../../../../../../lib/auth'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id, attachmentId } = await params
    
    // Sözleşmenin var olduğunu ve kullanıcının sahip olduğunu kontrol et
    const contract = await prisma.contract.findUnique({
      where: { 
        id,
        createdById: user.id
      }
    })

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // Attachment'ı bul
    const attachment = await prisma.contractAttachment.findUnique({
      where: { 
        id: attachmentId,
        contractId: id
      }
    })

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    // Dosyayı disk'ten sil
    try {
      const filePath = join(process.cwd(), 'public', 'uploads', attachment.fileName)
      await unlink(filePath)
    } catch (error) {
      console.error('Error deleting file from disk:', error)
    }

    // Delete from database
    await prisma.contractAttachment.delete({
      where: { id: attachmentId }
    })

    return NextResponse.json({ message: 'Attachment deleted successfully' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 