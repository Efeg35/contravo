import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/contracts/[id]/potential-approvers - Get potential approvers for contract
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

    // Sözleşmeyi kontrol et
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  }
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

    // Kullanıcının bu sözleşmeye erişimi var mı kontrol et
    const hasAccess = contract.createdById === session.user.id || 
      contract.company?.users.some(cu => cu.userId === session.user.id);

    if (!hasAccess) {
      return NextResponse.json({ error: 'Bu sözleşmeye erişim yetkiniz yok' }, { status: 403 });
    }

    // Potansiyel onaylayıcıları belirle
    let potentialApprovers: any[] = [];

    if (contract.company) {
      // Şirket üyelerini al (mevcut kullanıcı hariç)
      potentialApprovers = contract.company.users
        .filter(cu => cu.userId !== session.user.id)
        .map(cu => ({
          id: cu.user.id,
          name: cu.user.name,
          email: cu.user.email,
          role: cu.role
        }));
    } else {
      // Şirket yoksa, sistem yöneticilerini al
      const admins = await prisma.user.findMany({
        where: {
          role: 'ADMIN',
          id: { not: session.user.id }
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        }
      });

      potentialApprovers = admins;
    }

    return NextResponse.json({
      users: potentialApprovers,
      total: potentialApprovers.length
    });
  } catch (error) {
    console.error('Potansiyel onaylayıcıları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 