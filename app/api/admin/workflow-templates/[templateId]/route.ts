import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  context: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = context.params

    if (!templateId) {
      return NextResponse.json(
        { error: 'Şablon ID gereklidir' },
        { status: 400 }
      )
    }

    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId },
      include: {
        _count: {
          select: {
            steps: true
          }
        }
      }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Şablon bulunamadı' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Workflow template detayı yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Şablon detayı yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = context.params

    if (!templateId) {
      return NextResponse.json(
        { error: 'Şablon ID gereklidir' },
        { status: 400 }
      )
    }

    // Şablonun varlığını kontrol et
    const template = await db.workflowTemplate.findUnique({
      where: { id: templateId }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Şablon bulunamadı' },
        { status: 404 }
      )
    }

    // Şablonu sil (Cascade delete ile adımlar da silinecek)
    await db.workflowTemplate.delete({
      where: { id: templateId }
    })

    return NextResponse.json(
      { message: 'Şablon başarıyla silindi' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Workflow template silinirken hata:', error)
    return NextResponse.json(
      { error: 'Şablon silinirken bir hata oluştu' },
      { status: 500 }
    )
  }
}