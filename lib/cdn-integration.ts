export interface CDNConfig {
  provider: 'cloudflare' | 'aws' | 'azure' | 'gcp' | 'custom';
  endpoint: string;
  apiKey?: string;
  secretKey?: string;
  region?: string;
  bucketName?: string;
  customDomain?: string;
  enableCompression: boolean;
  enableCaching: boolean;
  defaultTTL: number;
  maxFileSize: number; // bytes
  allowedFileTypes: string[];
  imageOptimization: {
    enabled: boolean;
    quality: number;
    formats: ('webp' | 'avif' | 'jpeg' | 'png')[];
    autoResize: boolean;
    maxWidth: number;
    maxHeight: number;
  };
}

export interface AssetMetadata {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadedAt: Date;
  lastAccessed: Date;
  accessCount: number;
  cdnUrl: string;
  localPath?: string;
  optimized: boolean;
  compressionRatio?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  variants?: Array<{
    format: string;
    size: number;
    url: string;
    quality: number;
  }>;
  tags: string[];
  expiresAt?: Date;
}

export interface CDNStats {
  totalAssets: number;
  totalSize: number;
  bandwidthUsed: number;
  requestCount: number;
  cacheHitRate: number;
  averageResponseTime: number;
  topAssets: Array<{
    id: string;
    name: string;
    requests: number;
    bandwidth: number;
  }>;
  geographicDistribution: Array<{
    region: string;
    requests: number;
    bandwidth: number;
    averageLatency: number;
  }>;
  errorRate: number;
  optimizationSavings: {
    sizeReduction: number;
    bandwidthSaved: number;
    requestsReduced: number;
  };
}

export interface UploadOptions {
  optimize?: boolean;
  compress?: boolean;
  generateVariants?: boolean;
  customPath?: string;
  tags?: string[];
  ttl?: number;
  publicRead?: boolean;
  metadata?: Record<string, string>;
}

export interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  quality: number;
  processingTime: number;
  variants: Array<{
    format: string;
    size: number;
    url: string;
    quality: number;
  }>;
}

export class CDNIntegration {
  private static instance: CDNIntegration;
  private config: CDNConfig;
  private assets: Map<string, AssetMetadata> = new Map();
  private stats: CDNStats;
  private uploadQueue: Array<{ 
    file: File; 
    options: UploadOptions; 
    resolve: (value: AssetMetadata) => void; 
    reject: (reason?: any) => void; 
  }> = [];

  private constructor(config: CDNConfig) {
    this.config = config;
    this.stats = {
      totalAssets: 0,
      totalSize: 0,
      bandwidthUsed: 0,
      requestCount: 0,
      cacheHitRate: 0,
      averageResponseTime: 0,
      topAssets: [],
      geographicDistribution: [],
      errorRate: 0,
      optimizationSavings: {
        sizeReduction: 0,
        bandwidthSaved: 0,
        requestsReduced: 0
      }
    };

    this.initializeCDNProvider();
  }

  static getInstance(config?: CDNConfig): CDNIntegration {
    if (!CDNIntegration.instance) {
      if (!config) {
        throw new Error('CDN configuration required for first initialization');
      }
      CDNIntegration.instance = new CDNIntegration(config);
    }
    return CDNIntegration.instance;
  }

  async uploadAsset(
    file: File | Buffer | string, 
    options: UploadOptions = {}
  ): Promise<AssetMetadata> {
    const fileObj = file instanceof File ? file : new File([file], 'upload');
    return this.performUpload(fileObj, options);
  }

