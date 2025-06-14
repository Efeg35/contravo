import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sözleşme imzalarını getir
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const { id } = await params;

    // Sözleşme erişim kontrolü
    const contract = await prisma.contract.findFirst({
      where: {
        id,
        OR: [
          { createdById: session.user.id },
          { 
            company: {
              users: {
                some: { userId: session.user.id }
              }
            }
          }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı' }, { status: 404 });
    }

    // İmza paketi ve imzaları getir
    const signaturePackage = await prisma.signaturePackage.findUnique({
      where: { contractId: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const signatures = await prisma.digitalSignature.findMany({
      where: { contractId: id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { order: 'asc' }
    });

    return NextResponse.json({
      signaturePackage,
      signatures
    });

  } catch (_error) {
    console.error('İmza getirme hatası:');
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
}

// Yeni imza paketi oluştur
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
    const { 
      title, 
      description, 
      expiresAt, 
      signers = [] 
    } = body;

    // Sözleşme erişim kontrolü
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
                  role: { in: ['ADMIN', 'EDITOR', 'APPROVER'] }
                }
              }
            }
          }
        ]
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Sözleşme bulunamadı veya yetki yok' }, { status: 404 });
    }

    // Mevcut imza paketi var mı kontrol et
    const existingPackage = await prisma.signaturePackage.findUnique({
      where: { contractId: id }
    });

    if (existingPackage) {
      return NextResponse.json({ error: 'Bu sözleşme için zaten bir imza paketi mevcut' }, { status: 400 });
    }

    // Yeni imza paketi oluştur
    const signaturePackage = await prisma.signaturePackage.create({
      data: {
        contractId: id,
        title,
        description,
        expiresAt: new Date(expiresAt),
        createdById: session.user.id
      }
    });

    // İmzacıları ekle
    const digitalSignatures = await Promise.all(
      signers.map((signer: { userId: string; isRequired?: boolean }, index: number) => 
        prisma.digitalSignature.create({
          data: {
            contractId: id,
            userId: signer.userId,
            order: index + 1,
            isRequired: signer.isRequired ?? true,
            expiresAt: new Date(expiresAt)
          }
        })
      )
    );

    // Paket durumunu SENT olarak güncelle
    await prisma.signaturePackage.update({
      where: { id: signaturePackage.id },
      data: { status: 'SENT' }
    });

    return NextResponse.json({
      signaturePackage,
      signatures: digitalSignatures
    }, { status: 201 });

  } catch (_error) {
    console.error('İmza paketi oluşturma hatası:');
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 