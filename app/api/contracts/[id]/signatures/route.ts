import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import prisma from '@/lib/prisma';

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
    const contract = await db.contract.findFirst({
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
    const signaturePackage = await db.signaturePackage.findUnique({
      where: { contractId: id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    const signatures = await db.digitalSignature.findMany({
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

  } catch (error) {
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
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: contractId } = await params;

  try {
    const { signatureData } = await request.json();

    if (!signatureData) {
      return NextResponse.json({ error: 'Signature data is required' }, { status: 400 });
    }

    // Verify contract exists and user has access
    const contract = await prisma.contract.findFirst({
      where: {
        id: contractId,
        OR: [
          { createdById: session.user.id },
          { 
            company: {
              users: {
                some: {
                  userId: session.user.id
                }
              }
            }
          }
        ]
      },
      include: {
        digitalSignatures: true
      }
    });

    if (!contract) {
      return NextResponse.json({ error: 'Contract not found or access denied' }, { status: 404 });
    }

    // Check if user has already signed
    const existingSignature = contract.digitalSignatures.find(
      (sig: any) => sig.userId === session.user.id
    );

    if (existingSignature) {
      return NextResponse.json({ error: 'You have already signed this contract' }, { status: 400 });
    }

    // Create digital signature with required expiresAt field
    const signature = await prisma.digitalSignature.create({
      data: {
        contractId,
        userId: session.user.id,
        signatureData,
        signedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        ipAddress: 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown'
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: 'Contract signed successfully',
      signature 
    });

  } catch (error) {
    console.error('Error creating signature:', error);
    return NextResponse.json(
      { error: 'Failed to create signature' },
      { status: 500 }
    );
  }
} 