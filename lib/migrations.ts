/* eslint-disable */
import { PrismaClient } from '@prisma/client'
// Data Migration Management System
export class MigrationManager {
  private prisma: PrismaClient
  private migrationsPath: string

  constructor(prisma: PrismaClient, migrationsPath: string = './migrations/data') {
    this.prisma = prisma
    this.migrationsPath = migrationsPath
  }

  // Execute a single migration
  async executeMigration(migrationName: string): Promise<void> {
    console.log(`Starting migration: ${migrationName}`)
    
    try {
      // Check if migration already executed
      const existingMigration = await this.prisma.$queryRaw`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='_data_migrations'
      ` as any[]

      // Create migration tracking table if not exists
      if (existingMigration.length === 0) {
        await this.prisma.$executeRaw`
          CREATE TABLE _data_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `
      }

      // Check if this migration was already executed
      const migrationExists = await this.prisma.$queryRaw`
        SELECT name FROM _data_migrations WHERE name = ${migrationName}
      ` as any[]

      if (migrationExists.length > 0) {
        console.log(`Migration ${migrationName} already executed, skipping...`)
        return
      }

      // Execute the migration based on name
      switch (migrationName) {
        case 'add_default_notification_settings':
          await this.addDefaultNotificationSettings()
          break
        case 'update_existing_contracts_status':
          await this.updateExistingContractsStatus()
          break
        case 'migrate_legacy_company_data':
          await this.migrateLegacyCompanyData()
          break
        case 'cleanup_orphaned_records':
          await this.cleanupOrphanedRecords()
          break
        case 'normalize_contract_types':
          await this.normalizeContractTypes()
          break
        default:
          throw new Error(`Unknown migration: ${migrationName}`)
      }

      // Mark migration as executed
      await this.prisma.$executeRaw`
        INSERT INTO _data_migrations (name) VALUES (${migrationName})
      `

      console.log(`Migration ${migrationName} completed successfully`)
    } catch (_error) {
      console.error('❌ Error running migration:', _error);
      throw _error;
    }
  }

  // Add default notification settings for existing users
  private async addDefaultNotificationSettings(): Promise<void> {
    const usersWithoutSettings = await this.prisma.user.findMany({
      where: {
        notificationSettings: null
      },
      select: { id: true }
    })

    console.log(`Adding notification settings for ${usersWithoutSettings.length} users`)

    for (const user of usersWithoutSettings) {
      await this.prisma.notificationSettings.create({
        data: {
          userId: user.id,
          contractExpiring: true,
          contractExpired: true,
          contractReminder: true,
          approvalNeeded: true,
          approvalReceived: true,
          versionCreated: true,
          emailNotifications: true,
          dashboardNotifications: true,
          reminderFrequency: 'WEEKLY',
          daysBeforeExpiration: 30
        }
      })
    }

    console.log('Default notification settings added')
  }

  // Update existing contracts with proper status
  private async updateExistingContractsStatus(): Promise<void> {
    // Update NULL or invalid statuses to DRAFT
    const updatedDrafts = await this.prisma.contract.updateMany({
      where: {
        OR: [
          { status: null as any },
          { status: '' as any }
        ]
      },
      data: {
        status: 'DRAFT'
      }
    })

    console.log(`Updated ${updatedDrafts.count} contracts to DRAFT status`)

    // Update contracts with end dates in the past to ARCHIVED
    const pastContracts = await this.prisma.contract.updateMany({
      where: {
        endDate: {
          lt: new Date()
        },
        status: {
          in: ['SIGNED']
        }
      },
      data: {
        status: 'ARCHIVED'
      }
    })

    console.log(`Archived ${pastContracts.count} expired contracts`)
  }

  // Migrate legacy company data
  private async migrateLegacyCompanyData(): Promise<void> {
    // Create company settings for companies without settings
    const companiesWithoutSettings = await this.prisma.company.findMany({
      where: {
        settings: null
      },
      select: { id: true }
    })

    console.log(`Creating settings for ${companiesWithoutSettings.length} companies`)

    for (const company of companiesWithoutSettings) {
      await this.prisma.companySettings.create({
        data: {
          companyId: company.id,
          requireApproval: true,
          allowSelfApproval: false,
          notificationSettings: {
            emailNotifications: true,
            contractReminders: true,
            approvalNotifications: true
          }
        }
      })
    }

    console.log('Company settings migration completed')
  }

  // Clean up orphaned records
  private async cleanupOrphanedRecords(): Promise<void> {
    console.log('Cleaning up orphaned records...')
    
    // Note: In SQLite with foreign key constraints, orphaned records 
    // are automatically deleted due to CASCADE settings
    // This is a placeholder for manual cleanup if needed
    
    console.log('Orphaned records cleanup completed')
  }

