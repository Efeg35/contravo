// import prisma from './prisma'; // Will be used when database integration is added
import { FileStorage } from './file-storage';
import { FileCompression } from './file-compression';
import { FileVersioning } from './file-versioning';
import crypto from 'crypto';
import path from 'path';
import { Readable } from 'stream';
export interface FileMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  isPublic: boolean;
  tags: string[];
  description?: string;
  category: FileCategory;
  storageProvider: StorageProvider;
  storagePath: string;
  thumbnailPath?: string;
  compressedPath?: string;
  versions: FileVersion[];
  downloadCount: number;
  virusScanned: boolean;
  virusScanResult?: 'clean' | 'infected' | 'suspicious';
  metadata: Record<string, unknown>;
}

export interface FileVersion {
  id: string;
  version: number;
  fileName: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  uploadedBy: string;
  changeDescription?: string;
  storagePath: string;
}

export interface FileUploadOptions {
  category?: FileCategory;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
  generateThumbnail?: boolean;
  compress?: boolean;
  virusScan?: boolean;
  maxSize?: number;
  allowedMimeTypes?: string[];
}

export interface FileUploadResult {
  success: boolean;
  fileId?: string;
  fileName?: string;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
  warnings?: string[];
}

export interface ChunkUploadInfo {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  fileName: string;
  totalSize: number;
}

export enum FileCategory {
  DOCUMENT = 'DOCUMENT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  ARCHIVE = 'ARCHIVE',
  CONTRACT = 'CONTRACT',
  TEMPLATE = 'TEMPLATE',
  SIGNATURE = 'SIGNATURE',
  AVATAR = 'AVATAR',
  OTHER = 'OTHER'
}

export enum StorageProvider {
  AWS_S3 = 'AWS_S3',
  GOOGLE_CLOUD = 'GOOGLE_CLOUD',
  AZURE_BLOB = 'AZURE_BLOB',
  LOCAL = 'LOCAL'
}

export enum FilePermission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  SHARE = 'share'
}

class FileManager {
  private static instance: FileManager;
  private storage: FileStorage;
  private compression: FileCompression;
  private versioning: FileVersioning;
  private activeUploads: Map<string, ChunkUploadInfo> = new Map();

  // File size limits (in bytes)
  private readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private readonly MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly THUMBNAIL_SIZE = { width: 300, height: 300 };

