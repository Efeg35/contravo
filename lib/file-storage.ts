import fs from 'fs/promises';
import path from 'path';
export interface StorageResult {
  success: boolean;
  url?: string;
  error?: string;
  data?: Buffer;
}

export enum StorageProvider {
  LOCAL = 'LOCAL'
}

export class FileStorage {
  private static instance: FileStorage;
  private provider: StorageProvider;
  private basePath: string;
  private baseUrl: string;

  private constructor() {
    this.provider = StorageProvider.LOCAL;
    this.basePath = process.env.LOCAL_STORAGE_PATH || './uploads';
    this.baseUrl = process.env.LOCAL_STORAGE_URL || 'http://localhost:3000/uploads';
  }

  static getInstance(): FileStorage {
    if (!FileStorage.instance) {
      FileStorage.instance = new FileStorage();
    }
    return FileStorage.instance;
  }

  getProvider(): StorageProvider {
    return this.provider;
  }

  // Upload file to storage
  async uploadFile(
    data: Buffer,
    filePath: string,
    mimeType: string,
    options: {
      isPublic?: boolean;
      metadata?: Record<string, string>;
      cacheControl?: string;
    } = {}
  ): Promise<StorageResult> {
    try {
      console.log(`☁️ Uploading file to ${this.provider}: ${filePath}`);

      const fullPath = path.join(this.basePath, filePath);
      const directory = path.dirname(fullPath);

      // Ensure directory exists
      await fs.mkdir(directory, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, data);

      // Save metadata if provided
      if (options.metadata) {
        const metadataPath = `${fullPath}.meta`;
        await fs.writeFile(metadataPath, JSON.stringify({
          mimeType,
          metadata: options.metadata,
          uploadedAt: new Date().toISOString()
        }));
      }

      return {
        success: true,
        url: this.getLocalUrl(filePath)
      };
    } catch (_error) {
      console.error('❌ Error uploading file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Download file from storage
  async downloadFile(filePath: string): Promise<StorageResult> {
    try {
      console.log(`☁️ Downloading file from ${this.provider}: ${filePath}`);

      const fullPath = path.join(this.basePath, filePath);
      const data = await fs.readFile(fullPath);
      
      return {
        success: true,
        data
      };
    } catch (_error) {
      console.error('❌ Error downloading file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Delete file from storage
  async deleteFile(filePath: string): Promise<StorageResult> {
    try {
      console.log(`☁️ Deleting file from ${this.provider}: ${filePath}`);

      const fullPath = path.join(this.basePath, filePath);
      const metadataPath = `${fullPath}.meta`;

      // Delete file
      await fs.unlink(fullPath);

      // Delete metadata if exists
      try {
        await fs.unlink(metadataPath);
      } catch (_error) {
        // Metadata file might not exist
      }
      
      return { success: true };
    } catch (_error) {
      console.error('❌ Error deleting file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Get file URL
  async getFileUrl(
    filePath: string
  ): Promise<string> {
    return this.getLocalUrl(filePath);
  }

  // Check if file exists
  async fileExists(filePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      await fs.access(fullPath);
      return true;
    } catch (_error) {
      return false;
    }
  }

  // Get file metadata
  async getFileInfo(filePath: string): Promise<{
    size: number;
    lastModified: Date;
    contentType: string;
    metadata?: Record<string, string>;
  } | null> {
    try {
      const fullPath = path.join(this.basePath, filePath);
      const stats = await fs.stat(fullPath);
      
      // Try to read metadata
      let metadata: Record<string, string> = {};
      let contentType = 'application/octet-stream';
      
      try {
        const metadataPath = `${fullPath}.meta`;
        const metadataContent = await fs.readFile(metadataPath, 'utf-8');
        const metadataObj = JSON.parse(metadataContent);
        metadata = metadataObj.metadata || {};
        contentType = metadataObj.mimeType || contentType;
      } catch (_error) {
        // Metadata file doesn't exist or is invalid
      }

      return {
        size: stats.size,
        lastModified: stats.mtime,
        contentType,
        metadata
      };
    } catch (_error) {
      return null;
    }
  }

  private getLocalUrl(filePath: string): string {
    return `${this.baseUrl}/${filePath}`;
  }
}

// Export singleton instance
export const fileStorage = FileStorage.getInstance(); 