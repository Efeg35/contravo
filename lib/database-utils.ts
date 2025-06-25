import { PrismaClient } from '@prisma/client'
import type { ContractStatus } from '@/app/types'

const db = new PrismaClient()

export const contractUtils = {
  // Get active contracts (ACTIVE status)
  async getActiveContracts(companyId?: string) {
    return db.contract.findMany({
      where: {
        status: 'ACTIVE',
        companyId: companyId || undefined,
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        },
        company: {
          select: { name: true }
        }
      }
    })
  },

  // Get contracts expiring soon
  async getExpiringContracts(days: number = 30, companyId?: string) {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + days)

    return db.contract.findMany({
      where: {
        status: 'ACTIVE',
        expirationDate: {
          lte: futureDate,
          gte: new Date()
        },
        companyId: companyId || undefined,
      },
      include: {
        createdBy: {
          select: { name: true, email: true }
        }
      }
    })
  },

  // Update contract status
  async updateContractStatus(contractId: string, newStatus: ContractStatus) {
    return db.contract.update({
      where: { id: contractId },
      data: { status: newStatus }
    })
  },

  // Get contract statistics
  async getContractStats(companyId?: string) {
    const [total, active, draft] = await Promise.all([
      db.contract.count({
        where: { companyId: companyId || undefined }
      }),
      db.contract.count({
        where: { 
          status: 'ACTIVE',
          companyId: companyId || undefined 
        }
      }),
      db.contract.count({
        where: { 
          status: 'DRAFT',
          companyId: companyId || undefined 
        }
      })
    ])

    return { total, active, draft }
  }
}

export default db 