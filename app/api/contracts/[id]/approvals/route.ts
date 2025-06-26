import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendNotificationEmail } from '@/lib/mail';
import { ContractStatusEnum } from '@/app/types';
import { evaluateConditions } from '@/lib/conditions';

const createApprovalSchema = z.object({
  approverIds: z.array(z.string()).optional(),
  workflowTemplateId: z.string().nullable().optional(),
});

const updateApprovalSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  status: z.enum(['APPROVED', 'REJECTED']),
  comment: z.string().optional(),
});



// GET /api/contracts/[id]/approvals - Get contract approvals
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this contract
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          { company: { users: { some: { userId: session.user.id } } } },
          { approvals: { some: { approverId: session.user.id } } }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const approvals = await prisma.contractApproval.findMany({
      where: { contractId: id },
      include: {
        approver: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Error fetching approvals:');
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/contracts/[id]/approvals - Request approvals
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    const validatedData = createApprovalSchema.parse(body);
    const finalApproverIds = new Set<string>();

    // 1. Mevcut "aktif" onayları temizle (onaylanmamış veya reddedilmemiş)
    await prisma.contractApproval.deleteMany({
      where: {
        contractId: id,
        status: { in: ['PENDING', 'REVISION_REQUESTED'] },
      },
    });

    // 2. Şablondan gelen onaycıları ekle
    if (validatedData.workflowTemplateId) {
      // Adım koşullarını da include et
      const workflowTemplate = await prisma.workflowTemplate.findUnique({
        where: { id: validatedData.workflowTemplateId },
        include: {
          steps: {
            include: {
              team: { include: { members: true } },
              conditions: true
            }
          }
        },
      });

      // Sözleşme verisini çek
      const contract = await prisma.contract.findUnique({ where: { id } });

      if (workflowTemplate && contract) {
        for (const step of workflowTemplate.steps) {
          // Eğer adımın koşulu yoksa veya tüm koşulları sağlanıyorsa ekle
          let shouldInclude = true;
          const conditions = (step.conditions || []).map((c: any) => ({
            field: c.field,
            operator: c.operator as import('@/lib/conditions').Operator,
            value: c.value
          }));
          if (conditions.length > 0) {
            shouldInclude = await evaluateConditions(conditions, contract);
          }
          if (shouldInclude && step.teamId && step.team) {
            step.team.members.forEach((member: any) => finalApproverIds.add(member.userId));
          }
        }
      }
    }
    
    // 3. Manuel eklenen onaycıları ekle
    if (validatedData.approverIds) {
      validatedData.approverIds.forEach(approverId => finalApproverIds.add(approverId));
    }

    if (finalApproverIds.size === 0) {
      return NextResponse.json({ error: 'Onaylayıcı bulunamadı.' }, { status: 400 });
    }
    
    // 4. Yeni onay kayıtlarını oluştur
    const approvalPromises = Array.from(finalApproverIds).map(approverId => {
      return prisma.contractApproval.create({
        data: {
          contractId: id,
          approverId: approverId,
          status: 'PENDING',
        },
      });
    });

    const createdApprovals = await prisma.$transaction(approvalPromises);

    // Sözleşme durumunu güncelle
    await prisma.contract.update({
      where: { id },
      data: { 
        status: ContractStatusEnum.REVIEW,
        assignedToId: createdApprovals[0].approverId,
      },
    });
    
    // TODO: Bildirimleri buradan gönder
    
    return NextResponse.json({
      success: true,
      message: 'Onay akışı başarıyla başlatıldı.',
      approvals: createdApprovals,
    });
    
  } catch (error) {
    console.error('Error in POST /api/contracts/[id]/approvals:', error);
    const details = error instanceof Error ? error.message : 'Bilinmeyen bir hata.';
    return NextResponse.json({ error: 'Sunucu hatası', details }, { status: 500 });
  }
}

// PUT /api/contracts/[id]/approvals - Approve or reject contract
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    console.log('PUT Request body:', body);
    
    // Validation
    const validatedData = updateApprovalSchema.parse(body);
    
    // Sözleşmeyi kontrol et
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        createdBy: true,
        approvals: {
          include: {
            approver: true
          }
        }
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
    }

    // Kullanıcının bu sözleşmeyi onaylama yetkisi olup olmadığını kontrol et
    const userApproval = contract.approvals.find(
      approval => approval.approverId === session.user.id && approval.status === 'PENDING'
    );

    if (!userApproval) {
      return NextResponse.json({ 
        error: 'Bu sözleşmeyi onaylama yetkiniz yok veya zaten işlem yapılmış' 
      }, { status: 403 });
    }

    // Onay durumunu güncelle
    await prisma.contractApproval.update({
      where: { id: userApproval.id },
      data: {
        status: validatedData.status,
        comment: validatedData.comment,
        approvedAt: validatedData.status === 'APPROVED' ? new Date() : null,
      },
    });

    // Tüm onayları kontrol et
    const updatedContract = await prisma.contract.findUnique({
      where: { id },
      include: {
        approvals: true,
      },
    });

    if (!updatedContract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
    }

    // Eğer tüm onaylar APPROVED ise sözleşme durumunu güncelle
    const allApproved = updatedContract.approvals.every(
      approval => approval.status === 'APPROVED'
    );
    
    const hasRejected = updatedContract.approvals.some(
      approval => approval.status === 'REJECTED'
    );

    let newContractStatus = updatedContract.status;
    
    if (hasRejected) {
      newContractStatus = 'REJECTED';
    } else if (allApproved) {
      newContractStatus = 'SIGNING';
    }

    // Sözleşme durumunu güncelle
    if (newContractStatus !== updatedContract.status) {
      await prisma.contract.update({
        where: { id },
        data: { status: newContractStatus },
      });
    }

    // Sözleşme sahibine bilgilendirme e-postası gönder
    if (newContractStatus === 'SIGNING' || newContractStatus === 'REJECTED') {
      try {
        await sendNotificationEmail({
          to: contract.createdBy.email,
          baslik: `Sözleşme ${newContractStatus === 'SIGNING' ? 'İmza Sürecine Geçti' : 'Reddedildi'}`,
          mesaj: `${contract.title} sözleşmesi ${newContractStatus === 'SIGNING' ? 'imza sürecine geçti' : 'reddedildi'}.`,
          link: `${process.env.NEXTAUTH_URL}/dashboard/contracts/${id}`,
          linkText: 'Sözleşmeyi Görüntüle',
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'APPROVED' ? 'Sözleşme onaylandı ve imza sürecine geçti' : 'Sözleşme reddedildi',
      contractStatus: newContractStatus,
    });
  } catch (error) {
    console.error('Onay güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 