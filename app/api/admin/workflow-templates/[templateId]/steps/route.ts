import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = params

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

    const steps = await db.workflowTemplateStep.findMany({
      where: { templateId },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { order: 'asc' }
    })

    return NextResponse.json(steps)
  } catch (error) {
    console.error('Workflow template steps yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Adımlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { templateId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = params
    const { order, teamId, approverRole } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Şablon ID gereklidir' },
        { status: 400 }
      )
    }

    if (!order || typeof order !== 'number') {
      return NextResponse.json(
        { error: 'Adım sırası gereklidir' },
        { status: 400 }
      )
    }

    // Team ID veya approverRole'den biri mutlaka dolu olmalı
    if (!teamId && !approverRole) {
      return NextResponse.json(
        { error: 'Takım veya onaylayıcı rolü seçilmelidir' },
        { status: 400 }
      )
    }

    if (teamId && approverRole) {
      return NextResponse.json(
        { error: 'Takım ve rol aynı anda seçilemez' },
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

    // Team ID varsa takımın varlığını kontrol et
    if (teamId) {
      const team = await db.team.findUnique({
        where: { id: teamId }
      })

      if (!team) {
        return NextResponse.json(
          { error: 'Takım bulunamadı' },
          { status: 404 }
        )
      }
    }

    // Aynı sırada adım var mı kontrol et
    const existingStep = await db.workflowTemplateStep.findUnique({
      where: {
        templateId_order: {
          templateId,
          order
        }
      }
    })

    if (existingStep) {
      return NextResponse.json(
        { error: 'Bu sırada zaten bir adım var' },
        { status: 400 }
      )
    }

    const step = await db.workflowTemplateStep.create({
      data: {
        templateId,
        order,
        teamId: teamId || null,
        approverRole: approverRole || null
      },
      include: {
        team: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(step, { status: 201 })
  } catch (error) {
    console.error('Workflow template step oluşturulurken hata:', error)
    return NextResponse.json(
      { error: 'Adım oluşturulurken bir hata oluştu' },
      { status: 500 }
    )
  }
} 