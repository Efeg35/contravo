export interface CacheConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
  defaultTTL: number;
  maxMemory?: string;
  evictionPolicy?: 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu' | 'allkeys-random' | 'volatile-random' | 'volatile-ttl' | 'noeviction';
  compressionThreshold: number;
  enableCompression: boolean;
  enableL1Cache: boolean;
  l1CacheSize: number;
  l1CacheTTL: number;
  enableMetrics: boolean;
  enableHealthCheck: boolean;
  healthCheckInterval: number;
  retryAttempts: number;
  retryDelay: number;
  connectionTimeout: number;
  commandTimeout: number;
}

export interface CacheEntry<T = unknown> {
  key: string;
  value: T;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  accessCount: number;
  size: number;
  compressed: boolean;
  tags: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalKeys: number;
  memoryUsage: number;
  evictions: number;
  connections: number;
  operations: {
    get: number;
    set: number;
    delete: number;
    flush: number;
  };
  l1Cache?: {
    hits: number;
    misses: number;
    size: number;
    hitRate: number;
  };
  performance: {
    averageGetTime: number;
    averageSetTime: number;
    slowOperations: number;
  };
}

export interface CachePattern {
  pattern: string;
  description: string;
  ttl?: number;
  tags?: string[];
}

export interface CacheWarmupConfig {
  patterns: CachePattern[];
  batchSize: number;
  concurrency: number;
  priority: 'low' | 'normal' | 'high';
}

interface MockRedisClient {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string, ttl?: number) => Promise<void>;
  setex: (key: string, ttl: number, value: string) => Promise<void>;
  del: (...keys: string[]) => Promise<number>;
  exists: (key: string) => Promise<number>;
  keys: (pattern: string) => Promise<string[]>;
  flushall: () => Promise<void>;
  info: () => Promise<string>;
  quit: () => Promise<void>;
  ttl: (key: string) => Promise<number>;
  expire: (key: string, ttl: number) => Promise<number>;
}

export class RedisCache {
  private static instance: RedisCache;
  private config: CacheConfig;
  private client!: MockRedisClient; // Initialized in constructor
  private l1Cache: Map<string, { value: any; expires: number; size: number; tags?: string[] }> = new Map();
  private stats: CacheStats;
  private compressionEnabled: boolean;
  private healthCheckInterval?: NodeJS.Timeout;
  private readonly COMPRESSION_THRESHOLD: number;
  private readonly MAX_L1_CACHE_SIZE: number;

  private constructor(config: CacheConfig) {
    this.config = config;
    this.compressionEnabled = config.enableCompression;
    this.COMPRESSION_THRESHOLD = config.compressionThreshold;
    this.MAX_L1_CACHE_SIZE = config.l1CacheSize;
    
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      evictions: 0,
      connections: 0,
      operations: {
        get: 0,
        set: 0,
        delete: 0,
        flush: 0
      },
      l1Cache: config.enableL1Cache ? {
        hits: 0,
        misses: 0,
        size: 0,
        hitRate: 0
      } : undefined,
      performance: {
        averageGetTime: 0,
        averageSetTime: 0,
        slowOperations: 0
      }
    };

    this.initializeClient();
    
