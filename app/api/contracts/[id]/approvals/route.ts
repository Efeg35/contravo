import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { sendNotificationEmail } from '@/lib/mail';

const createApprovalSchema = z.object({
  approverIds: z.array(z.string()).min(1, 'En az bir onaylayıcı seçmelisiniz'),
});

// Şu anda kullanılmıyor ama gelecekte kullanılabilir
// const updateApprovalSchema = z.object({
//   status: z.enum(['APPROVED', 'REJECTED']),
//   comment: z.string().optional(),
// });

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
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id } = params;
    const { approverIds } = await request.json();

    // Sözleşmeyi ve onaylayıcıları bul
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        createdBy: true,
      },
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
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
        await sendNotificationEmail({
          to: approval.approver.email,
          baslik: 'Yeni Bir Onay İsteğiniz Var',
          mesaj: `${contract.title} sözleşmesi için onayınız isteniyor. Lütfen sözleşmeyi inceleyip onaylayın veya reddedin.`,
          link: `/contracts/${id}`,
          linkText: 'Sözleşmeyi İncele',
        });

        return approval;
      })
    );

    return NextResponse.json({
      success: true,
      message: 'Onay istekleri başarıyla gönderildi',
      approvals,
    });
  } catch (error) {
    console.error('Onay isteği gönderme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 