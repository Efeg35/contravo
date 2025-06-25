import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { ContractStatusEnum } from '@/app/types';

const prisma = new PrismaClient();

// İmza durumunu güncelle (İmzala/Reddet)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; signatureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id, signatureId } = await params;
    const body = await request.json();
    const { action, signatureData, declineReason } = body;

    // İmza kaydını bul
    const signature = await prisma.digitalSignature.findFirst({
      where: {
        id: signatureId,
        contractId: id,
        userId: session.user.id
      },
      include: {
        contract: true,
        user: true
      }
    });

    if (!signature) {
      return NextResponse.json({ error: 'İmza kaydı bulunamadı veya yetki yok' }, { status: 404 });
    }

    // İmza süresi dolmuş mu kontrol et
    if (signature.expiresAt < new Date()) {
      return NextResponse.json({ error: 'İmza süresi dolmuş' }, { status: 400 });
    }

    // İmza durumunu güncelle
    let updateData: Record<string, unknown> = {
      updatedAt: new Date()
    };

    if (action === 'sign') {
      updateData = {
        ...updateData,
        status: 'SIGNED',
        signedAt: new Date(),
        signatureData,
        ipAddress: (request as any).headers.get('x-forwarded-for') || (request as any).headers.get('x-real-ip') || '',
        userAgent: (request as any).headers.get('user-agent') || ''
      };
    } else if (action === 'decline') {
      updateData = {
        ...updateData,
        status: 'DECLINED',
        declineReason
      };
    } else {
      return NextResponse.json({ error: 'Geçersiz aksiyon' }, { status: 400 });
    }

    const updatedSignature = await prisma.digitalSignature.update({
      where: { id: signatureId },
      data: updateData,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Tüm imzalar tamamlandı mı kontrol et
    const allSignatures = await prisma.digitalSignature.findMany({
      where: { contractId: id }
    });

    const allSigned = allSignatures.every(s => 
      s.status === 'SIGNED' || (!s.isRequired && s.status !== 'PENDING')
    );

    // Eğer tüm imzalar tamamlandıysa paketi ve sözleşmeyi güncelle
    if (allSigned) {
      await prisma.signaturePackage.update({
        where: { contractId: id },
        data: { 
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      await prisma.contract.update({
        where: { id },
        data: { status: ContractStatusEnum.SIGNING }
      });
    }

    return NextResponse.json(updatedSignature);

  } catch (error) {
    console.error('İmza güncelleme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// İmzayı iptal et
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; signatureId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id, signatureId } = await params;

    // Sözleşme sahibi veya yönetici mi kontrol et
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          { 
            company: {
              users: {
                some: { 
                  userId: session.user.id,
                  role: { in: ['ADMIN', 'EDITOR'] }
                }
              }
            }
          }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Yetki yok' }, { status: 403 });
    }

    // İmzayı iptal et
    await prisma.digitalSignature.update({
      where: { id: signatureId },
      data: {
        status: 'CANCELLED',
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ message: 'İmza iptal edildi' });

  } catch (error) {
    console.error('İmza iptal hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 