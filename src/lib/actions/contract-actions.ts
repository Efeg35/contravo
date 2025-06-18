'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '../../../lib/auth-helpers';
import { hasRequiredRole } from '@/lib/auth';

/**
 * Ana sözleşmeye bağlı yeni bir ek sözleşme (amendment) oluşturur
 * @param parentContractId - Ana sözleşmenin ID'si
 */
export async function createAmendment(parentContractId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Kullanıcı girişi gereklidir');
    }

    // Eğer kullanıcının rolü yoksa hata ver
    if (!user.role) {
      throw new Error(`Kullanıcınızın rol bilgisi eksik. Lütfen yöneticinizle iletişime geçin. Email: ${user.email}`);
    }

    // Kullanıcı yetki kontrolü - En az EDITOR yetkisi gerekli
    if (!await hasRequiredRole('EDITOR')) {
      throw new Error(`Bu işlem için EDITOR veya üstü yetki gereklidir. Mevcut rolünüz: ${user.role}. Lütfen yöneticinizden rolünüzü güncellemesini isteyin.`);
    }

    // Ana sözleşmeyi ve onay adımlarını çek
    const parentContract = await db.contract.findUnique({
      where: { id: parentContractId },
      include: {
        approvals: {
          include: {
            approver: {
              select: { id: true, name: true, email: true, role: true }
            }
          }
        },
        company: true
      }
    });

    if (!parentContract) {
      throw new Error('Ana sözleşme bulunamadı');
    }

    // Kullanıcının bu sözleşmeye erişim yetkisi olup olmadığını kontrol et
    const hasAccess = 
      parentContract.createdById === user.id ||
      (parentContract.company && 
        await db.companyUser.findFirst({
          where: {
            userId: user.id,
            companyId: parentContract.company.id,
            role: { in: ['ADMIN', 'EDITOR'] }
          }
        })
      );

    if (!hasAccess) {
      throw new Error('Bu sözleşmeye değişiklik yapma yetkiniz bulunmamaktadır');
    }

    // Mevcut ek sözleşme sayısını hesapla
    const existingAmendmentCount = await db.contract.count({
      where: { parentContractId: parentContractId }
    });

    // Yeni ek sözleşme oluştur
    const amendmentContract = await db.contract.create({
      data: {
        title: `${parentContract.title} (Değişiklik-${existingAmendmentCount + 1})`,
        description: parentContract.description ? 
          `Ana sözleşme: ${parentContract.title}\n\n${parentContract.description}` : 
          `Ana sözleşme: ${parentContract.title}`,
        content: parentContract.content || '',
        status: 'DRAFT',
        type: parentContract.type,
        value: parentContract.value,
        startDate: parentContract.startDate,
        endDate: parentContract.endDate,
        expirationDate: parentContract.expirationDate,
        noticePeriodDays: parentContract.noticePeriodDays,
        renewalDate: parentContract.renewalDate,
        autoRenewal: parentContract.autoRenewal,
        otherPartyName: parentContract.otherPartyName,
        otherPartyEmail: parentContract.otherPartyEmail,
        companyId: parentContract.companyId,
        templateId: parentContract.templateId,
        parentContractId: parentContractId,
        createdById: user.id,
        updatedById: user.id,
      }
    });

    // Ana sözleşmenin onay adımlarını kopyala
    if (parentContract.approvals && parentContract.approvals.length > 0) {
      const approvalData = parentContract.approvals.map((approval) => ({
        contractId: amendmentContract.id,
        approverId: approval.approverId,
        status: 'PENDING',
        comment: null,
        approvedAt: null,
      }));

      await db.contractApproval.createMany({
        data: approvalData
      });
    }

    // Cache'i yenile
    revalidatePath('/dashboard/contracts');
    revalidatePath(`/dashboard/contracts/${parentContractId}`);
    revalidatePath(`/dashboard/contracts/${amendmentContract.id}`);
    
    // Yeni oluşturulan ek sözleşmenin düzenleme sayfasına yönlendir
    redirect(`/dashboard/contracts/${amendmentContract.id}/edit`);

  } catch (error) {
    console.error('Amendment oluşturma hatası:', error);
    throw error;
  }
} 