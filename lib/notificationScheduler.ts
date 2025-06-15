import prisma from './prisma';
// Gelecekte kullanılabilir
// interface ExpiringContract {
//   id: string;
//   title: string;
//   endDate: Date;
//   createdById: string;
//   createdBy: {
//     id: string;
//     name?: string;
//     email: string;
//   };
// }

// Check for expiring contracts and create notifications
export async function checkExpiringContracts() {
  try {
    console.log('Checking for expiring contracts...');

    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true
      }
    });

    for (const user of users) {
      const settings = user.notificationSettings;
      
      // Skip if user disabled expiring notifications
      if (!settings?.contractExpiring) {
        continue;
      }

      const daysBeforeExpiration = settings.daysBeforeExpiration || 7;

      // Get all contracts for this user
      const allContracts = await prisma.contract.findMany({
        where: {
          OR: [
            { createdById: user.id },
            {
              company: {
                OR: [
                  { createdById: user.id },
                  {
                    users: {
                      some: {
                        userId: user.id
                      }
                    }
                  }
                ]
              }
            }
          ],
          status: {
            in: ['APPROVED', 'SIGNED'] // Only active contracts
          }
        }
      });

      // Filter expiring contracts in memory
      const expiringContracts = allContracts.filter(contract => {
        if (!contract.endDate) return false;
        
        const endDate = new Date(contract.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= daysBeforeExpiration && diffDays > 0;
      });

      if (expiringContracts.length === 0) continue;

      // ✅ BULK QUERY: Get all existing notifications for all expiring contracts
      const existingNotifications = await prisma.notification.findMany({
        where: {
          userId: user.id,
          contractId: {
            in: expiringContracts.map(c => c.id)
          },
          type: 'CONTRACT_EXPIRING',
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        select: {
          contractId: true
        }
      });

      // Create a Set for O(1) lookup performance
      const notifiedContractIds = new Set(existingNotifications.map(n => n.contractId));

      // ✅ BULK INSERT: Prepare notifications for contracts that haven't been notified
      const notificationsToCreate = expiringContracts
        .filter(contract => !notifiedContractIds.has(contract.id))
        .map(contract => {
          const endDate = new Date(contract.endDate!);
          const today = new Date();
          const diffTime = endDate.getTime() - today.getTime();
          const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          return {
            userId: user.id,
            contractId: contract.id,
            type: 'CONTRACT_EXPIRING' as const,
            title: `Sözleşme ${daysUntilExpiration} gün içinde sona eriyor`,
            message: `"${contract.title}" sözleşmesi ${daysUntilExpiration} gün içinde sona erecek. Gerekli işlemleri yapmayı unutmayın.`,
            metadata: {
              daysUntilExpiration,
              endDate: contract.endDate,
              contractTitle: contract.title
            }
          };
        });

      // ✅ SINGLE BULK INSERT instead of individual inserts
      if (notificationsToCreate.length > 0) {
        await prisma.notification.createMany({
          data: notificationsToCreate
        });

        console.log(`Created ${notificationsToCreate.length} expiring notifications for user ${user.id}`);
      }
    }

    // Check for expired contracts
    await checkExpiredContracts();
    
    console.log('Expiring contracts check completed');
  } catch (error) {
    console.error('Error checking expiring contracts:', error);
  }
}

