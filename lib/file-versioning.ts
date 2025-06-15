import crypto from 'crypto';
import { FileStorage } from './file-storage';
export interface FileVersion {
  id: string;
  fileId: string;
  version: number;
  fileName: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
  changeDescription?: string;
  storagePath: string;
  parentVersion?: number;
  isActive: boolean;
  metadata: {
    changeType: ChangeType;
    changedBy: string;
    changeReason?: string;
  };
}

export interface VersionDiff {
  fileId: string;
  fromVersion: number;
  toVersion: number;
  changes: {
    added: number;
    removed: number;
    modified: number;
    totalChanges: number;
  };
  similarity: number; // 0-1, how similar the versions are
}

export interface VersionBranch {
  id: string;
  fileId: string;
  name: string;
  baseVersion: number;
  headVersion: number;
  createdBy: string;
  createdAt: Date;
  description?: string;
  isActive: boolean;
}

export interface MergeResult {
  success: boolean;
  newVersion?: number;
  conflicts?: Array<{
    type: 'content' | 'metadata';
    description: string;
    resolution?: 'auto' | 'manual';
  }>;
  error?: string;
}

export enum ChangeType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  RESTORE = 'RESTORE',
  MERGE = 'MERGE',
  BRANCH = 'BRANCH'
}

export enum VersioningStrategy {
  FULL_COPY = 'FULL_COPY',           // Store complete file for each version
  DELTA_COMPRESSION = 'DELTA_COMPRESSION', // Store only changes
  HYBRID = 'HYBRID'                  // Mix of full copies and deltas
}

export class FileVersioning {
  private static instance: FileVersioning;
  private storage: FileStorage;
  private strategy: VersioningStrategy;

  // Versioning configuration
  private readonly MAX_VERSIONS_PER_FILE = 50;
  private readonly DELTA_THRESHOLD = 0.3; // If changes > 30%, store full copy
  private readonly CLEANUP_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours

  private constructor() {
    this.storage = FileStorage.getInstance();
    this.strategy = this.getVersioningStrategy();
    this.startCleanupScheduler();
  }

  static getInstance(): FileVersioning {
    if (!FileVersioning.instance) {
      FileVersioning.instance = new FileVersioning();
    }
    return FileVersioning.instance;
  }

