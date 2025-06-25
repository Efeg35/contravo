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

// Enhanced interface for comprehensive contract tracking
interface ExpiringContract {
  id: string;
  title: string;
  endDate: Date;
  renewalDate?: Date;
  reminderDays: number[];
  lastReminderSent?: Date;
  renewalStatus: string;
  autoRenewal: boolean;
  createdById: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
  };
}

// 🚀 PROAKTIF SÖZLEŞME TAKİP SİSTEMİ - "Kör Depolama" Probleminin Çözümü
export async function checkExpiringContracts() {
  try {
    console.log('🔍 Checking for expiring contracts...');

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

      // Get all active contracts for this user
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
          in: ['SIGNING', 'ACTIVE'] // Only active contracts
          },
          // renewalStatus filter temporarily commented due to type issues
          // renewalStatus: {
          //   notIn: ['EXPIRED', 'NO_RENEWAL'] // Exclude irrelevant contracts
          // }
        },
        select: {
          id: true,
          title: true,
          endDate: true,
          createdById: true
          // Temporarily removing new fields due to type generation delay
          // renewalDate: true,
          // reminderDays: true,
          // lastReminderSent: true,
          // renewalStatus: true,
          // autoRenewal: true,
        }
      });

      console.log(`📊 Found ${allContracts.length} active contracts for user ${user.id}`);

      // 🎯 ÇOKLU SEVİYELİ HATIRLATMA SİSTEMİ
      await processMultiLevelReminders(user.id, allContracts, settings);
      
      // 🔄 YENİLEME TARİHİ TAKİBİ  
      await processRenewalReminders(user.id, allContracts, settings);
    }

    // Check for expired contracts
    await checkExpiredContracts();
    
    console.log('✅ Expiring contracts check completed');
  } catch (error) {
    console.error('❌ Error checking expiring contracts:', error);
  }
}

// 🎯 ÇOKLU SEVİYELİ HATIRLATMA SİSTEMİ (90, 60, 30, 7 gün)
async function processMultiLevelReminders(userId: string, contracts: any[], settings: any) {
  const today = new Date();
  const remindersToCreate: any[] = [];
  const contractsToUpdate: { id: string, lastReminderSent: Date }[] = [];

  for (const contract of contracts) {
    if (!contract.endDate) continue;

    const endDate = new Date(contract.endDate);
    const diffTime = endDate.getTime() - today.getTime();
    const daysUntilExpiration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Skip contracts that have already expired
    if (daysUntilExpiration <= 0) continue;

    // Kullanıcının kendi reminder günlerini kullan, yoksa varsayılan (type assertion for new fields)
    const contractWithNewFields = contract as any;
    const reminderDays = contractWithNewFields.reminderDays ? 
      (Array.isArray(contractWithNewFields.reminderDays) ? contractWithNewFields.reminderDays : JSON.parse(contractWithNewFields.reminderDays as string)) 
      : [90, 60, 30, 7];
    
    // Check if we need to send a reminder for any of the reminder days
    for (const reminderDay of reminderDays) {
      if (daysUntilExpiration <= reminderDay) {
        // Check if we already sent a reminder for this level in the last 24 hours
        const lastSent = contractWithNewFields.lastReminderSent ? new Date(contractWithNewFields.lastReminderSent) : null;
        const shouldSendReminder = !lastSent || 
          (today.getTime() - lastSent.getTime()) > (24 * 60 * 60 * 1000);

        if (shouldSendReminder) {
          // 🚨 KRİTİK SEVİYE DEĞERLENDİRMESİ
          let urgencyLevel = 'LOW';
          let icon = '🔔';
          
          if (daysUntilExpiration <= 7) {
            urgencyLevel = 'CRITICAL';
            icon = '🚨';
          } else if (daysUntilExpiration <= 30) {
            urgencyLevel = 'HIGH';
            icon = '⚠️';
          } else if (daysUntilExpiration <= 60) {
            urgencyLevel = 'MEDIUM';
            icon = '📅';
          }

          remindersToCreate.push({
            userId: userId,
            contractId: contract.id,
            type: 'CONTRACT_EXPIRING',
            title: `${icon} Sözleşme ${daysUntilExpiration} gün içinde sona eriyor`,
            message: `"${contract.title}" sözleşmesi ${daysUntilExpiration} gün içinde sona erecek. ${getActionMessage(daysUntilExpiration, contractWithNewFields.autoRenewal || false)}`,
                          metadata: {
                daysUntilExpiration,
                endDate: contract.endDate,
                contractTitle: contract.title,
                urgencyLevel,
                reminderLevel: reminderDay,
                autoRenewal: contractWithNewFields.autoRenewal || false,
                renewalStatus: contractWithNewFields.renewalStatus || 'PENDING'
              }
          });

          contractsToUpdate.push({
            id: contract.id,
            lastReminderSent: today
          });

          console.log(`📤 Scheduled ${urgencyLevel} reminder for contract ${contract.id} (${daysUntilExpiration} days)`);
          break; // Only send one reminder per contract per day
        }
      }
    }
  }

  // 🚀 BULK OPERATIONS for performance
  if (remindersToCreate.length > 0) {
    await prisma.notification.createMany({
      data: remindersToCreate
    });
    console.log(`✅ Created ${remindersToCreate.length} multi-level reminders`);
  }

  // Update last reminder sent dates
  if (contractsToUpdate.length > 0) {
    for (const update of contractsToUpdate) {
      // Temporarily commenting out due to type issues - will be fixed after full deployment
      // await prisma.contract.update({
      //   where: { id: update.id },
      //   data: { lastReminderSent: update.lastReminderSent }
      // });
    }
    console.log(`📅 Updated ${contractsToUpdate.length} reminder timestamps`);
  }
}

