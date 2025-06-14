import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

interface BulkAssignment {
  contractId: string;
  companyId?: string;
  status?: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'ARCHIVED';
  type?: string;
}

const prisma = new PrismaClient();

// Toplu işlemler
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Yetkilendirme gerekli' }, { status: 401 });
    }

    const body = await request.json();
    const { action, contractIds, data } = body;

    if (!action || !contractIds || !Array.isArray(contractIds) || contractIds.length === 0) {
      return NextResponse.json({ error: 'Geçersiz istek parametreleri' }, { status: 400 });
    }

    // Kullanıcının yetki sahibi olduğu sözleşmeleri kontrol et
    const userContracts = await prisma.contract.findMany({
      where: {
        id: { in: contractIds },
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
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (userContracts.length === 0) {
      return NextResponse.json({ error: 'İşlem yapılacak sözleşme bulunamadı veya yetki yok' }, { status: 403 });
    }

    const authorizedIds = userContracts.map(c => c.id);
    let result: Record<string, unknown> = {};

    switch (action) {
      case 'UPDATE_STATUS':
        if (!data?.status) {
          return NextResponse.json({ error: 'Durum bilgisi gerekli' }, { status: 400 });
        }
        
        result = await prisma.contract.updateMany({
          where: { id: { in: authorizedIds } },
          data: { 
            status: data.status,
            updatedAt: new Date(),
            updatedById: session.user.id
          }
        });
        
        result.message = `${result.count} sözleşmenin durumu güncellendi`;
        break;

      case 'UPDATE_TYPE':
        if (!data?.type) {
          return NextResponse.json({ error: 'Tür bilgisi gerekli' }, { status: 400 });
        }
        
        result = await prisma.contract.updateMany({
          where: { id: { in: authorizedIds } },
          data: { 
            type: data.type,
            updatedAt: new Date(),
            updatedById: session.user.id
          }
        });
        
        result.message = `${result.count} sözleşmenin türü güncellendi`;
        break;

      case 'ARCHIVE':
        result = await prisma.contract.updateMany({
          where: { id: { in: authorizedIds } },
          data: { 
            status: 'ARCHIVED',
            updatedAt: new Date(),
            updatedById: session.user.id
          }
        });
        
        result.message = `${result.count} sözleşme arşivlendi`;
        break;

      case 'DELETE':
        // Önce ilişkili kayıtları sil
        await prisma.contractAttachment.deleteMany({
          where: { contractId: { in: authorizedIds } }
        });
        
        // Onay kayıtlarını sil
        if (prisma.contractApproval?.deleteMany) {
          await prisma.contractApproval.deleteMany({
            where: { contractId: { in: authorizedIds } }
          });
        }
        
        // Versiyon kayıtlarını sil  
        if (prisma.contractVersion?.deleteMany) {
          await prisma.contractVersion.deleteMany({
            where: { contractId: { in: authorizedIds } }
          });
        }
        
        // Bildirim kayıtlarını sil
        if (prisma.notification?.deleteMany) {
          await prisma.notification.deleteMany({
            where: { contractId: { in: authorizedIds } }
          });
        }
        
        // Dijital imza kayıtlarını sil
        if (prisma.digitalSignature?.deleteMany) {
          await prisma.digitalSignature.deleteMany({
            where: { contractId: { in: authorizedIds } }
          });
        }
        
        // İmza paketlerini sil
        if (prisma.signaturePackage?.deleteMany) {
          await prisma.signaturePackage.deleteMany({
            where: { contractId: { in: authorizedIds } }
          });
        }
        
        result = await prisma.contract.deleteMany({
          where: { id: { in: authorizedIds } }
        });
        
        result.message = `${result.count} sözleşme silindi`;
        break;

      case 'UPDATE_COMPANY':
        if (!data?.companyId) {
          return NextResponse.json({ error: 'Şirket bilgisi gerekli' }, { status: 400 });
        }
        
        // Şirket erişim kontrolü
        const company = await prisma.company.findFirst({
          where: {
            id: data.companyId,
            OR: [
              { createdById: session.user.id },
              {
                users: {
                  some: { userId: session.user.id }
                }
              }
            ]
          }
        });
        
        if (!company) {
          return NextResponse.json({ error: 'Şirket bulunamadı veya yetki yok' }, { status: 403 });
        }
        
        result = await prisma.contract.updateMany({
          where: { id: { in: authorizedIds } },
          data: { 
            companyId: data.companyId,
            updatedAt: new Date(),
            updatedById: session.user.id
          }
        });
        
        result.message = `${result.count} sözleşmenin şirketi güncellendi`;
        break;

      case 'EXPORT':
        // CSV/JSON export
        const exportFormat = data?.format || 'csv';
        const contracts = userContracts;
        
        if (exportFormat === 'csv') {
          const csvHeaders = [
            'ID', 'Başlık', 'Açıklama', 'Durum', 'Tür', 'Değer', 'Başlangıç Tarihi', 
            'Bitiş Tarihi', 'Diğer Taraf', 'Oluşturan', 'Oluşturulma Tarihi'
          ];
          
          const csvRows = contracts.map(contract => [
            contract.id,
            contract.title,
            contract.description || '',
            contract.status,
            contract.type,
            contract.value || '',
            contract.startDate ? new Date(contract.startDate).toLocaleDateString('tr-TR') : '',
            contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : '',
            contract.otherPartyName || '',
            contract.createdBy.name || contract.createdBy.email,
            new Date(contract.createdAt).toLocaleDateString('tr-TR')
          ]);
          
          const csvContent = [csvHeaders, ...csvRows]
            .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
            .join('\n');
          
          const csvBuffer = Buffer.from('\uFEFF' + csvContent, 'utf8'); // BOM for Excel compatibility
          
          return new NextResponse(csvBuffer, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="sozlesmeler_${new Date().toISOString().split('T')[0]}.csv"`
            }
          });
        } else {
          // JSON export
          const jsonData = {
            exportDate: new Date().toISOString(),
            totalContracts: contracts.length,
            contracts: contracts.map(contract => ({
              id: contract.id,
              title: contract.title,
              description: contract.description,
              status: contract.status,
              type: contract.type,
              value: contract.value,
              startDate: contract.startDate,
              endDate: contract.endDate,
              otherPartyName: contract.otherPartyName,
              otherPartyEmail: contract.otherPartyEmail,
              createdBy: contract.createdBy,
              createdAt: contract.createdAt,
              updatedAt: contract.updatedAt
            }))
          };
          
          return NextResponse.json(jsonData, {
            headers: {
              'Content-Disposition': `attachment; filename="sozlesmeler_${new Date().toISOString().split('T')[0]}.json"`
            }
          });
        }

      case 'BULK_ASSIGN':
        if (!data?.assignments || !Array.isArray(data.assignments)) {
          return NextResponse.json({ error: 'Atama bilgileri gerekli' }, { status: 400 });
        }
        
        // Her sözleşme için farklı atamalar yapılabilir
        const updatePromises = data.assignments.map((assignment: BulkAssignment) => {
          if (!authorizedIds.includes(assignment.contractId)) {
            return null;
          }
          
          return prisma.contract.update({
            where: { id: assignment.contractId },
            data: {
              ...(assignment.companyId && { companyId: assignment.companyId }),
              ...(assignment.status && { status: assignment.status }),
              ...(assignment.type && { type: assignment.type }),
              updatedAt: new Date(),
              updatedById: session.user.id
            }
          });
        }).filter(Boolean);
        
        const updateResults = await Promise.all(updatePromises);
        
        result = {
          count: updateResults.length,
          message: `${updateResults.length} sözleşme güncellendi`
        };
        break;

      default:
        return NextResponse.json({ error: 'Geçersiz işlem türü' }, { status: 400 });
    }

    // İşlem logları için notification oluştur (opsiyonel)
    if (typeof result.count === 'number' && result.count > 0 && action !== 'EXPORT') {
      await prisma.notification.create({
        data: {
          userId: session.user.id,
          type: 'CONTRACT_REMINDER',
          title: 'Toplu İşlem Tamamlandı',
          message: String(result.message || 'İşlem tamamlandı')
        }
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Toplu işlem hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu hatası' },
      { status: 500 }
    );
  }
} 