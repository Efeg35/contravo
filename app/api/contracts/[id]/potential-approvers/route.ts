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

    // Sözleşmeyi ve oluşturanın bilgilerini kontrol et
    const contract = await prisma.contract.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            departmentRole: true,
            role: true
          }
        },
        company: {
          include: {
            users: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    department: true,
                    departmentRole: true,
                    role: true
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

    // Potansiyel onaylayıcıları belirle - departman izolasyonu ile
    let potentialApprovers: any[] = [];
    
    // Sözleşme sahibinin departmanını al
    const contractCreatorDepartment = contract.createdBy?.department;

    if (contract.company) {
      // Şirket üyelerini al - departman izolasyonu kuralları
      const allCompanyUsers = contract.company.users
        .filter(cu => cu.userId !== session.user.id)
        .map(cu => ({
          id: cu.user.id,
          name: cu.user.name,
          email: cu.user.email,
          department: cu.user.department,
          departmentRole: cu.user.departmentRole,
          role: cu.role,
          systemRole: cu.user.role
        }));

      // Departman izolasyonu kuralları:
      // 1. Aynı departmandaki tüm üyeler (kendi departmanı)
      // 2. Genel Müdürlük - tüm departmanlara erişim
      // 3. Hukuk departmanı - tüm departmanlara erişim (compliance)
      // 4. Diğer departmanlar - sadece kendi departmanı + Genel Müdürlük + Hukuk

      potentialApprovers = allCompanyUsers.filter(user => {
        // Her zaman Genel Müdürlük ve Hukuk departmanlarına onay gönderebilir
        if (user.department === 'Genel Müdürlük' || user.department === 'Hukuk') {
          return true;
        }

        // Eğer sözleşme sahibi Genel Müdürlük veya Hukuk'taysa, herkese gönderebilir
        if (contractCreatorDepartment === 'Genel Müdürlük' || contractCreatorDepartment === 'Hukuk') {
          return true;
        }

        // Diğer durumlarda sadece aynı departman
        return user.department === contractCreatorDepartment;
      });

      // ADMIN ve EDITOR rolündeki kullanıcıları öncelikle göster
      potentialApprovers.sort((a, b) => {
        const roleOrder = { 'ADMIN': 0, 'EDITOR': 1, 'VIEWER': 2 };
        return (roleOrder[a.role as keyof typeof roleOrder] || 3) - (roleOrder[b.role as keyof typeof roleOrder] || 3);
      });
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
          department: true,
          departmentRole: true,
          role: true,
        }
      });

      potentialApprovers = admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        department: admin.department,
        departmentRole: admin.departmentRole,
        role: 'ADMIN',
        systemRole: admin.role
      }));
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