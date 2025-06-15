/* eslint-disable */
import { PrismaClient } from '@prisma/client'
import { promises as fs } from 'fs'
import path from 'path'
import { createWriteStream } from 'fs'
import archiver from 'archiver'
import extract from 'extract-zip'
import { logger } from './logger'

// Database Backup & Restore System
export class BackupManager {
  private prisma: PrismaClient
  private backupPath: string

  constructor(prisma: PrismaClient, backupPath: string = './backups') {
    this.prisma = prisma
    this.backupPath = backupPath
  }

  // Create a full database backup
  async createBackup(backupName?: string): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const name = backupName || `backup-${timestamp}`
    const backupDir = path.join(this.backupPath, name)

    console.log(`Creating backup: ${name}`)

    try {
      // Ensure backup directory exists
      await fs.mkdir(backupDir, { recursive: true })

      // Export all data
      const exportData = await this.exportAllData()

      // Save data to JSON file
      const dataFile = path.join(backupDir, 'data.json')
      await fs.writeFile(dataFile, JSON.stringify(exportData, null, 2))

      // Copy database file (for SQLite)
      await this.copyDatabaseFile(backupDir)

      // Create metadata
      const metadata = {
        name,
        createdAt: new Date().toISOString(),
        version: '1.0',
        recordCounts: {
          users: exportData.users.length,
          companies: exportData.companies.length,
          contracts: exportData.contracts.length,
          templates: exportData.templates.length
        }
      }

      const metadataFile = path.join(backupDir, 'metadata.json')
      await fs.writeFile(metadataFile, JSON.stringify(metadata, null, 2))

      // Create compressed archive
      const archivePath = await this.createArchive(backupDir, name)

      // Clean up temporary directory
      await fs.rm(backupDir, { recursive: true })

      console.log(`Backup created successfully: ${archivePath}`)
      return archivePath
    } catch (error) {
      console.error('Backup creation failed:', error)
      // Clean up on failure
      try {
        await fs.rm(backupDir, { recursive: true })
      } catch (error) {}
      throw error
    }
  }

  // Export all data from database
  private async exportAllData() {
    console.log('Exporting database data...')

    const [
      users,
      companies,
      companySettings,
      companyUsers,
      contracts,
      contractAttachments,
      contractApprovals,
      contractVersions,
      templates,
      notifications,
      notificationSettings,
      digitalSignatures,
      signaturePackages
    ] = await Promise.all([
      this.prisma.user.findMany(),
      this.prisma.company.findMany(),
      this.prisma.companySettings.findMany(),
      this.prisma.companyUser.findMany(),
      this.prisma.contract.findMany(),
      this.prisma.contractAttachment.findMany(),
      this.prisma.contractApproval.findMany(),
      this.prisma.contractVersion.findMany(),
      this.prisma.contractTemplate.findMany(),
      this.prisma.notification.findMany(),
      this.prisma.notificationSettings.findMany(),
      this.prisma.digitalSignature.findMany(),
      this.prisma.signaturePackage.findMany()
    ])

    return {
      users,
      companies,
      companySettings,
      companyUsers,
      contracts,
      contractAttachments,
      contractApprovals,
      contractVersions,
      templates,
      notifications,
      notificationSettings,
      digitalSignatures,
      signaturePackages,
      exportedAt: new Date().toISOString()
    }
  }

  // Copy database file (for SQLite)
  private async copyDatabaseFile(backupDir: string): Promise<void> {
    try {
      const dbPath = 'prisma/dev.db'
      const backupDbPath = path.join(backupDir, 'database.db')
      
      const sourceExists = await fs.access(dbPath).then(() => true).catch(() => false)
      if (sourceExists) {
        await fs.copyFile(dbPath, backupDbPath)
        console.log('Database file copied to backup')
      }
    } catch (error) {
      console.warn('Could not copy database file:', error)
    }
  }

  // Create compressed archive
  private async createArchive(sourceDir: string, name: string): Promise<string> {
    const archivePath = path.join(this.backupPath, `${name}.zip`)
    
    return new Promise((resolve, reject) => {
      const output = createWriteStream(archivePath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        console.log(`Archive created: ${archive.pointer()} total bytes`)
        resolve(archivePath)
      })

      archive.on('error', reject)
      archive.pipe(output)
      archive.directory(sourceDir, false)
      archive.finalize()
    })
  }

  // List all available backups
  async listBackups(): Promise<{
    name: string
    path: string
    size: number
    createdAt: Date
    metadata?: any
  }[]> {
    try {
      await fs.mkdir(this.backupPath, { recursive: true })
      const files = await fs.readdir(this.backupPath)
      const backups = []

      for (const file of files) {
        if (file.endsWith('.zip')) {
          const filePath = path.join(this.backupPath, file)
          const stats = await fs.stat(filePath)
          
          backups.push({
            name: file.replace('.zip', ''),
            path: filePath,
            size: stats.size,
            createdAt: stats.birthtime
          })
        }
      }

      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error('Error listing backups:', error)
      return []
    }
  }

  // Restore from backup
  async restoreBackup(backupPath: string, options: {
    overwrite?: boolean
    skipUsers?: boolean
    skipCompanies?: boolean
    skipContracts?: boolean
  } = {}): Promise<void> {
    const { overwrite = false, skipUsers = false, skipCompanies = false, skipContracts = false } = options

    console.log(`Starting restore from: ${backupPath}`)

    if (!overwrite) {
      const confirmed = await this.confirmRestore()
      if (!confirmed) {
        console.log('Restore cancelled by user')
        return
      }
    }

    try {
      // Extract backup archive
      const tempDir = path.join(this.backupPath, 'temp-restore')
      await this.extractBackup(backupPath, tempDir)

      // Load backup data
      const dataFile = path.join(tempDir, 'data.json')
      const backupData = JSON.parse(await fs.readFile(dataFile, 'utf-8'))

      // Validate backup data
      await this.validateBackupData(backupData)

      // Clear existing data if overwriting
      if (overwrite) {
        await this.clearDatabase()
      }

      // Restore data in correct order (respecting foreign keys)
      await this.restoreData(backupData, { skipUsers, skipCompanies, skipContracts })

      // Clean up temp directory
      await fs.rm(tempDir, { recursive: true })

      console.log('Restore completed successfully')
    } catch (error) {
      console.error('Restore failed:', error)
      throw error
    }
  }

  // Extract backup archive
  private async extractBackup(archivePath: string, extractPath: string): Promise<void> {
    await fs.mkdir(extractPath, { recursive: true })
    await extract(archivePath, { dir: path.resolve(extractPath) })
    console.log('Backup archive extracted')
  }

  // Validate backup data structure
  private async validateBackupData(data: any): Promise<void> {
    const requiredFields = ['users', 'companies', 'contracts', 'exportedAt']
    
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`Invalid backup data: missing ${field}`)
      }
    }

    console.log('Backup data validation passed')
  }

  // Clear existing database data
  private async clearDatabase(): Promise<void> {
    console.log('Clearing existing database data...')

    // Delete in reverse order of dependencies
    await this.prisma.digitalSignature.deleteMany()
    await this.prisma.signaturePackage.deleteMany()
    await this.prisma.notification.deleteMany()
    await this.prisma.notificationSettings.deleteMany()
    await this.prisma.contractVersion.deleteMany()
    await this.prisma.contractApproval.deleteMany()
    await this.prisma.contractAttachment.deleteMany()
    await this.prisma.contract.deleteMany()
    await this.prisma.contractTemplate.deleteMany()
    await this.prisma.companyUser.deleteMany()
    await this.prisma.companySettings.deleteMany()
    await this.prisma.company.deleteMany()
    await this.prisma.session.deleteMany()
    await this.prisma.account.deleteMany()
    await this.prisma.user.deleteMany()

    console.log('Database cleared')
  }

  // Restore data to database
  private async restoreData(
    data: any,
    options: { skipUsers?: boolean, skipCompanies?: boolean, skipContracts?: boolean }
  ): Promise<void> {
    console.log('Restoring data to database...')

    // Restore users first
    if (!options.skipUsers && data.users?.length > 0) {
      console.log(`Restoring ${data.users.length} users...`)
      for (const user of data.users) {
        await this.prisma.user.create({ data: user })
      }
    }

    // Restore companies
    if (!options.skipCompanies && data.companies?.length > 0) {
      console.log(`Restoring ${data.companies.length} companies...`)
      for (const company of data.companies) {
        await this.prisma.company.create({ data: company })
      }
    }

    // Restore company settings
    if (data.companySettings?.length > 0) {
      console.log(`Restoring ${data.companySettings.length} company settings...`)
      for (const settings of data.companySettings) {
        await this.prisma.companySettings.create({ data: settings })
      }
    }

    // Restore company users
    if (data.companyUsers?.length > 0) {
      console.log(`Restoring ${data.companyUsers.length} company users...`)
      for (const companyUser of data.companyUsers) {
        await this.prisma.companyUser.create({ data: companyUser })
      }
    }

    // Restore contracts
    if (!options.skipContracts && data.contracts?.length > 0) {
      console.log(`Restoring ${data.contracts.length} contracts...`)
      for (const contract of data.contracts) {
        await this.prisma.contract.create({ data: contract })
      }
    }

    // Restore contract-related data
    if (data.contractAttachments?.length > 0) {
      for (const attachment of data.contractAttachments) {
        await this.prisma.contractAttachment.create({ data: attachment })
      }
    }

    if (data.contractApprovals?.length > 0) {
      for (const approval of data.contractApprovals) {
        await this.prisma.contractApproval.create({ data: approval })
      }
    }

    if (data.contractVersions?.length > 0) {
      for (const version of data.contractVersions) {
        await this.prisma.contractVersion.create({ data: version })
      }
    }

    // Restore templates
    if (data.templates?.length > 0) {
      console.log(`Restoring ${data.templates.length} templates...`)
      for (const template of data.templates) {
        await this.prisma.contractTemplate.create({ data: template })
      }
    }

    // Restore notifications
    if (data.notifications?.length > 0) {
      for (const notification of data.notifications) {
        await this.prisma.notification.create({ data: notification })
      }
    }

    if (data.notificationSettings?.length > 0) {
      for (const settings of data.notificationSettings) {
        await this.prisma.notificationSettings.create({ data: settings })
      }
    }

    console.log('Data restoration completed')
  }

  // Confirm restore operation
  private async confirmRestore(): Promise<boolean> {
    // In a real application, this would show a confirmation dialog
    // For now, we'll assume confirmation
    console.log('Restore operation requires confirmation')
    return true
  }

  // Delete old backups
  async cleanupOldBackups(retentionDays: number = 30): Promise<void> {
    const backups = await this.listBackups()
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    let deletedCount = 0

    for (const backup of backups) {
      if (backup.createdAt < cutoffDate) {
        try {
          await fs.unlink(backup.path)
          deletedCount++
          console.log(`Deleted old backup: ${backup.name}`)
        } catch (error) {
          console.error(`Failed to delete backup ${backup.name}:`, error)
        }
      }
    }

    console.log(`Cleanup completed: ${deletedCount} old backups deleted`)
  }

  // Get backup metadata
  async getBackupMetadata(backupPath: string): Promise<any> {
    try {
      const tempDir = path.join(this.backupPath, 'temp-metadata')
      await this.extractBackup(backupPath, tempDir)
      
      const metadataFile = path.join(tempDir, 'metadata.json')
      const metadata = JSON.parse(await fs.readFile(metadataFile, 'utf-8'))
      
      await fs.rm(tempDir, { recursive: true })
      
      return metadata
    } catch (error) {
      console.error('Failed to read backup metadata:', error)
      return null
    }
  }
}

// Automated backup scheduling
export class BackupScheduler {
  private backupManager: BackupManager
  private intervalId?: NodeJS.Timeout

  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager
  }

  // Schedule automatic backups
  startScheduledBackups(intervalHours: number = 24): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
    }

    const intervalMs = intervalHours * 60 * 60 * 1000

    this.intervalId = setInterval(async () => {
      try {
        console.log('Starting scheduled backup...')
        await this.backupManager.createBackup()
        
        // Clean up old backups
        await this.backupManager.cleanupOldBackups()
      } catch (error) {
        console.error('Scheduled backup failed:', error)
      }
    }, intervalMs)

    console.log(`Scheduled backups started: every ${intervalHours} hours`)
  }

  // Stop scheduled backups
  stopScheduledBackups(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = undefined
      console.log('Scheduled backups stopped')
    }
  }
}

export default BackupManager 