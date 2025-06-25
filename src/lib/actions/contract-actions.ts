'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getCurrentUser } from '../../../lib/auth-helpers';
import { hasRequiredRole } from '@/lib/auth';
import { ContractStatusEnum } from '@/app/types';

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
        status: ContractStatusEnum.DRAFT,
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

/**
 * Sözleşme için revizyon talep eder
 * @param contractId - Sözleşme ID'si
 * @param comment - Revizyon talebi açıklaması
 */
export async function requestRevision(contractId: string, comment: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Kullanıcı girişi gereklidir');
    }

    // Sözleşmeyi ve onay bilgilerini çek
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        approvals: {
          where: { approverId: user.id },
          include: {
            approver: {
              select: { id: true, name: true, email: true }
            }
          }
        },
        company: {
          select: { id: true, name: true }
        }
      }
    });

    if (!contract) {
      throw new Error('Sözleşme bulunamadı');
    }

    // Kullanıcının bu sözleşme için geçerli bir onaycı olup olmadığını kontrol et
    const userApproval = contract.approvals.find(approval => 
      approval.approverId === user.id && approval.status === 'PENDING'
    );

    if (!userApproval) {
      throw new Error('Bu sözleşme için revizyon talep etme yetkiniz bulunmamaktadır');
    }

    // Sözleşmenin durumunu "DRAFT" olarak güncelle ve yaratıcıya assign et (geri gönder)
    await db.contract.update({
      where: { id: contractId },
      data: {
        status: ContractStatusEnum.DRAFT,
        assignedToId: contract.createdById,
        updatedById: user.id,
        updatedAt: new Date()
      }
    });

    // Onay adımını güncelle - revizyon talebini kaydet
    await db.contractApproval.update({
      where: { id: userApproval.id },
      data: {
        status: 'REVISION_REQUESTED',
        comment: comment,
        approvedAt: new Date()
      }
    });

    // Sözleşme sahibine bildirim e-postası gönder
    if (contract.createdBy) {
      try {
        // Basit HTML email gönder (React email yerine)
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h2 style="color: #333; margin: 0 0 15px 0;">🔄 Revizyon Talep Edildi</h2>
              <h3 style="color: #666; margin: 0 0 20px 0;">${contract.title}</h3>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
              <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">
                Merhaba <strong>${contract.createdBy.name || 'Değerli Kullanıcı'}</strong>,
              </p>
              
              <p style="color: #333; line-height: 1.6; margin: 0 0 15px 0;">
                <strong>${contract.title}</strong> adlı sözleşmeniz için <strong>${user.name || user.email}</strong> tarafından revizyon talep edildi.
              </p>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #856404;">Revizyon Sebebi:</h4>
                <p style="margin: 0; color: #856404; white-space: pre-wrap;">${comment}</p>
              </div>
              
              <p style="color: #333; line-height: 1.6; margin: 20px 0 15px 0;">
                Lütfen gerekli değişiklikleri yaparak sözleşmeyi tekrar onaya gönderin.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/contract/${contractId}" 
                   style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                  📄 Sözleşmeyi Görüntüle
                </a>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
              Bu e-posta Contravo CLM sistemi tarafından otomatik olarak gönderilmiştir.
            </div>
          </div>
        `;

        // Resend ile direkt HTML gönder
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Contravo <bildirim@contravo.com>',
            to: [contract.createdBy.email],
            subject: `${contract.title} - Revizyon Talep Edildi`,
            html: emailHtml,
          }),
        });

        if (!response.ok) {
          console.error('Email gönderme hatası:', await response.text());
        } else {
          console.log('Revizyon bildirim e-postası başarıyla gönderildi');
        }
      } catch (emailError) {
        console.error('Email gönderme hatası:', emailError);
        // Email hatası olsa bile server action başarılı sayılsın
      }
    }

    // Cache'i yenile
    revalidatePath('/dashboard/contracts');
    revalidatePath(`/dashboard/contracts/${contractId}`);
    revalidatePath(`/contract/${contractId}`);

    return { success: true, message: 'Revizyon talep edildi ve sözleşme sahibine bildirim gönderildi' };

  } catch (error) {
    console.error('Revizyon talep etme hatası:', error);
    throw error;
  }
} 