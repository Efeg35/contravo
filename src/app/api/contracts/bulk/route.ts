import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { getCurrentUser, userHasPermission } from '@/lib/auth-helpers';
import { Permission, Department, PermissionManager, CONTRACT_TYPE_DEPARTMENT_MAPPING } from '@/lib/permissions';
import { ContractStatusEnum } from '@/app/types';


interface BulkAssignment {
  contractId: string;
  companyId?: string;
  status?: 'DRAFT' | 'REVIEW' | 'SIGNING' | 'ACTIVE' | 'ARCHIVED' | 'REJECTED';
  type?: 'general' | 'procurement' | 'service' | 'sales' | 'employment' | 'partnership' | 'nda' | 'rental';
}

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

    // Get current user for department filtering
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user can view all contracts
    const canViewAll = await userHasPermission(Permission.CONTRACT_VIEW_ALL);

    // Build department-based access control for bulk operations
    const contractWhereClause: any = {
      id: { in: contractIds }
    };

    if (!canViewAll) {
      const accessConditions: any[] = [
        // User is the creator
        { createdById: user.id }
      ];

      // Company access
      const companyAccess = {
        company: {
          users: {
            some: {
              userId: user.id,
              role: { in: ['ADMIN', 'EDITOR'] }
            }
          }
        }
      };

      // If user has department and department role, add department-based filtering
      if ((user as any).department && (user as any).departmentRole) {
        // Get all contract types this department can access
        const accessibleContractTypes: string[] = [];
        
        Object.entries(CONTRACT_TYPE_DEPARTMENT_MAPPING).forEach(([contractType, departments]) => {
          if (departments.includes((user as any).department as Department)) {
            // Check if user has permission to view this contract type
            if (PermissionManager.canAccessContractByType(
              contractType, 
              (user as any).department as Department, 
              (user as any).departmentRole
            )) {
              accessibleContractTypes.push(contractType);
            }
          }
        });

        if (accessibleContractTypes.length > 0) {
          // Add department-filtered company contracts
          accessConditions.push({
            ...companyAccess,
            type: {
              in: accessibleContractTypes
            }
          });
        }
      } else {
        // If no department role, fall back to basic company access
        accessConditions.push(companyAccess);
      }

      contractWhereClause.OR = accessConditions;
    } else {
      // Admin users can access all contracts but still need basic company access for bulk ops
      contractWhereClause.OR = [
        { createdById: user.id },
        {
          company: {
            users: {
              some: {
                userId: user.id,
                role: { in: ['ADMIN', 'EDITOR'] }
              }
            }
          }
        }
      ];
    }

    // Kullanıcının yetki sahibi olduğu sözleşmeleri kontrol et - WITH DEPARTMENT FILTERING
    const userContracts = await prisma.contract.findMany({
      where: contractWhereClause,
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
        // Sadece enum değerlerine izin ver
        const allowedStatuses: string[] = Object.values(ContractStatusEnum);
        if (!allowedStatuses.includes(data.status)) {
          return NextResponse.json({ error: 'Geçersiz durum değeri' }, { status: 400 });
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
            status: ContractStatusEnum.ARCHIVED,
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