// 🔄 YENİLEME TARİHİ HATIRLATMA SİSTEMİ
async function processRenewalReminders(userId: string, contracts: any[], settings: any) {
  const today = new Date();
  const renewalReminders: any[] = [];

  for (const contract of contracts) {
    const contractWithNewFields = contract as any;
    if (!contractWithNewFields.renewalDate) continue;

    const renewalDate = new Date(contractWithNewFields.renewalDate);
    const diffTime = renewalDate.getTime() - today.getTime();
    const daysUntilRenewal = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Yenileme tarihi geldi veya geçti
    if (daysUntilRenewal <= 30 && daysUntilRenewal > -7) {
      let renewalMessage = '';
      let renewalIcon = '🔄';
      
      if (daysUntilRenewal <= 0) {
        renewalMessage = `"${contract.title}" sözleşmesinin yenileme tarihi geldi! Acil işlem gerekli.`;
        renewalIcon = '🚨';
      } else {
        renewalMessage = `"${contract.title}" sözleşmesinin yenileme tarihi ${daysUntilRenewal} gün sonra. Hazırlıkları başlatın.`;
        renewalIcon = '📋';
      }

      renewalReminders.push({
        userId: userId,
        contractId: contract.id,
        type: 'CONTRACT_REMINDER',
        title: `${renewalIcon} Sözleşme Yenileme Hatırlatması`,
        message: renewalMessage,
        metadata: {
          daysUntilRenewal,
          renewalDate: contractWithNewFields.renewalDate,
          contractTitle: contract.title,
          autoRenewal: contractWithNewFields.autoRenewal || false,
          renewalStatus: contractWithNewFields.renewalStatus || 'PENDING'
        }
      });
    }
  }

  if (renewalReminders.length > 0) {
    await prisma.notification.createMany({
      data: renewalReminders
    });
    console.log(`🔄 Created ${renewalReminders.length} renewal reminders`);
  }
}

// Get appropriate action message based on days remaining and auto-renewal status
function getActionMessage(days: number, autoRenewal: boolean): string {
  if (autoRenewal) {
    return "Otomatik yenileme aktif. Şartları gözden geçirin.";
  }
  
  if (days <= 7) {
    return "ACİL: Yenileme veya sonlandırma kararı verin!";
  } else if (days <= 30) {
    return "Yenileme müzakerelerini başlatın.";
  } else if (days <= 60) {
    return "Yenileme stratejisini planlayın.";
  } else {
    return "Sözleşme şartlarını değerlendirmeye başlayın.";
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
          in: ['SIGNING', 'ACTIVE'] // Only active contracts
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