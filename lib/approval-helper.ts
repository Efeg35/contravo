import { db } from './db'

export type ApproverType = 'USER' | 'GROUP' | 'ROLE'
export type AssignmentType = 'all' | 'any' | 'self-select' | 'round-robin'

export interface ResolvedApprover {
  userId: string
  name: string
  email: string
  assignmentType: AssignmentType
  isRequired: boolean // 'all' assignment'ta true, 'any'de false
}

/**
 * Grup ID'sinden grup üyelerini resolve eder
 */
export async function resolveGroupMembers(groupId: string): Promise<{ userId: string; name: string; email: string; }[]> {
  try {
    // Önce predefined groups'ları kontrol et
    const predefinedGroups: Record<string, string> = {
      'legal': 'Hukuk',
      'finance': 'Finans', 
      'procurement': 'Satın Alma',
      'management': 'Yönetim',
      'administrators': 'ADMIN', // Role based
      'everyone': 'ALL' // Special case
    }

    if (predefinedGroups[groupId]) {
      if (groupId === 'administrators') {
        // Admin role'una sahip kullanıcıları getir
        const admins = await db.user.findMany({
          where: { role: 'ADMIN' },
          select: { id: true, name: true, email: true }
        })
        return admins.map(user => ({
          userId: user.id,
          name: user.name || '',
          email: user.email
        }))
      } else if (groupId === 'everyone') {
        // Tüm kullanıcıları getir
        const allUsers = await db.user.findMany({
          select: { id: true, name: true, email: true }
        })
        return allUsers.map(user => ({
          userId: user.id,
          name: user.name || '',
          email: user.email
        }))
      } else {
        // Department'a göre kullanıcıları getir
        const departmentUsers = await db.user.findMany({
          where: { department: predefinedGroups[groupId] },
          select: { id: true, name: true, email: true }
        })
        return departmentUsers.map(user => ({
          userId: user.id,
          name: user.name || '',
          email: user.email
        }))
      }
    }

    // Gerçek team/grup ise database'den getir
    const team = await db.team.findUnique({
      where: { id: groupId },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true }
            }
          }
        }
      }
    })

    if (!team) {
      console.error(`Grup bulunamadı: ${groupId}`)
      return []
    }

    return team.members.map(member => ({
      userId: member.user.id,
      name: member.user.name || '',
      email: member.user.email
    }))

  } catch (error) {
    console.error('Grup üyelerini resolve etme hatası:', error)
    return []
  }
}

/**
 * Approver configuration'ını gerçek kullanıcılara resolve eder
 */
export async function resolveApprovers(
  approverType: ApproverType,
  approverId: string,
  assignmentType: AssignmentType
): Promise<ResolvedApprover[]> {
  try {
    switch (approverType) {
      case 'USER':
        // Direkt kullanıcı
        const user = await db.user.findUnique({
          where: { id: approverId },
          select: { id: true, name: true, email: true }
        })
        
        if (!user) return []
        
        return [{
          userId: user.id,
          name: user.name || '',
          email: user.email,
          assignmentType,
          isRequired: true
        }]

      case 'GROUP':
        // Grup üyelerini resolve et
        const groupMembers = await resolveGroupMembers(approverId)
        
        return groupMembers.map(member => ({
          userId: member.userId,
          name: member.name,
          email: member.email,
          assignmentType,
          isRequired: assignmentType === 'all' // 'all' da herkes gerekli
        }))

      case 'ROLE':
        // Role'a sahip kullanıcıları getir
        const roleUsers = await db.user.findMany({
          where: { role: approverId.toUpperCase() },
          select: { id: true, name: true, email: true }
        })
        
        return roleUsers.map(user => ({
          userId: user.id,
          name: user.name || '',
          email: user.email,
          assignmentType,
          isRequired: assignmentType === 'all'
        }))

      default:
        return []
    }
  } catch (error) {
    console.error('Approvers resolve etme hatası:', error)
    return []
  }
}

/**
 * Contract için approval workflow'unu başlatır
 */
export async function startApprovalWorkflow(contractId: string, workflowApprovers: any[]) {
  try {
    // Her approver için gerçek kullanıcıları resolve et ve approval kayıtları oluştur
    for (const approver of workflowApprovers) {
      const resolvedApprovers = await resolveApprovers(
        approver.approverType,
        approver.approverId,
        approver.assignmentType || 'all'
      )

      // ContractApproval kayıtları oluştur
      for (const resolved of resolvedApprovers) {
        await db.contractApproval.create({
          data: {
            contractId,
            approverId: resolved.userId,
            status: 'PENDING'
          }
        })
      }
    }

    console.log(`✅ Approval workflow başlatıldı: ${contractId}`)
  } catch (error) {
    console.error('Approval workflow başlatma hatası:', error)
    throw error
  }
} 