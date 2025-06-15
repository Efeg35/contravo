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

    // Get all users with their notification settings
    const users = await prisma.user.findMany({
      include: {
        notificationSettings: true,
        createdContracts: {
          where: {
            endDate: {
              not: null
            },
            status: {
              in: ['APPROVED', 'SIGNED'] // Only check active contracts
            }
          },
          include: {
            createdBy: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    for (const user of users) {
      const settings = user.notificationSettings;
      
      // Skip if user disabled expiring notifications
      if (!settings?.contractExpiring) {
        continue;
      }

      const daysBeforeExpiration = settings.daysBeforeExpiration || 30;
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + daysBeforeExpiration);

      // Find contracts expiring within the notification window
      const expiringContracts = user.createdContracts.filter(contract => {
        if (!contract.endDate) return false;
        
        const endDate = new Date(contract.endDate);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays <= daysBeforeExpiration && diffDays > 0;
      });

      // Create notifications for expiring contracts
      for (const contract of expiringContracts) {
        const endDate = new Date(contract.endDate!);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Check if we already sent a notification for this contract recently
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: user.id,
            contractId: contract.id,
            type: 'CONTRACT_EXPIRING',
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        });

        if (existingNotification) {
          continue; // Skip if already notified recently
        }

        await prisma.notification.create({
          data: {
            userId: user.id,
            contractId: contract.id,
            type: 'CONTRACT_EXPIRING',
            title: `Sözleşme ${daysUntilExpiration} gün içinde sona eriyor`,
            message: `"${contract.title}" sözleşmesi ${daysUntilExpiration} gün içinde sona erecek. Gerekli işlemleri yapmayı unutmayın.`,
            metadata: {
              daysUntilExpiration,
              endDate: contract.endDate,
              contractTitle: contract.title
            }
          }
        });

        console.log(`Created expiring notification for contract ${contract.id} (${daysUntilExpiration} days)`);
      }
    }

    // Check for expired contracts
    await checkExpiredContracts();
    
    console.log('Expiring contracts check completed');
  } catch (error) {
    console.error('Error checking expiring contracts:');
  }
}

// Check for contracts that have already expired
export async function checkExpiredContracts() {
  try {
    console.log('Checking for expired contracts...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find contracts that expired today
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

    for (const contract of expiredContracts) {
      const user = contract.createdBy;
      const settings = user.notificationSettings;
      
      // Skip if user disabled expired notifications
      if (!settings?.contractExpired) {
        continue;
      }

      // Check if we already sent an expired notification for this contract
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          contractId: contract.id,
          type: 'CONTRACT_EXPIRED',
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      });

      if (existingNotification) {
        continue; // Skip if already notified recently
      }

      await prisma.notification.create({
        data: {
          userId: user.id,
          contractId: contract.id,
          type: 'CONTRACT_EXPIRED',
          title: 'Sözleşme süresi doldu',
          message: `"${contract.title}" sözleşmesinin süresi dolmuştur. Yenileme veya arşivleme işlemlerini değerlendirin.`,
          metadata: {
            endDate: contract.endDate,
            contractTitle: contract.title,
            expiredDate: today
          }
        }
      });

      // Auto-archive expired contracts (optional)
      await prisma.contract.update({
        where: { id: contract.id },
        data: { status: 'ARCHIVED' }
      });

      console.log(`Created expired notification for contract ${contract.id}`);
    }

    console.log('Expired contracts check completed');
  } catch (error) {
    console.error('Error checking expired contracts:');
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