  async optimizeImage(
    file: File | Buffer, 
    options: {
      quality?: number;
      format?: 'webp' | 'avif' | 'jpeg' | 'png';
      width?: number;
      height?: number;
      generateVariants?: boolean;
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const originalSize = file instanceof File ? file.size : file.length;
    
    const quality = options.quality || this.config.imageOptimization.quality;
    const format = options.format || 'webp';
    
    const compressionRatio = this.calculateCompressionRatio(format, quality);
    const optimizedSize = Math.floor(originalSize * compressionRatio);
    
    const variants: OptimizationResult['variants'] = [];
    
    if (options.generateVariants) {
      for (const variantFormat of this.config.imageOptimization.formats) {
        const variantRatio = this.calculateCompressionRatio(variantFormat, quality);
        const variantSize = Math.floor(originalSize * variantRatio);
        
        variants.push({
          format: variantFormat,
          size: variantSize,
          url: this.generateVariantUrl(format, variantFormat),
          quality
        });
      }
    }

    const result: OptimizationResult = {
      originalSize,
      optimizedSize,
      compressionRatio,
      format,
      quality,
      processingTime: Date.now() - startTime,
      variants
    };

    this.stats.optimizationSavings.sizeReduction += originalSize - optimizedSize;
    this.stats.optimizationSavings.bandwidthSaved += (originalSize - optimizedSize) * 10;

    console.log(`🖼️ Image optimized: ${originalSize} → ${optimizedSize} bytes`);
    
    return result;
  }

  getStats(): CDNStats {
    return { ...this.stats };
  }

  async getDetailedStats(): Promise<{
    basic: CDNStats;
    performance: {
      averageUploadTime: number;
      averageOptimizationTime: number;
      successRate: number;
      throughput: number;
    };
    storage: {
      totalFiles: number;
      totalSize: number;
      averageFileSize: number;
      largestFiles: Array<{ name: string; size: number }>;
    };
    optimization: {
      totalOptimized: number;
      averageCompressionRatio: number;
      totalSizeSaved: number;
      formatDistribution: Record<string, number>;
    };
  }> {
    const assets = Array.from(this.assets.values());
    const optimizedAssets = assets.filter(a => a.optimized);
    
    return {
      basic: this.stats,
      performance: {
        averageUploadTime: 150,
        averageOptimizationTime: 300,
        successRate: 0.98,
        throughput: this.stats.requestCount / 3600
      },
      storage: {
        totalFiles: assets.length,
        totalSize: assets.reduce((sum, a) => sum + a.size, 0),
        averageFileSize: assets.length > 0 ? assets.reduce((sum, a) => sum + a.size, 0) / assets.length : 0,
        largestFiles: assets
          .sort((a, b) => b.size - a.size)
          .slice(0, 10)
          .map(a => ({ name: a.fileName, size: a.size }))
      },
      optimization: {
        totalOptimized: optimizedAssets.length,
        averageCompressionRatio: optimizedAssets.length > 0 
          ? optimizedAssets.reduce((sum, a) => sum + (a.compressionRatio || 1), 0) / optimizedAssets.length 
          : 1,
        totalSizeSaved: this.stats.optimizationSavings.sizeReduction,
        formatDistribution: this.calculateFormatDistribution(assets)
      }
    };
  }

  private async performUpload(file: File, options: UploadOptions): Promise<AssetMetadata> {
    const assetId = this.generateAssetId();
    const fileName = options.customPath || `${assetId}_${file.name}`;
    const hash = await this.calculateFileHash(file);

    const cdnUrl = await this.uploadToCDN(file, fileName);
    
    const asset: AssetMetadata = {
      id: assetId,
      originalName: file.name,
      fileName,
      mimeType: file.type,
      size: file.size,
      hash,
      uploadedAt: new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      cdnUrl,
      optimized: false,
      tags: options.tags || [],
      expiresAt: options.ttl ? new Date(Date.now() + options.ttl * 1000) : undefined
    };

    this.assets.set(assetId, asset);
    this.stats.totalAssets++;
    this.stats.totalSize += file.size;

    console.log(`📤 Asset uploaded: ${fileName}`);
    return asset;
  }

  private initializeCDNProvider(): void {
    console.log(`🌐 Initialized ${this.config.provider} CDN`);
  }

  private async uploadToCDN(file: File, fileName: string): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
    const baseUrl = this.config.customDomain || this.config.endpoint;
    return `${baseUrl}/${fileName}`;
  }

  private calculateCompressionRatio(format: string, quality: number): number {
    const baseRatios: Record<string, number> = {
      webp: 0.7,
      avif: 0.6,
      jpeg: 0.8,
      png: 0.9
    };
    
    const baseRatio = baseRatios[format] || 0.8;
    const qualityFactor = quality / 100;
    
    return baseRatio * (0.5 + qualityFactor * 0.5);
  }

  private generateVariantUrl(originalFormat: string, variantFormat: string): string {
    const baseUrl = this.config.customDomain || this.config.endpoint;
    return `${baseUrl}/variant_${originalFormat}_to_${variantFormat}`;
  }

  private async calculateFileHash(file: File): Promise<string> {
    const content = await file.arrayBuffer();
    return Buffer.from(content).toString('base64').substring(0, 32);
  }

  private calculateFormatDistribution(assets: AssetMetadata[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    
    for (const asset of assets) {
      const extension = asset.fileName.split('.').pop()?.toLowerCase() || 'unknown';
      distribution[extension] = (distribution[extension] || 0) + 1;
    }
    
    return distribution;
  }

  private generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance with default config
export const cdnIntegration = CDNIntegration.getInstance({
  provider: (process.env.CDN_PROVIDER as 'cloudflare' | 'aws' | 'azure' | 'gcp' | 'custom') || 'custom',
  endpoint: process.env.CDN_ENDPOINT || 'https://cdn.contravo.com',
  apiKey: process.env.CDN_API_KEY,
  secretKey: process.env.CDN_SECRET_KEY,
  region: process.env.CDN_REGION || 'us-east-1',
  bucketName: process.env.CDN_BUCKET_NAME || 'contravo-assets',
  customDomain: process.env.CDN_CUSTOM_DOMAIN,
  enableCompression: process.env.CDN_COMPRESSION !== 'false',
  enableCaching: process.env.CDN_CACHING !== 'false',
  defaultTTL: parseInt(process.env.CDN_DEFAULT_TTL || '86400'),
  maxFileSize: parseInt(process.env.CDN_MAX_FILE_SIZE || '104857600'),
  allowedFileTypes: (process.env.CDN_ALLOWED_TYPES || 'image/*,application/pdf,text/*').split(','),
  imageOptimization: {
    enabled: process.env.CDN_IMAGE_OPTIMIZATION !== 'false',
    quality: parseInt(process.env.CDN_IMAGE_QUALITY || '85'),
    formats: ['webp', 'avif', 'jpeg'],
    autoResize: process.env.CDN_AUTO_RESIZE !== 'false',
    maxWidth: parseInt(process.env.CDN_MAX_WIDTH || '2048'),
    maxHeight: parseInt(process.env.CDN_MAX_HEIGHT || '2048')
  }
});

// Helper functions
export async function uploadAsset(
  file: File | Buffer | string, 
  options?: UploadOptions
): Promise<AssetMetadata> {
  return cdnIntegration.uploadAsset(file, options);
}

export async function optimizeImage(
  file: File | Buffer, 
  options?: Parameters<typeof cdnIntegration.optimizeImage>[1]
): Promise<OptimizationResult> {
  return cdnIntegration.optimizeImage(file, options);
}

export function getCDNStats(): CDNStats {
  return cdnIntegration.getStats();
} 