// Check for contracts that have already expired
export async function checkExpiredContracts() {
  try {
    console.log('Checking for expired contracts...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // ✅ OPTIMIZED: Get expired contracts with user data in single query
    const expiredContracts = await prisma.contract.findMany({
      where: {
        endDate: {
          lt: today
        },
        status: {
          in: ['APPROVED', 'SIGNED'] // Only active contracts
        }
      },
      include: {
        createdBy: {
          include: {
            notificationSettings: true
          }
        }
      }
    });

    if (expiredContracts.length === 0) return;

    // ✅ BULK QUERY: Get all existing notifications for all expired contracts
    const existingNotifications = await prisma.notification.findMany({
      where: {
        contractId: {
          in: expiredContracts.map(c => c.id)
        },
        type: 'CONTRACT_EXPIRED',
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        contractId: true,
        userId: true
      }
    });

    // Create lookup map for O(1) performance
    const notifiedMap = new Map<string, Set<string>>();
    existingNotifications.forEach(n => {
      if (n.contractId && !notifiedMap.has(n.contractId)) {
        notifiedMap.set(n.contractId, new Set());
      }
      if (n.userId && n.contractId) {
        notifiedMap.get(n.contractId)!.add(n.userId);
      }
    });

    // Prepare bulk operations
    const notificationsToCreate: any[] = [];
    const contractsToUpdate: string[] = [];

    for (const contract of expiredContracts) {
      const user = contract.createdBy;
      const settings = user.notificationSettings;
      
      // Skip if user disabled expired notifications
      if (!settings?.contractExpired) {
        continue;
      }

      // Check if already notified using our lookup map
      const userNotified = notifiedMap.get(contract.id)?.has(user.id) || false;
      
      if (!userNotified) {
        notificationsToCreate.push({
          userId: user.id,
          contractId: contract.id,
          type: 'CONTRACT_EXPIRED',
          title: 'Sözleşme süresi doldu',
          message: `"${contract.title || 'Başlıksız sözleşme'}" sözleşmesinin süresi dolmuştur. Yenileme veya arşivleme işlemlerini değerlendirin.`,
          metadata: {
            endDate: contract.endDate,
            contractTitle: contract.title || 'Başlık yok',
            expiredDate: today
          }
        });
      }

      contractsToUpdate.push(contract.id);
    }

    // ✅ BULK OPERATIONS
    await Promise.all([
      // Bulk insert notifications
      notificationsToCreate.length > 0 && prisma.notification.createMany({
        data: notificationsToCreate
      }),
      
      // Bulk update contracts to ARCHIVED status
      contractsToUpdate.length > 0 && prisma.contract.updateMany({
        where: {
          id: {
            in: contractsToUpdate
          }
        },
        data: {
          status: 'ARCHIVED'
        }
      })
    ]);

    console.log(`Created ${notificationsToCreate.length} expired notifications`);
    console.log(`Archived ${contractsToUpdate.length} expired contracts`);
    console.log('Expired contracts check completed');
  } catch (error) {
    console.error('Error checking expired contracts:', error);
  }
}

// Create approval needed notification
export async function createApprovalNotification(contractId: string, approverIds: string[]) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      select: { id: true, title: true }
    });

    if (!contract) return;

    for (const approverId of approverIds) {
      // Check user's notification settings
      const settings = await prisma.notificationSettings.findUnique({
        where: { userId: approverId }
      });

      if (settings?.approvalNeeded === false) {
        continue; // Skip if user disabled approval notifications
      }

      await prisma.notification.create({
        data: {
          userId: approverId,
          contractId: contract.id,
          type: 'APPROVAL_NEEDED',
          title: 'Onay bekleyen sözleşme',
          message: `"${contract.title}" sözleşmesi onayınızı bekliyor.`,
          metadata: {
            contractTitle: contract.title
          }
        }
      });
    }
  } catch (error) {
    console.error('Error creating approval notification:');
  }
}

// Create version notification
export async function createVersionNotification(contractId: string, versionNumber: string) {
  try {
    const contract = await prisma.contract.findUnique({
      where: { id: contractId },
      include: {
        createdBy: {
          include: {
            notificationSettings: true
          }
        }
      }
    });

    if (!contract) return;

    const settings = contract.createdBy.notificationSettings;
    
    if (settings?.versionCreated === false) {
      return; // Skip if user disabled version notifications
    }

    await prisma.notification.create({
      data: {
        userId: contract.createdById,
        contractId: contract.id,
        type: 'VERSION_CREATED',
        title: 'Yeni sözleşme versiyonu oluşturuldu',
        message: `"${contract.title}" sözleşmesi için v${versionNumber} versiyonu oluşturulmuştur.`,
        metadata: {
          contractTitle: contract.title,
          versionNumber
        }
      }
    });
  } catch (error) {
    console.error('Error creating version notification:');
  }
} 