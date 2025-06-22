'use server';

import { db } from './db';

export interface NextAction {
  action: string | null;
  label: string | null;
}

/**
 * Sözleşmenin durumuna ve mevcut kullanıcıya göre sıradaki eylemi belirler
 * @param contractId - Sözleşme ID'si
 * @param userId - Mevcut kullanıcı ID'si
 * @returns NextAction objesi (action ve label içerir)
 */
export async function getNextAction(contractId: string, userId: string): Promise<NextAction> {
  try {
    // Sözleşmeyi ve ilgili bilgileri çek
    const contract = await db.contract.findUnique({
      where: { id: contractId },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true }
        },
        approvals: {
          where: { status: 'PENDING' },
          include: {
            approver: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'asc' }
        },
        digitalSignatures: {
          where: { 
            OR: [
              { status: 'PENDING' },
              { status: 'SENT' }
            ]
          },
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { order: 'asc' }
        },
        company: {
          include: {
            users: {
              where: { userId: userId },
              select: { role: true }
            }
          }
        }
      }
    });

    if (!contract) {
      return { action: null, label: null };
    }

    // Kullanıcının sözleşmeye göre rolünü belirle
    const isOwner = contract.createdById === userId;
    let userRole = (contract as any).createdBy?.role;
    
    // Eğer şirket üyesiyse, şirket rolünü kullan
    if ((contract as any).company && (contract as any).company.users.length > 0) {
      userRole = (contract as any).company.users[0].role;
    }

    const hasEditorAccess = isOwner || ['ADMIN', 'EDITOR'].includes(userRole);

    // Status'e göre sıradaki eylemi belirle
    switch (contract.status) {
      case 'DRAFT':
        // Taslak durumu: Eğer kullanıcı sahibi veya EDITOR ise onay akışını başlatabilir
        if (hasEditorAccess) {
          return {
            action: 'REQUEST_APPROVAL',
            label: 'Onay Akışını Başlat'
          };
        }
        break;

      case 'IN_REVIEW':
        // İnceleme durumu: Bekleyen onayları kontrol et
        const pendingApproval = (contract as any).approvals?.find((approval: any) => 
          approval.approverId === userId && approval.status === 'PENDING'
        );
        
        if (pendingApproval) {
          return {
            action: 'APPROVE_CONTRACT',
            label: 'Sözleşmeyi Onayla'
          };
        }
        break;

      case 'APPROVED':
        // Onaylanmış: İmzaya gönderilebilir
        if (hasEditorAccess) {
          return {
            action: 'SEND_FOR_SIGNATURE',
            label: 'İmzaya Gönder'
          };
        }
        break;

      case 'SENT_FOR_SIGNATURE':
        // İmzada: Sıradaki imzalayan kontrolü
        const nextSignature = (contract as any).digitalSignatures?.find((sig: any) => 
          sig.userId === userId && ['PENDING', 'SENT'].includes(sig.status)
        );
        
        if (nextSignature) {
          return {
            action: 'SIGN_DOCUMENT',
            label: 'Sözleşmeyi İmzala'
          };
        }
        break;

      case 'SIGNED':
        // İmzalanmış: Aktif hale getirilebilir
        if (hasEditorAccess) {
          return {
            action: 'ACTIVATE_CONTRACT',
            label: 'Sözleşmeyi Aktif Et'
          };
        }
        break;

      default:
        // Diğer durumlar için buton görünmez
        return { action: null, label: null };
    }

    // Hiçbir eylem mümkün değilse
    return { action: null, label: null };

  } catch (error) {
    console.error('getNextAction hatası:', error);
    return { action: null, label: null };
  }
} 