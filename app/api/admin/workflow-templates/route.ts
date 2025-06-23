import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const templates = await db.workflowTemplate.findMany({
      include: {
        _count: {
          select: {
            steps: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Workflow template listesi yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Şablonlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Şablon adı gereklidir' },
        { status: 400 }
      )
    }

    // Aynı isimde şablon var mı kontrol et
    const existingTemplate = await db.workflowTemplate.findUnique({
      where: { name: name.trim() }
    })

    if (existingTemplate) {
      return NextResponse.json(
        { error: 'Bu isimde bir şablon zaten mevcut' },
        { status: 400 }
      )
    }

    const template = await db.workflowTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null
      },
      include: {
        _count: {
          select: {
            steps: true
          }
        }
      }
    })

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Workflow template oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Şablon oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
} 