    if (config.enableHealthCheck) {
      this.startHealthCheck();
    }
  }

  static getInstance(config?: CacheConfig): RedisCache {
    if (!RedisCache.instance) {
      if (!config) {
        throw new Error('Cache configuration required for first initialization');
      }
      RedisCache.instance = new RedisCache(config);
    }
    return RedisCache.instance;
  }

  async get<T = unknown>(key: string, options: { 
    useL1?: boolean; 
    updateStats?: boolean;
    deserializer?: (value: string) => T;
  } = {}): Promise<T | null> {
    const fullKey = this.buildKey(key);
    const useL1 = options.useL1 !== false && this.config.enableL1Cache;
    const updateStats = options.updateStats !== false;

    try {
      // Check L1 cache first
      if (useL1) {
        const l1Entry = this.l1Cache.get(fullKey);
        if (l1Entry && l1Entry.expires > Date.now()) {
          if (updateStats && this.stats.l1Cache) {
            this.stats.l1Cache.hits++;
            this.updateL1HitRate();
          }
          return l1Entry.value as T;
        }
      }

      // Check Redis
      const value = await this.client.get(fullKey);
      
      if (value === null) {
        if (updateStats) {
          this.stats.misses++;
          this.updateHitRate();
          if (useL1 && this.stats.l1Cache) {
            this.stats.l1Cache.misses++;
            this.updateL1HitRate();
          }
        }
        return null;
      }

      // Deserialize value
      let deserializedValue: T;
      try {
        if (options.deserializer) {
          deserializedValue = options.deserializer(value);
        } else {
          deserializedValue = this.deserializeValue<T>(value);
        }
      } catch (error) {
        console.error(`Cache deserialization error for key ${key}:`);
        return null;
      }

      // Update L1 cache
      if (useL1) {
        this.setL1Cache(fullKey, deserializedValue, this.config.l1CacheTTL);
      }

      if (updateStats) {
        this.stats.hits++;
        this.stats.operations.get++;
        this.updateHitRate();
      }

      return deserializedValue;

    } catch (error) {
      console.error(`Cache get error for key ${key}:`);
      if (updateStats) {
        this.stats.misses++;
        this.updateHitRate();
      }
      return null;
    }
  }

  async set<T = unknown>(key: string, value: T, options: {
    ttl?: number;
    tags?: string[];
    compress?: boolean;
    pattern?: string;
    priority?: 'high' | 'medium' | 'low';
    updateLocal?: boolean;
  } = {}): Promise<boolean> {
    const fullKey = this.buildKey(key);
    
    try {
      const serializedValue = JSON.stringify(value);
      const shouldCompress = options.compress !== false && 
                           serializedValue.length > this.COMPRESSION_THRESHOLD;
      
      let finalValue = value;
      let compressed = false;
      
      if (shouldCompress) {
        const compressedValue = this.compress(value);
        const compressionRatio = JSON.stringify(compressedValue).length / serializedValue.length;
        
        if (compressionRatio < 0.8) {
          finalValue = compressedValue as T;
          compressed = true;
        }
      }

      const ttl = options.ttl ?? this.config.defaultTTL;
      await this.client.setex(fullKey, ttl, JSON.stringify(finalValue));

      // Update L1 cache if enabled
      if (options.updateLocal !== false && this.config.enableL1Cache) {
        this.setL1Cache(fullKey, finalValue, ttl);
      }

      // Track pattern if specified
      if (options.pattern) {
        this.trackPattern(fullKey, options.pattern);
      }

      if (this.stats) {
        this.stats.operations.set++;
      }

      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`);
      return false;
    }
  }

  async delete(key: string | string[]): Promise<number> {
    // Performance tracking for future use
    // const startTime = Date.now();
    const keys = Array.isArray(key) ? key : [key];
    const fullKeys = keys.map(k => this.buildKey(k));
    
    try {
      // Delete from Redis
      const deletedCount = await this.client.del(...fullKeys);
      
      // Delete from local cache
      for (const fullKey of fullKeys) {
        this.l1Cache.delete(fullKey);
      }

      this.stats.operations.delete++;
      this.updateHitRate();
      return deletedCount;

    } catch (error) {
      console.error(`Cache delete error:`);
      return 0;
    }
  }

  async invalidateByTags(tags: string[]): Promise<number> {
    // Performance tracking for future use
    // const startTime = Date.now();
    let deletedCount = 0;
    
    try {
      // Find keys by tags in local cache
      const localKeysToDelete: string[] = [];
      for (const [key, entry] of this.l1Cache) {
        if (entry.tags?.some((tag: string) => tags.includes(tag))) {
          localKeysToDelete.push(key);
        }
      }

      // Delete from local cache
      for (const key of localKeysToDelete) {
        this.l1Cache.delete(key);
        deletedCount++;
      }

      // For Redis, we need to scan for keys with tags
      // In production, you'd use Redis modules like RediSearch for tag-based operations
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.client.keys(pattern);
      
      for (const key of keys) {
        try {
          const value = await this.client.get(key);
          if (value) {
            const cacheData = JSON.parse(value);
            if (cacheData.tags && cacheData.tags.some((tag: string) => tags.includes(tag))) {
              await this.client.del(key);
              deletedCount++;
            }
          }
        } catch (error) {
          console.error(`Error checking key ${key} for tags:`);
        }
      }

      console.log(`🗑️ Invalidated ${deletedCount} cache entries by tags: ${tags.join(', ')}`);
      return deletedCount;

    } catch (error) {
      console.error('Tag-based invalidation error:');
      return deletedCount;
    }
  }

  async invalidateByPattern(pattern: string): Promise<number> {
    // Performance tracking for future use
    // const startTime = Date.now();
    
    try {
      const fullPattern = this.buildKey(pattern);
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length === 0) return 0;
      
      const deletedCount = await this.client.del(...keys);
      
      // Also clear from local cache
      for (const key of keys) {
        this.l1Cache.delete(key);
      }

      console.log(`🗑️ Invalidated ${deletedCount} cache entries by pattern: ${pattern}`);
      return deletedCount;

    } catch (error) {
      console.error('Pattern-based invalidation error:');
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullKey = this.buildKey(key);
    
    // Check local cache first
    if (this.l1Cache.has(fullKey)) {
      const entry = this.l1Cache.get(fullKey)!;
      if (entry.expires > Date.now()) {
        return true;
      }
      this.l1Cache.delete(fullKey);
    }

    // Check Redis
    try {
      const exists = await this.client.exists(fullKey);
      return exists === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`);
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    const fullKey = this.buildKey(key);
    
    try {
      return await this.client.ttl(fullKey);
    } catch (error) {
      console.error(`Cache TTL error for key ${key}:`);
      return -1;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    const fullKey = this.buildKey(key);
    
    try {
      const result = await this.client.expire(fullKey, ttl);
      
      // Update local cache TTL
      const localEntry = this.l1Cache.get(fullKey);
      if (localEntry) {
        localEntry.expires = Date.now() + ttl * 1000;
      }
      
      return result === 1;
    } catch (error) {
      console.error(`Cache expire error for key ${key}:`);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    try {
      await this.client.flushall();
      this.l1Cache.clear();
      console.log('🧹 Cache flushed successfully');
      return true;
    } catch (error) {
      console.error('Cache flush error:');
      return false;
    }
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  async getDetailedStats(): Promise<{
    basic: CacheStats;
    memory: {
      used: number;
      peak: number;
      fragmentation: number;
    };
    keyspace: {
      totalKeys: number;
      expiredKeys: number;
      evictedKeys: number;
    };
    performance: {
      commandsProcessed: number;
      commandsPerSecond: number;
      avgLatency: number;
    };
    localCache: {
      size: number;
      hitRate: number;
      memoryUsage: number;
    };
  }> {
    try {
      const info = await this.client.info();
      const memoryInfo = this.parseRedisInfo(info, 'memory');
      const statsInfo = this.parseRedisInfo(info, 'stats');
      
      return {
        basic: this.stats,
        memory: {
          used: parseInt(memoryInfo.used_memory || '0'),
          peak: parseInt(memoryInfo.used_memory_peak || '0'),
          fragmentation: parseFloat(memoryInfo.mem_fragmentation_ratio || '1')
        },
        keyspace: {
          totalKeys: parseInt(statsInfo.keyspace_hits || '0') + parseInt(statsInfo.keyspace_misses || '0'),
          expiredKeys: parseInt(statsInfo.expired_keys || '0'),
          evictedKeys: parseInt(statsInfo.evicted_keys || '0')
        },
        performance: {
          commandsProcessed: parseInt(statsInfo.total_commands_processed || '0'),
          commandsPerSecond: parseFloat(statsInfo.instantaneous_ops_per_sec || '0'),
          avgLatency: this.stats.performance.averageGetTime
        },
        localCache: {
          size: this.l1Cache.size,
          hitRate: this.calculateL1HitRate(),
          memoryUsage: this.calculateL1MemoryUsage()
        }
      };
    } catch (error) {
      console.error('Error getting detailed stats:');
      return {
        basic: this.stats,
        memory: { used: 0, peak: 0, fragmentation: 1 },
        keyspace: { totalKeys: 0, expiredKeys: 0, evictedKeys: 0 },
        performance: { commandsProcessed: 0, commandsPerSecond: 0, avgLatency: 0 },
        localCache: { size: this.l1Cache.size, hitRate: 0, memoryUsage: 0 }
      };
    }
  }

  registerPattern(): void {
    // Implementation needed
  }

  registerInvalidationRule(): void {
    // Implementation needed
  }

  async warmup(keys: Array<{ key: string; generator: () => Promise<unknown>; ttl?: number }>): Promise<{
    success: number;
    failed: number;
    errors: Array<{ key: string; error: string }>;
  }> {
    const results = { success: 0, failed: 0, errors: [] as Array<{ key: string; error: string }> };
    
    console.log(`🔥 Starting cache warmup for ${keys.length} keys...`);
    
    for (const { key, generator, ttl } of keys) {
      try {
        const value = await generator();
        const success = await this.set(key, value, { ttl });
        
        if (success) {
          results.success++;
        } else {
          results.failed++;
          results.errors.push({ key, error: 'Failed to set cache value' });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({ 
          key, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
    
    console.log(`🔥 Cache warmup completed: ${results.success} success, ${results.failed} failed`);
    return results;
  }

  private initializeClient(): void {
    // Mock Redis client - in production, use ioredis or redis
    /* eslint-disable @typescript-eslint/no-unused-vars */
    this.client = {
      get: async (key: string): Promise<string | null> => {
        // Mock implementation
        await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
        return Math.random() > 0.3 ? JSON.stringify({ mock: 'data', key }) : null;
      },
      set: async (_key: string, _value: string, _ttl?: number): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      },
      setex: async (_key: string, _ttl: number, _value: string): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
      },
      del: async (...keys: string[]): Promise<number> => {
        await new Promise(resolve => setTimeout(resolve, Math.random() * 5));
        return keys.length;
      },
      exists: async (_key: string): Promise<number> => {
        return Math.random() > 0.5 ? 1 : 0;
      },
      keys: async (): Promise<string[]> => {
        return ['key1', 'key2', 'key3'];
      },
      flushall: async (): Promise<void> => {
        await new Promise(resolve => setTimeout(resolve, 10));
      },
      info: async (): Promise<string> => {
        return `# Memory\nused_memory:${Math.floor(Math.random() * 1024 * 1024 * 100)}\n# Stats\nconnected_clients:${Math.floor(Math.random() * 50)}\ntotal_commands_processed:${Math.floor(Math.random() * 10000)}`;
      },
      quit: async (): Promise<void> => {
        console.log('Redis client disconnected');
      },
      ttl: async (_key: string): Promise<number> => {
        // Mock implementation
        return Math.floor(Math.random() * 10000);
      },
      expire: async (_key: string, _ttl: number): Promise<number> => {
        // Mock implementation
        return 1;
      }
    };
    /* eslint-enable @typescript-eslint/no-unused-vars */

    console.log(`🔗 Redis cache client initialized`);
  }

  private deserializeValue<T>(value: string): T {
    try {
      // Check if value is compressed
      if (this.compressionEnabled && value.startsWith('COMPRESSED:')) {
        const compressedData = value.substring(11);
        const decompressed = this.decompress(compressedData);
        return JSON.parse(decompressed as string);
      }
      
      return JSON.parse(value);
    } catch (error) {
      console.error('Cache deserialization error:');
      throw error;
    }
  }

  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  private updateHitRate(): void {
    const totalOperations = this.stats.hits + this.stats.misses;
    this.stats.hitRate = totalOperations > 0 ? this.stats.hits / totalOperations : 0;
  }

  private updateL1HitRate(): void {
    const totalOperations = (this.stats.l1Cache?.hits || 0) + (this.stats.l1Cache?.misses || 0);
    if (this.stats.l1Cache) {
      this.stats.l1Cache.hitRate = totalOperations > 0 ? this.stats.l1Cache.hits / totalOperations : 0;
    }
  }

  private calculateL1HitRate(): number {
    const totalOperations = this.l1Cache.size > 0 ? this.l1Cache.size : 1;
    return this.stats.l1Cache!.hits / totalOperations;
  }

  private calculateL1MemoryUsage(): number {
    let totalSize = 0;
    for (const entry of this.l1Cache.values()) {
      totalSize += entry.size;
    }
    return totalSize;
  }

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.config.healthCheckInterval * 1000);
    
    console.log('📊 Started cache health check');
  }

  private checkHealth(): void {
    // Implementation needed
  }

  private parseRedisInfo(info: string, section: string): Record<string, string> {
    const lines = info.split('\n');
    const sectionData: Record<string, string> = {};
    let inSection = false;
    
    for (const line of lines) {
      if (line.startsWith(`# ${section}`)) {
        inSection = true;
        continue;
      }
      if (line.startsWith('#') && inSection) {
        break;
      }
      if (inSection && line.includes(':')) {
        const [key, value] = line.split(':');
        sectionData[key] = value;
      }
    }
    
    return sectionData;
  }

  private compress<T>(value: T): string {
    // Simple compression simulation - in production use zlib or similar
    const json = JSON.stringify(value);
    return Buffer.from(json).toString('base64');
  }

  private decompress<T>(compressed: string): T {
    // Simple decompression simulation
    const json = Buffer.from(compressed, 'base64').toString();
    return JSON.parse(json);
  }

  private setL1Cache(key: string, value: any, ttl: number): void {
    this.l1Cache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
      size: JSON.stringify(value).length
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private trackPattern(_fullKey: string, _pattern: string): void {
    // Implementation needed
  }

  // Mock event handlers for cache warmup
  private onCacheWarmupStart(): void {
    // Mock implementation
  }

  private onCacheWarmupComplete(): void {
    // Mock implementation
  }

  private onCacheWarmupError(): void {
    // Mock implementation
  }

  private onCacheEviction(): void {
    // Mock implementation
  }

  private onCacheExpiration(): void {
    // Mock implementation
  }

  private onCacheInvalidation(): void {
    // Mock implementation
  }
}

// Export singleton instance with default config
export const redisCache = RedisCache.getInstance({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  database: parseInt(process.env.REDIS_DB || '0'),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'contravo:',
  defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL || '3600'),
  maxMemory: process.env.REDIS_MAX_MEMORY,
  evictionPolicy: process.env.REDIS_EVICTION_POLICY as 'allkeys-lru' | 'allkeys-lfu' | 'volatile-lru' | 'volatile-lfu' | 'allkeys-random' | 'volatile-random' | 'volatile-ttl' | 'noeviction' | undefined,
  compressionThreshold: parseInt(process.env.REDIS_COMPRESSION_THRESHOLD || '1024'),
  enableCompression: process.env.REDIS_ENABLE_COMPRESSION === 'true',
  enableL1Cache: process.env.REDIS_ENABLE_L1_CACHE === 'true',
  l1CacheSize: parseInt(process.env.REDIS_L1_CACHE_SIZE || '1000'),
  l1CacheTTL: parseInt(process.env.REDIS_L1_CACHE_TTL || '3600'),
  enableMetrics: process.env.REDIS_ENABLE_METRICS === 'true',
  enableHealthCheck: process.env.REDIS_ENABLE_HEALTH_CHECK === 'true',
  healthCheckInterval: parseInt(process.env.REDIS_HEALTH_CHECK_INTERVAL || '60'),
  retryAttempts: parseInt(process.env.REDIS_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '100'),
  connectionTimeout: parseInt(process.env.REDIS_CONNECTION_TIMEOUT || '5000'),
  commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000')
});

// Helper functions
export async function cacheGet<T = unknown>(
  key: string, 
  options?: { 
    useL1?: boolean; 
    updateStats?: boolean;
    deserializer?: (value: string) => T;
  }
): Promise<T | null> {
  return redisCache.get<T>(key, options);
}

export async function cacheSet<T = unknown>(key: string, value: T, options?: Parameters<typeof redisCache.set>[2]): Promise<boolean> {
  return redisCache.set(key, value, options);
}

export async function cacheDelete(key: string | string[]): Promise<number> {
  return redisCache.delete(key);
}

export async function cacheInvalidateByTags(tags: string[]): Promise<number> {
  return redisCache.invalidateByTags(tags);
}

export function getCacheStats(): CacheStats {
  return redisCache.getStats();
} 