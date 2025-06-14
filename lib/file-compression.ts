import zlib from 'zlib';
import { promisify } from 'util';
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
const brotliCompress = promisify(zlib.brotliCompress);
const brotliDecompress = promisify(zlib.brotliDecompress);

export interface CompressionResult {
  success: boolean;
  data?: Buffer;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  algorithm: CompressionAlgorithm;
  error?: string;
}

export interface CompressionOptions {
  algorithm?: CompressionAlgorithm;
  level?: number; // 1-9 for gzip, 0-11 for brotli
  quality?: number; // For image compression (1-100)
  maxSize?: number; // Maximum output size
}

export enum CompressionAlgorithm {
  GZIP = 'gzip',
  BROTLI = 'brotli',
  AUTO = 'auto'
}

export enum FileType {
  TEXT = 'text',
  JSON = 'json',
  XML = 'xml',
  HTML = 'html',
  CSS = 'css',
  JAVASCRIPT = 'javascript',
  IMAGE = 'image',
  DOCUMENT = 'document',
  ARCHIVE = 'archive',
  BINARY = 'binary'
}

export class FileCompression {
  private static instance: FileCompression;

  // Compression level recommendations by file type
  private readonly COMPRESSION_SETTINGS = {
    [FileType.TEXT]: { algorithm: CompressionAlgorithm.BROTLI, level: 6 },
    [FileType.JSON]: { algorithm: CompressionAlgorithm.BROTLI, level: 8 },
    [FileType.XML]: { algorithm: CompressionAlgorithm.BROTLI, level: 7 },
    [FileType.HTML]: { algorithm: CompressionAlgorithm.BROTLI, level: 6 },
    [FileType.CSS]: { algorithm: CompressionAlgorithm.BROTLI, level: 8 },
    [FileType.JAVASCRIPT]: { algorithm: CompressionAlgorithm.BROTLI, level: 8 },
    [FileType.DOCUMENT]: { algorithm: CompressionAlgorithm.GZIP, level: 6 },
    [FileType.BINARY]: { algorithm: CompressionAlgorithm.GZIP, level: 4 },
    [FileType.IMAGE]: { algorithm: CompressionAlgorithm.GZIP, level: 3 },
    [FileType.ARCHIVE]: { algorithm: CompressionAlgorithm.GZIP, level: 1 }
  };

