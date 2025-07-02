import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = await params

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

    // Yeni approver sistemini kullan
    const approvers = await db.workflowApprover.findMany({
      where: { templateId },
      include: {
        conditions: true
      },
      orderBy: { order: 'asc' }
    })

    // Legacy format'a çevir (backward compatibility için)
    const formattedApprovers = approvers.map(approver => ({
      id: approver.id,
      title: approver.title,
      instructions: approver.instructions || '',
      whenToApprove: approver.whenToApprove,
      whenToApproveConditions: approver.conditions.filter(c => c.type === 'WHEN_TO_APPROVE'),
      resetWhen: approver.resetWhen,
      resetWhenConditions: approver.conditions.filter(c => c.type === 'RESET_WHEN'),
      whoCanApprove: approver.approverId ? [{
        id: approver.approverId,
        name: approver.approverName || '',
        email: approver.approverEmail || '',
        type: approver.approverType.toLowerCase()
      }] : [],
      advancedConditions: approver.conditions.filter(c => c.type === 'ADVANCED'),
      assignmentType: approver.assignmentType || '',
      order: approver.order
    }))

    return NextResponse.json(formattedApprovers)
  } catch (error) {
    console.error('Workflow template steps yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Adımlar yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ templateId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }

    const { templateId } = await params
    const { approvers } = await request.json()

    if (!templateId) {
      return NextResponse.json(
        { error: 'Şablon ID gereklidir' },
        { status: 400 }
      )
    }

    if (!Array.isArray(approvers)) {
      return NextResponse.json(
        { error: 'Approvers array gereklidir' },
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

    // Transaction içinde tüm approvers'ı sil ve yeniden oluştur
    const result = await db.$transaction(async (tx) => {
      // Mevcut approvers'ı sil
      await tx.workflowApprover.deleteMany({
        where: { templateId }
      })

      // Yeni approvers'ı oluştur
      const createdApprovers = []
      
      for (let i = 0; i < approvers.length; i++) {
        const approver = approvers[i]
        
        // Grup mantığını handle et
        let approverData: any = {
          templateId,
          order: i + 1,
          title: approver.title || 'Approver',
          instructions: approver.instructions || null,
          whenToApprove: approver.whenToApprove || 'Always',
          resetWhen: approver.resetWhen || 'Always',
          assignmentType: approver.assignmentType || null,
        }

        // whoCanApprove'dan ilk kullanıcıyı al
        if (approver.whoCanApprove && approver.whoCanApprove.length > 0) {
          const firstUser = approver.whoCanApprove[0]
          approverData.approverType = firstUser.type?.toUpperCase() || 'USER'
          approverData.approverId = firstUser.id
          approverData.approverName = firstUser.name
          approverData.approverEmail = firstUser.email
        } else {
          approverData.approverType = 'USER'
        }

        const createdApprover = await tx.workflowApprover.create({
          data: approverData
        })

        // Conditions'ı oluştur
        const conditions = [
          ...(approver.whenToApproveConditions || []).map((c: any) => ({
            approverId: createdApprover.id,
            type: 'WHEN_TO_APPROVE',
            field: c.field,
            operator: c.operator,
            value: c.value,
            logicalOperator: c.logicalOperator || 'AND'
          })),
          ...(approver.resetWhenConditions || []).map((c: any) => ({
            approverId: createdApprover.id,
            type: 'RESET_WHEN',
            field: c.field,
            operator: c.operator,
            value: c.value,
            logicalOperator: c.logicalOperator || 'AND'
          })),
          ...(approver.advancedConditions || []).map((c: any) => ({
            approverId: createdApprover.id,
            type: 'ADVANCED',
            field: c.field,
            operator: c.operator,
            value: c.value,
            logicalOperator: c.logicalOperator || 'AND'
          }))
        ]

        if (conditions.length > 0) {
          await tx.approverCondition.createMany({
            data: conditions
          })
        }

        createdApprovers.push(createdApprover)
      }

      return createdApprovers
    })

    return NextResponse.json({ success: true, approvers: result }, { status: 201 })
  } catch (error) {
    console.error('Approvers kaydetme hatası:', error)
    return NextResponse.json(
      { error: 'Approvers kaydedilirken bir hata oluştu' },
      { status: 500 }
    )
  }
} 