import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/contracts/[id]/potential-signers - Get potential signers for contract
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

    // İmza yetkilileri - departman müdürleri, departman başları ve C-level yöneticiler
    let potentialSigners: any[] = [];
    
    if (contract.company) {
      // Şirket üyelerini al
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

      // İmza yetkilileri kriterleri:
      // SADECE C-Level yöneticiler ve ADMIN rolündeki kullanıcılar

      const cLevelTitles = [
        'CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CHO', 'CLO', 'CRO',
        'Genel Müdür', 'İcra Kurulu Üyesi', 'Yönetim Kurulu Üyesi'
      ];

      potentialSigners = allCompanyUsers.filter(user => {
        // ADMIN rolündeki kullanıcılar her zaman imza yetkisi var
        if (user.role === 'ADMIN' || user.systemRole === 'ADMIN') {
          return true;
        }

        // SADECE C-Level yöneticiler imza yetkisi var
        if (user.departmentRole && cLevelTitles.some(title => 
          user.departmentRole!.toLowerCase().includes(title.toLowerCase())
        )) {
          return true;
        }

        return false;
      });

      // İmza yetkilileri öncelik sırası:
      // 1. C-Level yöneticiler
      // 2. ADMIN'ler
      potentialSigners.sort((a, b) => {
        // C-Level öncelik
        const aIsCLevel = cLevelTitles.some(title => 
          a.departmentRole?.toLowerCase().includes(title.toLowerCase())
        );
        const bIsCLevel = cLevelTitles.some(title => 
          b.departmentRole?.toLowerCase().includes(title.toLowerCase())
        );

        if (aIsCLevel && !bIsCLevel) return -1;
        if (!aIsCLevel && bIsCLevel) return 1;

        // ADMIN öncelik
        const aIsAdmin = a.role === 'ADMIN' || a.systemRole === 'ADMIN';
        const bIsAdmin = b.role === 'ADMIN' || b.systemRole === 'ADMIN';

        if (aIsAdmin && !bIsAdmin) return -1;
        if (!aIsAdmin && bIsAdmin) return 1;

        // Departman adına göre sırala
        return (a.department || '').localeCompare(b.department || '', 'tr');
      });

      // Kullanıcıları kategori bilgisi ile zenginleştir
      potentialSigners = potentialSigners.map(user => {
        let category = 'İmza Yetkisi Yok';
        
        if (user.role === 'ADMIN' || user.systemRole === 'ADMIN') {
          category = 'Sistem Yöneticisi';
        } else if (user.departmentRole && cLevelTitles.some(title => 
          user.departmentRole.toLowerCase().includes(title.toLowerCase())
        )) {
          category = 'C-Level Yönetici';
        }

        return {
          ...user,
          category
        };
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

      potentialSigners = admins.map(admin => ({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        department: admin.department,
        departmentRole: admin.departmentRole,
        role: 'ADMIN',
        systemRole: admin.role,
        category: 'Sistem Yöneticisi'
      }));
    }

    return NextResponse.json({
      users: potentialSigners,
      total: potentialSigners.length
    });
  } catch (error) {
    console.error('Potansiyel imzalayıcıları getirme hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 