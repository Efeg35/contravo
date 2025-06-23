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

    // Potansiyel onaylayıcıları belirle - SADECE departman müdürleri ve başları
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

      // Onaylama yetkilileri kriterleri - SADECE DEPARTMAN MÜDÜRLERİ
      const managerTitles = [
        'Müdür', 'Departman Müdürü', 'Bölüm Müdürü', 'Şube Müdürü',
        'Başkan', 'Departman Başkanı', 'Bölüm Başkanı', 'Şube Başkanı',
        'Başı', 'Departman Başı', 'Bölüm Başı'
      ];

      potentialApprovers = allCompanyUsers.filter(user => {
        // SADECE Departman müdürleri ve başları onaylama yetkisi var
        // C-Level yöneticiler (CEO, CFO, CTO vb.) onaylama yetkisi YOK
        
        // Önce C-Level kontrolü - bunlar onaylayıcı OLAMAZ
        const cLevelTitles = ['CEO', 'CFO', 'CTO', 'COO', 'CMO', 'CHO', 'CLO', 'CRO'];
        if (user.departmentRole && cLevelTitles.some(title => 
          user.departmentRole!.toUpperCase().includes(title)
        )) {
          return false; // C-Level yöneticiler onaylayıcı olamaz
        }

        // Genel Müdür de onaylayıcı olamaz
        if (user.departmentRole && user.departmentRole.toLowerCase().includes('genel müdür')) {
          return false;
        }

        // SADECE müdür unvanı olanlar onaylayıcı olabilir
        if (user.departmentRole && managerTitles.some(title => 
          user.departmentRole!.toLowerCase().includes(title.toLowerCase())
        )) {
          // Departman izolasyonu kuralları:
          // 1. Hukuk müdürleri - tüm departmanlara erişim
          // 2. Diğer departman müdürleri - sadece kendi departmanı
          
          // Hukuk departmanı müdürleri tüm sözleşmeleri onaylayabilir
          if (user.department === 'Hukuk') {
            return true;
          }

          // Diğer departman müdürleri sadece kendi departmanından gelen sözleşmeleri onaylayabilir
          return user.department === contractCreatorDepartment;
        }

        return false;
      }).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
        departmentRole: user.departmentRole,
        role: user.role,
        systemRole: user.systemRole
      }));

      // Onaylayıcı öncelik sırası: Departman müdürleri -> Departman başları
      potentialApprovers.sort((a, b) => {
        // Müdür öncelik
        const aIsManager = a.departmentRole?.toLowerCase().includes('müdür');
        const bIsManager = b.departmentRole?.toLowerCase().includes('müdür');

        if (aIsManager && !bIsManager) return -1;
        if (!aIsManager && bIsManager) return 1;

        // Departman adına göre sırala
        return (a.department || '').localeCompare(b.department || '', 'tr');
      });

      // Kullanıcıları kategori bilgisi ile zenginleştir
      potentialApprovers = potentialApprovers.map(user => {
        let category = 'Departman Yöneticisi';
        let displayName = user.name;
        
        if (user.departmentRole && user.departmentRole.toLowerCase().includes('müdür')) {
          category = 'Departman Müdürü';
          displayName = `${user.name} (${user.departmentRole})`;
        } else if (user.departmentRole && (
          user.departmentRole.toLowerCase().includes('başkan') || 
          user.departmentRole.toLowerCase().includes('başı')
        )) {
          category = 'Departman Başı';
          displayName = `${user.name} (${user.departmentRole})`;
        }

        return {
          ...user,
          category,
          displayName
        };
      });
    } else {
      // Şirket yoksa, onaylama yetkisi yok - sadece departman müdürleri ve başları onaylayabilir
      potentialApprovers = [];
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