  // Allowed MIME types by category
  private readonly ALLOWED_MIME_TYPES = {
    [FileCategory.DOCUMENT]: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    [FileCategory.IMAGE]: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ]
  };

  private constructor() {
    this.storage = FileStorage.getInstance();
    this.compression = FileCompression.getInstance();
    this.versioning = FileVersioning.getInstance();
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  // Upload single file
  async uploadFile(
    file: Buffer | Readable,
    originalName: string,
    mimeType: string,
    uploadedBy: string,
    options: FileUploadOptions = {}
  ): Promise<FileUploadResult> {
    try {
      console.log(`📁 Starting file upload: ${originalName}`);

      // Validate file
      const fileBuffer = Buffer.isBuffer(file) ? file : await this.streamToBuffer(file);
      const validation = await this.validateFile(fileBuffer, originalName, mimeType, options);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Generate file metadata
      const hash = this.generateFileHash(fileBuffer);
      const fileName = this.generateFileName(originalName, hash);
      const category = options.category || this.detectFileCategory(mimeType);

      // Check for duplicate files
      const existingFile = await this.findFileByHash(hash);
      if (existingFile && !options.compress) {
        return {
          success: true,
          fileId: existingFile.id,
          fileName: existingFile.fileName,
          size: existingFile.size,
          url: await this.storage.getFileUrl(existingFile.storagePath),
          warnings: ['File already exists, returning existing file']
        };
      }

      // Virus scan if enabled
      if (options.virusScan) {
        const scanResult = await this.performVirusScan(fileBuffer);
        if (scanResult !== 'clean') {
          return { 
            success: false, 
            error: `File failed virus scan: ${scanResult}` 
          };
        }
      }

      // Compress file if requested
      let processedBuffer = fileBuffer;
      let compressedPath: string | undefined;
      if (options.compress && this.isCompressible(mimeType)) {
        const compressed = await this.compression.compressFile(fileBuffer, mimeType);
        if (compressed.success && compressed.data) {
          processedBuffer = compressed.data;
          compressedPath = `compressed/${fileName}`;
        }
      }

      // Upload to storage
      const storagePath = `files/${category.toLowerCase()}/${fileName}`;
      const uploadResult = await this.storage.uploadFile(
        processedBuffer,
        storagePath,
        mimeType
      );

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Generate thumbnail for images
      let thumbnailPath: string | undefined;
      if (options.generateThumbnail && category === FileCategory.IMAGE) {
        const thumbnail = await this.generateThumbnail(fileBuffer, mimeType);
        if (thumbnail) {
          thumbnailPath = `thumbnails/${fileName}`;
          await this.storage.uploadFile(thumbnail, thumbnailPath, 'image/jpeg');
        }
      }

      // Create file metadata
      const fileMetadata: FileMetadata = {
        id: this.generateFileId(),
        originalName,
        fileName,
        mimeType,
        size: processedBuffer.length,
        hash,
        uploadedBy,
        uploadedAt: new Date(),
        lastModified: new Date(),
        isPublic: options.isPublic || false,
        tags: options.tags || [],
        description: options.description,
        category,
        storageProvider: this.storage.getProvider(),
        storagePath,
        thumbnailPath,
        compressedPath,
        versions: [],
        downloadCount: 0,
        virusScanned: options.virusScan || false,
        virusScanResult: options.virusScan ? 'clean' : undefined,
        metadata: {
          originalSize: fileBuffer.length,
          compressedSize: processedBuffer.length,
          compressionRatio: fileBuffer.length > 0 ? processedBuffer.length / fileBuffer.length : 1
        }
      };

      // Save to database
      await this.saveFileMetadata(fileMetadata);

      // Create initial version
      await this.versioning.createVersion(fileMetadata.id, {
        fileName,
        size: processedBuffer.length,
        hash,
        uploadedBy,
        storagePath,
        changeDescription: 'Initial upload'
      });

      console.log(`✅ File uploaded successfully: ${fileMetadata.id}`);

      return {
        success: true,
        fileId: fileMetadata.id,
        fileName: fileMetadata.fileName,
        size: fileMetadata.size,
        url: uploadResult.url,
        thumbnailUrl: thumbnailPath ? await this.storage.getFileUrl(thumbnailPath) : undefined
      };

    } catch {
      console.error('❌ File operation error:', _error);
      throw _error;
    }
  }

  // Start chunked upload for large files
  async startChunkedUpload(
    fileName: string,
    totalSize: number,
    mimeType: string,
    uploadedBy: string,
    chunkSize: number = this.MAX_CHUNK_SIZE,
    options: FileUploadOptions = {}
  ): Promise<{ success: boolean; uploadId?: string; error?: string }> {
    try {
      // Validate file size
      if (totalSize > (options.maxSize || this.MAX_FILE_SIZE)) {
        return { success: false, error: 'File too large' };
      }

      const uploadId = this.generateUploadId();
      const totalChunks = Math.ceil(totalSize / chunkSize);

      const chunkInfo: ChunkUploadInfo = {
        uploadId,
        chunkIndex: 0,
        totalChunks,
        chunkSize,
        fileName,
        totalSize
      };

      this.activeUploads.set(uploadId, chunkInfo);

      console.log(`📁 Started chunked upload: ${uploadId} (${totalChunks} chunks)`);

      return { success: true, uploadId };
    } catch {
      console.error('❌ Error starting chunked upload:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Upload file chunk
  async uploadChunk(
    uploadId: string,
    chunkIndex: number,
    chunkData: Buffer
  ): Promise<{ success: boolean; isComplete?: boolean; error?: string }> {
    try {
      const uploadInfo = this.activeUploads.get(uploadId);
      if (!uploadInfo) {
        return { success: false, error: 'Upload session not found' };
      }

      // Store chunk temporarily
      const chunkPath = `temp/${uploadId}/chunk_${chunkIndex}`;
      const uploadResult = await this.storage.uploadFile(
        chunkData,
        chunkPath,
        'application/octet-stream'
      );

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error };
      }

      // Update upload info
      uploadInfo.chunkIndex = Math.max(uploadInfo.chunkIndex, chunkIndex + 1);

      // Check if all chunks are uploaded
      const isComplete = uploadInfo.chunkIndex >= uploadInfo.totalChunks;

      if (isComplete) {
        // Combine chunks and create final file
        await this.combineChunks(uploadId);
      }

      return { success: true, isComplete };
    } catch {
      console.error('❌ Error uploading chunk:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Download file
  async downloadFile(
    fileId: string,
    userId: string,
    version?: number
  ): Promise<{ success: boolean; data?: Buffer; fileName?: string; mimeType?: string; error?: string }> {
    try {
      // Get file metadata
      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        return { success: false, error: 'File not found' };
      }

      // Check permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, FilePermission.READ);
      if (!hasPermission) {
        return { success: false, error: 'Access denied' };
      }

      // Get file path (version or current)
      let storagePath = fileMetadata.storagePath;
      if (version) {
        const versionInfo = await this.versioning.getVersion(fileId, version);
        if (versionInfo) {
          storagePath = versionInfo.storagePath;
        }
      }

      // Download from storage
      const downloadResult = await this.storage.downloadFile(storagePath);
      if (!downloadResult.success) {
        return { success: false, error: downloadResult.error };
      }

      // Update download count
      await this.incrementDownloadCount(fileId);

      console.log(`📁 File downloaded: ${fileId} by ${userId}`);

      return {
        success: true,
        data: downloadResult.data,
        fileName: fileMetadata.originalName,
        mimeType: fileMetadata.mimeType
      };

    } catch {
      console.error('❌ Error downloading file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Delete file
  async deleteFile(fileId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check permissions
      const hasPermission = await this.checkFilePermission(fileId, userId, FilePermission.DELETE);
      if (!hasPermission) {
        return { success: false, error: 'Access denied' };
      }

      const fileMetadata = await this.getFileMetadata(fileId);
      if (!fileMetadata) {
        return { success: false, error: 'File not found' };
      }

      // Delete from storage
      await this.storage.deleteFile(fileMetadata.storagePath);
      
      // Delete thumbnail if exists
      if (fileMetadata.thumbnailPath) {
        await this.storage.deleteFile(fileMetadata.thumbnailPath);
      }

      // Delete compressed version if exists
      if (fileMetadata.compressedPath) {
        await this.storage.deleteFile(fileMetadata.compressedPath);
      }

      // Delete all versions
      for (const version of fileMetadata.versions) {
        await this.storage.deleteFile(version.storagePath);
      }

      // Delete from database
      await this.deleteFileMetadata(fileId);

      console.log(`🗑️ File deleted: ${fileId}`);

      return { success: true };
    } catch {
      console.error('❌ Error deleting file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Get file metadata
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      // In real implementation, get from database
      console.log(`📂 Getting file metadata: ${fileId}`);
      return null; // Mock implementation
    } catch {
      console.error('❌ Error getting file metadata:');
      return null;
    }
  }

  // List user files
  async listUserFiles(
    userId: string,
    options: {
      category?: FileCategory;
      tags?: string[];
      search?: string;
      page?: number;
      limit?: number;
      sortBy?: 'name' | 'date' | 'size';
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<{
    files: FileMetadata[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = options.page || 1;
      // const limit = options.limit || 20; // Will be used when database pagination is implemented
      // const offset = (page - 1) * limit; // Will be used when database pagination is implemented

      // In real implementation, query database with filters
      console.log(`📂 Listing files for user ${userId}:`, options);

      // Mock response
      return {
        files: [],
        total: 0,
        page,
        totalPages: 0
      };
    } catch {
      console.error('❌ Error listing files:', _error);
      throw _error;
    }
  }

  // Private helper methods
  private async validateFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    options: FileUploadOptions
  ): Promise<{ valid: boolean; error?: string }> {
    // Check file size
    const maxSize = options.maxSize || this.MAX_FILE_SIZE;
    
    if (file.length > maxSize) {
      return { valid: false, error: `File too large. Maximum size: ${maxSize} bytes` };
    }

    // Check MIME type
    const allowedTypes = options.allowedMimeTypes || this.getAllowedMimeTypes(options.category);
    if (allowedTypes && !allowedTypes.includes(mimeType)) {
      return { valid: false, error: `File type not allowed: ${mimeType}` };
    }

    return { valid: true };
  }

  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private generateFileName(originalName: string, hash: string): string {
    const extension = path.extname(originalName);
    const timestamp = Date.now();
    return `${hash.substring(0, 8)}_${timestamp}${extension}`;
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectFileCategory(mimeType: string): FileCategory {
    if (mimeType.startsWith('image/')) return FileCategory.IMAGE;
    if (mimeType.startsWith('video/')) return FileCategory.VIDEO;
    if (mimeType.startsWith('audio/')) return FileCategory.AUDIO;
    if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return FileCategory.DOCUMENT;
    }
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) {
      return FileCategory.ARCHIVE;
    }
    return FileCategory.OTHER;
  }

  private getAllowedMimeTypes(category?: FileCategory): string[] | undefined {
    if (!category) return undefined;
    return this.ALLOWED_MIME_TYPES[category as keyof typeof this.ALLOWED_MIME_TYPES];
  }

  private isCompressible(mimeType: string): boolean {
    // Don't compress already compressed formats
    const nonCompressible = [
      'image/jpeg',
      'image/png',
      'video/',
      'audio/',
      'application/zip',
      'application/gzip'
    ];

    return !nonCompressible.some(type => mimeType.includes(type));
  }

  private async performVirusScan(buffer: Buffer): Promise<'clean' | 'infected' | 'suspicious'> {
    // Mock virus scan - in real implementation, integrate with ClamAV or similar
    console.log('🔍 Performing virus scan...');
    
    // Simple check for suspicious patterns
    const suspiciousPatterns = [
      Buffer.from('EICAR-STANDARD-ANTIVIRUS-TEST-FILE')
    ];

    for (const pattern of suspiciousPatterns) {
      if (buffer.includes(pattern)) {
        return 'infected';
      }
    }

    return 'clean';
  }

  private async generateThumbnail(buffer: Buffer, mimeType: string): Promise<Buffer | null> {
    try {
      // Mock thumbnail generation - in real implementation, use Sharp or similar
      console.log('🖼️ Generating thumbnail...');
      
      if (!mimeType.startsWith('image/')) {
        return null;
      }

      // Return original buffer as mock thumbnail
      return buffer;
    } catch {
      console.error('❌ Error generating thumbnail:');
      return null;
    }
  }

  private async findFileByHash(hash: string): Promise<FileMetadata | null> {
    // In real implementation, query database
    console.log(`🔍 Looking for file with hash: ${hash}`);
    return null;
  }

  private async combineChunks(uploadId: string): Promise<void> {
    const uploadInfo = this.activeUploads.get(uploadId);
    if (!uploadInfo) return;

    console.log(`🔗 Combining chunks for upload: ${uploadId}`);

    // In real implementation, combine chunks from storage
    // For now, just clean up
    this.activeUploads.delete(uploadId);
  }

  private async checkFilePermission(
    fileId: string,
    userId: string,
    permission: FilePermission
  ): Promise<boolean> {
    // In real implementation, check database permissions
    console.log(`🔐 Checking ${permission} permission for file ${fileId} and user ${userId}`);
    return true; // Mock implementation
  }

  private async incrementDownloadCount(fileId: string): Promise<void> {
    // In real implementation, update database
    console.log(`📊 Incrementing download count for file: ${fileId}`);
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    // In real implementation, save to database
    console.log('💾 Saving file metadata:', metadata.id);
  }

  private async deleteFileMetadata(fileId: string): Promise<void> {
    // In real implementation, delete from database
    console.log('🗑️ Deleting file metadata:', fileId);
  }
}

// Singleton instance
export const fileManager = FileManager.getInstance();

// Helper functions
export async function uploadFile(
  file: Buffer | Readable,
  originalName: string,
  mimeType: string,
  uploadedBy: string,
  options?: FileUploadOptions
): Promise<FileUploadResult> {
  return fileManager.uploadFile(file, originalName, mimeType, uploadedBy, options);
}

export async function downloadFile(
  fileId: string,
  userId: string,
  version?: number
): Promise<{ success: boolean; data?: Buffer; fileName?: string; mimeType?: string; error?: string }> {
  return fileManager.downloadFile(fileId, userId, version);
}

export async function deleteFile(fileId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  return fileManager.deleteFile(fileId, userId);
}

export async function getFileMetadata(fileId: string): Promise<FileMetadata | null> {
  return fileManager.getFileMetadata(fileId);
} 