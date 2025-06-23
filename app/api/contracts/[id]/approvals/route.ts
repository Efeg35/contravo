import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendNotificationEmail } from '@/lib/mail';

const createApprovalSchema = z.object({
  approverIds: z.array(z.string()).optional(),
  workflowTemplateId: z.string().optional(),
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
          { company: { users: { some: { userId: session.user.id } } } }
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
    
    console.log('Request body:', body);
    
    const validatedData = createApprovalSchema.parse(body);
    
    // Eğer workflowTemplateId varsa, şablonu kullan
    if (validatedData.workflowTemplateId) {
      const workflowTemplate = await prisma.workflowTemplate.findUnique({
        where: { id: validatedData.workflowTemplateId },
        include: {
          steps: {
            include: {
              team: {
                include: {
                  members: {
                    include: {
                      user: {
                        select: { id: true, name: true, email: true }
                      }
                    }
                  }
                }
              }
            },
            orderBy: { order: 'asc' }
          }
        }
      });

      if (!workflowTemplate) {
        return NextResponse.json({ error: 'Seçilen onay akışı şablonu bulunamadı' }, { status: 404 });
      }

      // Sözleşmeyi tekrar al
      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          createdBy: true,
        },
      });

      if (!contract) {
        return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
      }

      // Sözleşme durumunu 'IN_REVIEW' yap ve ilk onaylayıcıya assign et
      const firstStepApprovers: string[] = [];
      if (workflowTemplate.steps.length > 0) {
        const firstStep = workflowTemplate.steps[0];
        if (firstStep.teamId && firstStep.team) {
          firstStepApprovers.push(...firstStep.team.members.map(member => member.user.id));
        } else if (firstStep.approverRole) {
          const roleUsers = await prisma.user.findMany({
            where: { role: firstStep.approverRole },
            select: { id: true }
          });
          firstStepApprovers.push(...roleUsers.map(user => user.id));
        }
      }

      await prisma.contract.update({
        where: { id },
        data: { 
          status: 'IN_REVIEW',
          assignedToId: firstStepApprovers[0] || null
        }
      });

      // Şablon adımları üzerinde döngü başlat
      const createdApprovals = [];
      let firstApproverName = '';

      for (const step of workflowTemplate.steps) {
        let stepApprovers: string[] = [];

        if (step.teamId && step.team) {
          // Takım üyelerini onaylayıcı olarak ekle
          stepApprovers = step.team.members.map(member => member.user.id);
          if (!firstApproverName && step.team.name) {
            firstApproverName = step.team.name;
          }
        } else if (step.approverRole) {
          // Role göre kullanıcıları bul
          const roleUsers = await prisma.user.findMany({
            where: { role: step.approverRole },
            select: { id: true, name: true, email: true }
          });
          stepApprovers = roleUsers.map(user => user.id);
          if (!firstApproverName && roleUsers.length > 0) {
            firstApproverName = `${step.approverRole} Rolü`;
          }
        }

        // Bu adım için onayları oluştur
        for (const approverId of stepApprovers) {
          const approval = await prisma.contractApproval.create({
            data: {
              contractId: id,
              approverId,
            },
            include: {
              approver: true,
            },
          });

          createdApprovals.push(approval);

          // Onaylayıcıya e-posta gönder
          try {
            await sendNotificationEmail({
              to: approval.approver.email,
              baslik: 'Yeni Bir Onay İsteğiniz Var',
              mesaj: `${contract.title} sözleşmesi için onayınız isteniyor. Lütfen sözleşmeyi inceleyip onaylayın veya reddedin.`,
              link: `${process.env.NEXTAUTH_URL}/dashboard/contracts/${id}`,
              linkText: 'Sözleşmeyi İncele',
            });
          } catch (emailError) {
            console.error('Email sending failed:', emailError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Onay akışı başarıyla başlatıldı',
        approvals: createdApprovals,
        firstApproverName,
        workflowTemplate: workflowTemplate.name
      });
    }
    
    // Eğer approverIds yoksa, varsayılan onaylayıcıları belirle
    let approverIds = validatedData.approverIds;
    
    if (!approverIds || !Array.isArray(approverIds) || approverIds.length === 0) {
      // Varsayılan olarak şirket yöneticilerini veya sözleşme sahibini onaylayıcı yap
      const contract = await prisma.contract.findUnique({
        where: { id },
        include: {
          createdBy: true,
          company: {
            include: {
              users: {
                where: {
                  role: { in: ['ADMIN', 'MANAGER'] }
                },
                include: {
                  user: {
                    select: { id: true, name: true, email: true }
                  }
                }
              }
            }
          }
        },
      });
      
      if (!contract) {
        return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
      }
      
      // Şirket yöneticileri varsa onları, yoksa sözleşme sahibini onaylayıcı yap
      if (contract.company && contract.company.users.length > 0) {
        approverIds = contract.company.users.map(cu => cu.user.id);
      } else {
        approverIds = [contract.createdById];
      }
    }

    // Sözleşmeyi tekrar al (eğer yukarıda alınmadıysa)
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        createdBy: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
    }

    // Sözleşme durumunu 'IN_REVIEW' yap
    await prisma.contract.update({
      where: { id },
      data: { status: 'IN_REVIEW' }
    });

    console.log('Final approverIds before map:', approverIds);
    
    // ApproverIds'in array olduğundan emin ol
    if (!Array.isArray(approverIds) || approverIds.length === 0) {
      return NextResponse.json({ error: 'Onaylayıcı bulunamadı' }, { status: 400 });
    }

    // Onaylayıcıları ekle
    const approvals = await Promise.all(
      approverIds.map(async (approverId: string) => {
        const approval = await prisma.contractApproval.create({
          data: {
            contractId: id,
            approverId,
          },
          include: {
            approver: true,
          },
        });

        // Onaylayıcıya e-posta gönder
        try {
          await sendNotificationEmail({
            to: approval.approver.email,
            baslik: 'Yeni Bir Onay İsteğiniz Var',
            mesaj: `${contract.title} sözleşmesi için onayınız isteniyor. Lütfen sözleşmeyi inceleyip onaylayın veya reddedin.`,
            link: `${process.env.NEXTAUTH_URL}/dashboard/contracts/${id}`,
            linkText: 'Sözleşmeyi İncele',
          });
          console.log(`Approval email sent to ${approval.approver.email}`);
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          // Email hatası olsa da approval oluşturmaya devam et
        }

        return approval;
      })
    );

    // İlk onaylayıcının adını belirle
    const firstApproverName = approvals.length > 0 ? 
      (approvals[0].approver.name || approvals[0].approver.email) : 
      'Onaylayıcılar';

    return NextResponse.json({
      success: true,
      message: 'Onay istekleri başarıyla gönderildi',
      approvals,
      firstApproverName,
    });
  } catch (error) {
    console.error('Onay isteği gönderme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
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
      newContractStatus = 'APPROVED';
    }

    // Sözleşme durumunu güncelle
    if (newContractStatus !== updatedContract.status) {
      await prisma.contract.update({
        where: { id },
        data: { status: newContractStatus },
      });
    }

    // Sözleşme sahibine bilgilendirme e-postası gönder
    if (newContractStatus === 'APPROVED' || newContractStatus === 'REJECTED') {
      try {
        await sendNotificationEmail({
          to: contract.createdBy.email,
          baslik: `Sözleşme ${newContractStatus === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}`,
          mesaj: `${contract.title} sözleşmesi ${newContractStatus === 'APPROVED' ? 'onaylandı' : 'reddedildi'}.`,
          link: `${process.env.NEXTAUTH_URL}/dashboard/contracts/${id}`,
          linkText: 'Sözleşmeyi Görüntüle',
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: validatedData.status === 'APPROVED' ? 'Sözleşme onaylandı' : 'Sözleşme reddedildi',
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