  // File types that typically don't benefit from compression
  private readonly NON_COMPRESSIBLE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/mpeg',
    'audio/mp3',
    'audio/mpeg',
    'application/zip',
    'application/gzip'
  ];

  private constructor() {}

  static getInstance(): FileCompression {
    if (!FileCompression.instance) {
      FileCompression.instance = new FileCompression();
    }
    return FileCompression.instance;
  }

  // Main compression method
  async compressFile(
    data: Buffer,
    mimeType: string,
    options: CompressionOptions = {}
  ): Promise<CompressionResult> {
    try {
      console.log(`🗜️ Compressing file (${data.length} bytes, ${mimeType})`);

      // Check if file type is compressible
      if (!this.isCompressible(mimeType)) {
        return {
          success: false,
          originalSize: data.length,
          compressedSize: data.length,
          compressionRatio: 1,
          algorithm: CompressionAlgorithm.AUTO,
          error: 'File type is not compressible'
        };
      }

      // Determine compression algorithm
      const algorithm = options.algorithm || CompressionAlgorithm.GZIP;
      const level = options.level || 6;

      // Perform compression
      let compressedData: Buffer;
      
      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          compressedData = await gzip(data, { level });
          break;
        case CompressionAlgorithm.BROTLI:
          compressedData = await brotliCompress(data, {
            params: {
              [zlib.constants.BROTLI_PARAM_QUALITY]: level
            }
          });
          break;
        default:
          throw new Error(`Unsupported compression algorithm: ${algorithm}`);
      }

      const compressionRatio = compressedData.length / data.length;

      // Check if compression is beneficial
      if (compressionRatio > 0.95) {
        console.log(`⚠️ Compression not beneficial (ratio: ${compressionRatio.toFixed(2)})`);
        return {
          success: false,
          originalSize: data.length,
          compressedSize: data.length,
          compressionRatio: 1,
          algorithm,
          error: 'Compression not beneficial'
        };
      }

      console.log(`✅ Compression successful: ${data.length} → ${compressedData.length} bytes (${(compressionRatio * 100).toFixed(1)}%)`);

      return {
        success: true,
        data: compressedData,
        originalSize: data.length,
        compressedSize: compressedData.length,
        compressionRatio,
        algorithm
      };

    } catch (_error) {
      console.error('❌ Error compressing file:');
      return {
        success: false,
        originalSize: data.length,
        compressedSize: data.length,
        compressionRatio: 1,
        algorithm: CompressionAlgorithm.AUTO,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Decompress file
  async decompressFile(
    compressedData: Buffer,
    algorithm: CompressionAlgorithm
  ): Promise<{ success: boolean; data?: Buffer; error?: string }> {
    try {
      console.log(`🗜️ Decompressing file (${compressedData.length} bytes, ${algorithm})`);

      let decompressedData: Buffer;

      switch (algorithm) {
        case CompressionAlgorithm.GZIP:
          decompressedData = await gunzip(compressedData);
          break;
        case CompressionAlgorithm.BROTLI:
          decompressedData = await brotliDecompress(compressedData);
          break;
        default:
          return { success: false, error: `Unsupported decompression algorithm: ${algorithm}` };
      }

      console.log(`✅ Decompression successful: ${compressedData.length} → ${decompressedData.length} bytes`);

      return {
        success: true,
        data: decompressedData
      };

    } catch (_error) {
      console.error('❌ Error decompressing file:');
      return {
        success: false,
        error: _error instanceof Error ? _error.message : 'Unknown error'
      };
    }
  }

  // Batch compression for multiple files
  async compressFiles(
    files: Array<{ data: Buffer; mimeType: string; name: string }>,
    options: CompressionOptions = {}
  ): Promise<Array<CompressionResult & { name: string }>> {
    console.log(`🗜️ Batch compressing ${files.length} files`);

    const results = await Promise.all(
      files.map(async (file) => {
        const result = await this.compressFile(file.data, file.mimeType, options);
        return { ...result, name: file.name };
      })
    );

    const successful = results.filter(r => r.success).length;
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const overallRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;

    console.log(`✅ Batch compression complete: ${successful}/${files.length} files, overall ratio: ${(overallRatio * 100).toFixed(1)}%`);

    return results;
  }

  // Get compression statistics
  getCompressionStats(results: CompressionResult[]): {
    totalFiles: number;
    successfulCompressions: number;
    totalOriginalSize: number;
    totalCompressedSize: number;
    overallCompressionRatio: number;
    averageCompressionRatio: number;
    spaceSaved: number;
    spaceSavedPercentage: number;
  } {
    const totalFiles = results.length;
    const successfulCompressions = results.filter(r => r.success).length;
    const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0);
    const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0);
    const overallCompressionRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;
    const averageCompressionRatio = successfulCompressions > 0 
      ? results.filter(r => r.success).reduce((sum, r) => sum + r.compressionRatio, 0) / successfulCompressions 
      : 1;
    const spaceSaved = totalOriginalSize - totalCompressedSize;
    const spaceSavedPercentage = totalOriginalSize > 0 ? (spaceSaved / totalOriginalSize) * 100 : 0;

    return {
      totalFiles,
      successfulCompressions,
      totalOriginalSize,
      totalCompressedSize,
      overallCompressionRatio,
      averageCompressionRatio,
      spaceSaved,
      spaceSavedPercentage
    };
  }

  // Check if file type is compressible
  isCompressible(mimeType: string): boolean {
    return !this.NON_COMPRESSIBLE_TYPES.some(type => mimeType.includes(type));
  }

  // Estimate compression ratio without actually compressing
  estimateCompressionRatio(data: Buffer, mimeType: string): number {
    if (!this.isCompressible(mimeType)) {
      return 1;
    }

    // Simple estimation based on entropy
    const entropy = this.calculateEntropy(data);
    
    if (entropy < 4) {
      return 0.3; // High compression
    } else if (entropy < 6) {
      return 0.6; // Medium compression
    } else {
      return 0.8; // Low compression
    }
  }

  private calculateEntropy(data: Buffer): number {
    const frequency: { [key: number]: number } = {};
    const length = data.length;

    // Count byte frequencies
    for (let i = 0; i < length; i++) {
      const byte = data[i];
      frequency[byte] = (frequency[byte] || 0) + 1;
    }

    // Calculate entropy
    let entropy = 0;
    for (const count of Object.values(frequency)) {
      const probability = count / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy;
  }

  // Advanced compression methods for specific file types
  async compressText(text: string, options: CompressionOptions = {}): Promise<CompressionResult> {
    const data = Buffer.from(text, 'utf-8');
    return this.compressFile(data, 'text/plain', {
      algorithm: CompressionAlgorithm.BROTLI,
      level: 8,
      ...options
    });
  }

  async compressJSON(jsonData: object, options: CompressionOptions = {}): Promise<CompressionResult> {
    const jsonString = JSON.stringify(jsonData);
    const data = Buffer.from(jsonString, 'utf-8');
    return this.compressFile(data, 'application/json', {
      algorithm: CompressionAlgorithm.BROTLI,
      level: 9,
      ...options
    });
  }

  // Compression quality analysis
  analyzeCompressionQuality(original: Buffer, compressed: Buffer): {
    compressionRatio: number;
    spaceSaved: number;
    efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    recommendation: string;
  } {
    const compressionRatio = compressed.length / original.length;
    const spaceSaved = original.length - compressed.length;
    
    let efficiency: 'excellent' | 'good' | 'fair' | 'poor';
    let recommendation: string;

    if (compressionRatio < 0.3) {
      efficiency = 'excellent';
      recommendation = 'Compression is highly effective for this file type.';
    } else if (compressionRatio < 0.6) {
      efficiency = 'good';
      recommendation = 'Compression provides good space savings.';
    } else if (compressionRatio < 0.8) {
      efficiency = 'fair';
      recommendation = 'Compression provides moderate space savings.';
    } else {
      efficiency = 'poor';
      recommendation = 'Consider alternative compression methods or skip compression.';
    }

    return {
      compressionRatio,
      spaceSaved,
      efficiency,
      recommendation
    };
  }
}

// Export singleton instance
export const fileCompression = FileCompression.getInstance();

// Helper functions
export async function compressFile(
  data: Buffer,
  mimeType: string,
  options?: CompressionOptions
): Promise<CompressionResult> {
  return fileCompression.compressFile(data, mimeType, options);
}

export async function decompressFile(
  compressedData: Buffer,
  algorithm: CompressionAlgorithm
): Promise<{ success: boolean; data?: Buffer; error?: string }> {
  return fileCompression.decompressFile(compressedData, algorithm);
}

export function isCompressible(mimeType: string): boolean {
  return fileCompression.isCompressible(mimeType);
}

export function estimateCompressionRatio(data: Buffer, mimeType: string): number {
  return fileCompression.estimateCompressionRatio(data, mimeType);
} 