  // Create new version
  async createVersion(
    fileId: string,
    versionData: {
      fileName: string;
      size: number;
      hash: string;
      uploadedBy: string;
      storagePath: string;
      changeDescription?: string;
      changeType?: ChangeType;
      parentVersion?: number;
    }
  ): Promise<{ success: boolean; version?: FileVersion; error?: string }> {
    try {
      console.log(`Creating new version for file: ${fileId}`, { fileId });

      // Get current version number
      const currentVersion = await this.getCurrentVersion(fileId);
      const newVersionNumber = currentVersion ? currentVersion.version + 1 : 1;

      // Create version metadata
      const version: FileVersion = {
        id: this.generateVersionId(),
        fileId,
        version: newVersionNumber,
        fileName: versionData.fileName,
        size: versionData.size,
        hash: versionData.hash,
        uploadedAt: new Date(),
        uploadedBy: versionData.uploadedBy,
        changeDescription: versionData.changeDescription,
        storagePath: versionData.storagePath,
        parentVersion: versionData.parentVersion || (currentVersion?.version),
        isActive: true,
        metadata: {
          changeType: versionData.changeType || ChangeType.UPDATE,
          changedBy: versionData.uploadedBy,
          changeReason: versionData.changeDescription
        }
      };

      // Calculate diff if previous version exists
      if (currentVersion) {
        const diff = await this.calculateDiff(currentVersion, version);
        if (diff) {
          // Store diff information in metadata
          console.log(`Diff calculated: ${diff.changes.totalChanges} changes`, { 
            fileId, 
            totalChanges: diff.changes.totalChanges,
            similarity: diff.similarity 
          });
        }
      }

      // Deactivate previous version
      if (currentVersion) {
        await this.deactivateVersion(fileId, currentVersion.version);
      }

      // Save version metadata
      await this.saveVersionMetadata(version);

      // Cleanup old versions if needed
      await this.cleanupOldVersions(fileId);

      console.log(`Version ${newVersionNumber} created for file: ${fileId}`, {
        fileId,
        version: newVersionNumber,
        uploadedBy: versionData.uploadedBy,
        changeType: versionData.changeType
      });

      return { success: true, version };

    } catch (error) {
      console.error('Error creating version', { fileId, error: error instanceof Error ? error.message : String(error) });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get specific version
  async getVersion(fileId: string, version: number): Promise<FileVersion | null> {
    try {
      // In real implementation, query database
      console.log(`Getting version ${version} for file: ${fileId}`, { fileId, version });
      return null; // Mock implementation
    } catch (error) {
      console.error('Error getting version', { fileId, version, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // Get current (active) version
  async getCurrentVersion(fileId: string): Promise<FileVersion | null> {
    try {
      // In real implementation, query database for active version
      console.log(`Getting current version for file: ${fileId}`, { fileId });
      return null; // Mock implementation
    } catch (error) {
      console.error("Error getting current version", { fileId, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  // List all versions for a file
  async listVersions(
    fileId: string
  ): Promise<{
    versions: FileVersion[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      console.log(`📂 Listing versions for file: ${fileId}`);

      // In real implementation, query database with filters
      return {
        versions: [],
        total: 0,
        hasMore: false
      };
    } catch (error) {
      console.error('❌ Error listing versions:');
      throw error;
    }
  }

  // Restore to specific version
  async restoreVersion(
    fileId: string,
    version: number,
    restoredBy: string,
    reason?: string
  ): Promise<{ success: boolean; newVersion?: FileVersion; error?: string }> {
    try {
      // Mock implementation
      console.log(`Restoring file ${fileId} to version ${version} by user ${restoredBy}`);
      return { success: true };
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    }
  }

  // Delete specific version
  async deleteVersion(
    fileId: string,
    version: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Deleting version ${version} for file: ${fileId}`);

      const versionToDelete = await this.getVersion(fileId, version);
      if (!versionToDelete) {
        return { success: false, error: 'Version not found' };
      }

      // Don't allow deletion of the current active version
      if (versionToDelete.isActive) {
        return { success: false, error: 'Cannot delete active version' };
      }

      // Delete from storage
      await this.storage.deleteFile(versionToDelete.storagePath);

      // Delete version metadata
      await this.deleteVersionMetadata(fileId, version);

      console.log(`✅ Version ${version} deleted for file: ${fileId}`);

      return { success: true };

    } catch (error) {
      console.error('❌ Error deleting version:');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Compare two versions
  async compareVersions(
    fileId: string,
    fromVersion: number,
    toVersion: number
  ): Promise<VersionDiff | null> {
    try {
      console.log(`🔍 Comparing versions ${fromVersion} and ${toVersion} for file: ${fileId}`);

      const version1 = await this.getVersion(fileId, fromVersion);
      const version2 = await this.getVersion(fileId, toVersion);

      if (!version1 || !version2) {
        return null;
      }

      return await this.calculateDiff(version1, version2);

    } catch (error) {
      console.error('❌ Error comparing versions:');
      return null;
    }
  }

  // Create branch
  async createBranch(
    fileId: string,
    branchName: string,
    baseVersion: number,
    createdBy: string,
    description?: string
  ): Promise<{ success: boolean; branch?: VersionBranch; error?: string }> {
    try {
      console.log(`🌿 Creating branch '${branchName}' for file: ${fileId}`);

      // Check if branch name already exists
      const existingBranch = await this.getBranch(fileId, branchName);
      if (existingBranch) {
        return { success: false, error: 'Branch name already exists' };
      }

      const branch: VersionBranch = {
        id: this.generateBranchId(),
        fileId,
        name: branchName,
        baseVersion,
        headVersion: baseVersion,
        createdBy,
        createdAt: new Date(),
        description,
        isActive: true
      };

      await this.saveBranchMetadata(branch);

      console.log(`✅ Branch '${branchName}' created for file: ${fileId}`);

      return { success: true, branch };

    } catch (error) {
      console.error('❌ Error creating branch:');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Merge branch
  async mergeBranch(
    fileId: string,
    sourceBranch: string,
    targetBranch: string,
    mergedBy: string,
    mergeMessage?: string
  ): Promise<MergeResult> {
    try {
      console.log(`🔀 Merging branch '${sourceBranch}' into '${targetBranch}' for file: ${fileId}`);

      const source = await this.getBranch(fileId, sourceBranch);
      const target = await this.getBranch(fileId, targetBranch);

      if (!source || !target) {
        return { success: false, error: 'Branch not found' };
      }

      // Get versions to merge
      const sourceVersion = await this.getVersion(fileId, source.headVersion);
      const targetVersion = await this.getVersion(fileId, target.headVersion);

      if (!sourceVersion || !targetVersion) {
        return { success: false, error: 'Version not found' };
      }

      // Check for conflicts
      const conflicts = await this.detectMergeConflicts(sourceVersion, targetVersion);

      if (conflicts.length > 0) {
        // Auto-resolve simple conflicts
        // const autoResolved = conflicts.filter(c => c.resolution === 'auto'); // Will be used for conflict resolution
        const manualConflicts = conflicts.filter(c => c.resolution === 'manual');

        if (manualConflicts.length > 0) {
          return {
            success: false,
            conflicts: manualConflicts,
            error: 'Manual conflict resolution required'
          };
        }
      }

      // Perform merge (simplified - in reality, this would be more complex)
      const mergedData = await this.performMerge(sourceVersion, targetVersion);
      if (!mergedData) {
        return { success: false, error: 'Merge failed' };
      }

      // Create merged version
      const mergedStoragePath = `files/merged/${fileId}_${Date.now()}`;
      const uploadResult = await this.storage.uploadFile(
        mergedData,
        mergedStoragePath,
        'application/octet-stream'
      );

      if (!uploadResult.success) {
        return { success: false, error: 'Failed to upload merged version' };
      }

      const mergeResult = await this.createVersion(fileId, {
        fileName: targetVersion.fileName,
        size: mergedData.length,
        hash: this.calculateHash(mergedData),
        uploadedBy: mergedBy,
        storagePath: mergedStoragePath,
        changeDescription: mergeMessage || `Merged ${sourceBranch} into ${targetBranch}`,
        changeType: ChangeType.MERGE
      });

      if (mergeResult.success) {
        // Update target branch head
        target.headVersion = mergeResult.version!.version;
        await this.updateBranchMetadata(target);

        console.log(`✅ Branch '${sourceBranch}' merged into '${targetBranch}' for file: ${fileId}`);
      }

      return {
        success: mergeResult.success,
        newVersion: mergeResult.version?.version,
        conflicts: conflicts.filter(c => c.resolution === 'auto'),
        error: mergeResult.error
      };

    } catch (error) {
      console.error('❌ Error merging branch:');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get version history with statistics
  async getVersionHistory(fileId: string): Promise<{
    totalVersions: number;
    totalSize: number;
    compressionRatio: number;
    oldestVersion: Date;
    newestVersion: Date;
    topContributors: Array<{ user: string; versions: number }>;
    changeTypes: { [key in ChangeType]: number };
  }> {
    try {
      console.log(`📊 Getting version history for file: ${fileId}`);

      // In real implementation, aggregate data from database
      return {
        totalVersions: 0,
        totalSize: 0,
        compressionRatio: 1,
        oldestVersion: new Date(),
        newestVersion: new Date(),
        topContributors: [],
        changeTypes: {
          [ChangeType.CREATE]: 0,
          [ChangeType.UPDATE]: 0,
          [ChangeType.DELETE]: 0,
          [ChangeType.RESTORE]: 0,
          [ChangeType.MERGE]: 0,
          [ChangeType.BRANCH]: 0
        }
      };
    } catch (error) {
      console.error('❌ Error getting version history:');
      throw error;
    }
  }

  // Private helper methods
  private async calculateDiff(version1: FileVersion, version2: FileVersion): Promise<VersionDiff | null> {
    try {
      // Download both versions
      const data1 = await this.storage.downloadFile(version1.storagePath);
      const data2 = await this.storage.downloadFile(version2.storagePath);

      if (!data1.success || !data2.success || !data1.data || !data2.data) {
        return null;
      }

      // Calculate basic diff statistics
      const similarity = this.calculateSimilarity(data1.data, data2.data);
      const sizeDiff = Math.abs(data1.data.length - data2.data.length);

      return {
        fileId: version1.fileId,
        fromVersion: version1.version,
        toVersion: version2.version,
        changes: {
          added: data2.data.length > data1.data.length ? sizeDiff : 0,
          removed: data1.data.length > data2.data.length ? sizeDiff : 0,
          modified: Math.min(data1.data.length, data2.data.length),
          totalChanges: sizeDiff
        },
        similarity
      };
    } catch (error) {
      console.error('❌ Error calculating diff:');
      return null;
    }
  }

  private calculateSimilarity(data1: Buffer, data2: Buffer): number {
    if (data1.length === 0 && data2.length === 0) return 1;
    if (data1.length === 0 || data2.length === 0) return 0;

    // Simple similarity calculation based on common bytes
    const minLength = Math.min(data1.length, data2.length);
    let commonBytes = 0;

    for (let i = 0; i < minLength; i++) {
      if (data1[i] === data2[i]) {
        commonBytes++;
      }
    }

    return commonBytes / Math.max(data1.length, data2.length);
  }

  private async detectMergeConflicts(
    version1: FileVersion,
    version2: FileVersion
  ): Promise<Array<{ type: 'content' | 'metadata'; description: string; resolution?: 'auto' | 'manual' }>> {
    const conflicts = [];

    // Check for metadata conflicts
    if (version1.fileName !== version2.fileName) {
      conflicts.push({
        type: 'metadata' as const,
        description: 'File name conflict',
        resolution: 'manual' as const
      });
    }

    // Check for content conflicts (simplified)
    const diff = await this.calculateDiff(version1, version2);
    if (diff && diff.similarity < 0.8) {
      conflicts.push({
        type: 'content' as const,
        description: 'Significant content differences detected',
        resolution: 'manual' as const
      });
    }

    return conflicts;
  }

  private async performMerge(version1: FileVersion, version2: FileVersion): Promise<Buffer | null> {
    try {
      // Simplified merge - in reality, this would be much more sophisticated
      const data2 = await this.storage.downloadFile(version2.storagePath);
      return data2.success ? data2.data || null : null;
    } catch (error) {
      console.error('❌ Error performing merge:');
      return null;
    }
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateVersionId(): string {
    return `version_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBranchId(): string {
    return `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getVersioningStrategy(): VersioningStrategy {
    const strategy = process.env.VERSIONING_STRATEGY as VersioningStrategy;
    return strategy || VersioningStrategy.HYBRID;
  }

  private async cleanupOldVersions(fileId: string): Promise<void> {
    try {
      const versions = await this.listVersions(fileId);

      if (versions.total > this.MAX_VERSIONS_PER_FILE) {
        const versionsToDelete = versions.versions.slice(this.MAX_VERSIONS_PER_FILE);
        
        for (const version of versionsToDelete) {
          if (!version.isActive) {
            await this.deleteVersion(fileId, version.version);
          }
        }

        console.log(`🧹 Cleaned up ${versionsToDelete.length} old versions for file: ${fileId}`);
      }
    } catch (error) {
      console.error('❌ Error cleaning up old versions:');
    }
  }

  private startCleanupScheduler(): void {
    setInterval(async () => {
      try {
        console.log('🧹 Running version cleanup...');
        // In real implementation, cleanup old versions across all files
      } catch (error) {
        console.error('❌ Error in cleanup scheduler:');
      }
    }, this.CLEANUP_INTERVAL);
  }

  // Database operations (mock implementations)
  private async saveVersionMetadata(version: FileVersion): Promise<void> {
    console.log('💾 Saving version metadata:', version.id);
  }

  private async deleteVersionMetadata(fileId: string, version: number): Promise<void> {
    console.log('🗑️ Deleting version metadata:', fileId, version);
  }

  private async deactivateVersion(fileId: string, version: number): Promise<void> {
    console.log('📝 Deactivating version:', fileId, version);
  }

  private async getBranch(fileId: string, branchName: string): Promise<VersionBranch | null> {
    console.log('📂 Getting branch:', fileId, branchName);
    return null;
  }

  private async saveBranchMetadata(branch: VersionBranch): Promise<void> {
    console.log('💾 Saving branch metadata:', branch.id);
  }

  private async updateBranchMetadata(branch: VersionBranch): Promise<void> {
    console.log('📝 Updating branch metadata:', branch.id);
  }
}

// Export singleton instance
export const fileVersioning = FileVersioning.getInstance();

// Helper functions
export async function createVersion(
  fileId: string,
  versionData: {
    fileName: string;
    size: number;
    hash: string;
    uploadedBy: string;
    storagePath: string;
    changeDescription?: string;
  }
): Promise<{ success: boolean; version?: FileVersion; error?: string }> {
  return fileVersioning.createVersion(fileId, versionData);
}

export async function getVersion(fileId: string, version: number): Promise<FileVersion | null> {
  return fileVersioning.getVersion(fileId, version);
}

export async function restoreVersion(
  fileId: string,
  version: number,
  restoredBy: string,
  reason?: string
): Promise<{ success: boolean; newVersion?: FileVersion; error?: string }> {
  return fileVersioning.restoreVersion(fileId, version, restoredBy, reason);
}

export async function compareVersions(
  fileId: string,
  fromVersion: number,
  toVersion: number
): Promise<VersionDiff | null> {
  return fileVersioning.compareVersions(fileId, fromVersion, toVersion);
} 