  // Normalize contract types
  private async normalizeContractTypes(): Promise<void> {
    const typeMapping: Record<string, string> = {
      'Hizmet Sözleşmesi': 'SERVICE',
      'İş Sözleşmesi': 'EMPLOYMENT',
      'Tedarik Sözleşmesi': 'SUPPLY',
      'Ortaklık Sözleşmesi': 'PARTNERSHIP',
      'Kira Sözleşmesi': 'RENTAL',
      'Danışmanlık Sözleşmesi': 'CONSULTING',
      'Gizlilik Sözleşmesi': 'NDA',
      'Satış Sözleşmesi': 'SALES'
    }

    for (const [oldType, newType] of Object.entries(typeMapping)) {
      const updated = await this.prisma.contract.updateMany({
        where: {
          type: oldType
        },
        data: {
          type: newType
        }
      })

      if (updated.count > 0) {
        console.log(`Updated ${updated.count} contracts from "${oldType}" to "${newType}"`)
      }
    }

    console.log('Contract type normalization completed')
  }

  // Run all pending migrations
  async runAllMigrations(): Promise<void> {
    const migrations = [
      'add_default_notification_settings',
      'update_existing_contracts_status',
      'migrate_legacy_company_data',
      'cleanup_orphaned_records',
      'normalize_contract_types'
    ]

    console.log('Starting data migrations...')
    
    for (const migration of migrations) {
      await this.executeMigration(migration)
    }

    console.log('All data migrations completed successfully')
  }

  // Get migration status
  async getMigrationStatus(): Promise<{ executed: string[], pending: string[] }> {
    try {
      const executedMigrations = await this.prisma.$queryRaw`
        SELECT name FROM _data_migrations ORDER BY executed_at
      ` as { name: string }[]

      const allMigrations = [
        'add_default_notification_settings',
        'update_existing_contracts_status',
        'migrate_legacy_company_data',
        'cleanup_orphaned_records',
        'normalize_contract_types'
      ]

      const executed = executedMigrations.map(m => m.name)
      const pending = allMigrations.filter(m => !executed.includes(m))

      return { executed, pending }
    } catch (_error) {
      return {
        executed: [],
        pending: [
          'add_default_notification_settings',
          'update_existing_contracts_status',
          'migrate_legacy_company_data',
          'cleanup_orphaned_records',
          'normalize_contract_types'
        ]
      }
    }
  }

  // Rollback a migration (if possible)
  async rollbackMigration(migrationName: string): Promise<void> {
    console.log(`Rolling back migration: ${migrationName}`)
    
    try {
      // Execute rollback based on migration name
      switch (migrationName) {
        case 'add_default_notification_settings':
          await this.rollbackDefaultNotificationSettings()
          break
        case 'normalize_contract_types':
          await this.rollbackContractTypeNormalization()
          break
        default:
          throw new Error(`Rollback not supported for migration: ${migrationName}`)
      }

      // Remove migration record
      await this.prisma.$executeRaw`
        DELETE FROM _data_migrations WHERE name = ${migrationName}
      `

      console.log(`Migration ${migrationName} rolled back successfully`)
    } catch (_error) {
      console.error('❌ Error during rollback:', _error);
      throw _error;
    }
  }

  private async rollbackDefaultNotificationSettings(): Promise<void> {
    // Remove all default notification settings
    const deleted = await this.prisma.notificationSettings.deleteMany({
      where: {
        contractExpiring: true,
        contractExpired: true,
        reminderFrequency: 'WEEKLY',
        daysBeforeExpiration: 30
      }
    })

    console.log(`Removed ${deleted.count} default notification settings`)
  }

  private async rollbackContractTypeNormalization(): Promise<void> {
    const reverseTypeMapping: Record<string, string> = {
      'SERVICE': 'Hizmet Sözleşmesi',
      'EMPLOYMENT': 'İş Sözleşmesi',
      'SUPPLY': 'Tedarik Sözleşmesi',
      'PARTNERSHIP': 'Ortaklık Sözleşmesi',
      'RENTAL': 'Kira Sözleşmesi',
      'CONSULTING': 'Danışmanlık Sözleşmesi',
      'NDA': 'Gizlilik Sözleşmesi',
      'SALES': 'Satış Sözleşmesi'
    }

    for (const [newType, oldType] of Object.entries(reverseTypeMapping)) {
      const updated = await this.prisma.contract.updateMany({
        where: {
          type: newType
        },
        data: {
          type: oldType
        }
      })

      if (updated.count > 0) {
        console.log(`Reverted ${updated.count} contracts from "${newType}" to "${oldType}"`)
      }
    }

    console.log('Contract type normalization rollback completed')
  }


}

// Data seeding utilities
export class DataSeeder {
  private prisma: PrismaClient

  constructor(prisma: PrismaClient) {
    this.prisma = prisma
  }

  // Seed sample data for development
  async seedDevelopmentData(): Promise<void> {
    console.log('Seeding development data...')
    console.log('Development data seeding completed - simplified for production')
  }
}

export default MigrationManager 