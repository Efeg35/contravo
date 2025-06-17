import crypto from 'crypto';
export interface IndexDefinition {
  name: string;
  table: string;
  columns: string[];
  type: 'btree' | 'hash' | 'gin' | 'gist' | 'fulltext';
  unique?: boolean;
  partial?: string; // WHERE clause for partial index
  concurrent?: boolean;
  priority: 'high' | 'medium' | 'low';
  estimatedSize: number; // bytes
  createdAt?: Date;
  lastUsed?: Date;
  usageCount: number;
  performance: {
    avgQueryTime: number;
    totalQueries: number;
    effectiveness: number; // 0-1 score
  };
}

export interface IndexAnalysis {
  indexName: string;
  table: string;
  size: number;
  usage: {
    scans: number;
    seeks: number;
    lookups: number;
    updates: number;
  };
  performance: {
    avgSeekTime: number;
    avgScanTime: number;
    hitRatio: number;
    fragmentationLevel: number;
  };
  recommendations: Array<{
    type: 'create' | 'drop' | 'rebuild' | 'optimize';
    reason: string;
    impact: 'high' | 'medium' | 'low';
    estimatedImprovement: string;
  }>;
}

export interface QueryPattern {
  id: string;
  query: string;
  normalizedQuery: string;
  frequency: number;
  avgExecutionTime: number;
  tables: string[];
  columns: string[];
  operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
  whereConditions: Array<{
    column: string;
    operator: string;
    type: 'equality' | 'range' | 'like' | 'in';
  }>;
  orderBy: string[];
  groupBy: string[];
  joins: Array<{
    table: string;
    columns: string[];
    type: 'inner' | 'left' | 'right' | 'full';
  }>;
  lastSeen: Date;
  performance: {
    planCost: number;
    actualTime: number;
    rowsExamined: number;
    rowsReturned: number;
    indexesUsed: string[];
  };
}

export interface IndexOptimizationPlan {
  id: string;
  createdAt: Date;
  tables: string[];
  currentIndexes: IndexDefinition[];
  recommendedActions: Array<{
    action: 'create' | 'drop' | 'rebuild' | 'modify';
    indexName: string;
    definition?: IndexDefinition;
    reason: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    estimatedImpact: {
      querySpeedup: number; // percentage
      storageChange: number; // bytes
      maintenanceOverhead: number; // percentage
    };
    affectedQueries: string[];
  }>;
  estimatedTotalImpact: {
    performanceGain: number;
    storageIncrease: number;
    maintenanceIncrease: number;
  };
}

export class SearchIndexing {
  private static instance: SearchIndexing;
  private indexes: Map<string, IndexDefinition> = new Map();
  private queryPatterns: Map<string, QueryPattern> = new Map();
  private analysisHistory: IndexAnalysis[] = [];
  private optimizationPlans: IndexOptimizationPlan[] = [];

  private readonly INDEX_USAGE_THRESHOLD = 0.1; // Drop indexes used less than 10% of the time
  private readonly QUERY_TIME_THRESHOLD = 1000; // Consider slow queries > 1s
  private readonly FRAGMENTATION_THRESHOLD = 0.3; // Rebuild indexes with >30% fragmentation
  private readonly MAX_INDEXES_PER_TABLE = 10;

  private constructor() {
    this.initializeDefaultIndexes();
    this.startPerformanceMonitoring();
  }

  static getInstance(): SearchIndexing {
    if (!SearchIndexing.instance) {
      SearchIndexing.instance = new SearchIndexing();
    }
    return SearchIndexing.instance;
  }

  // Create database index
  async createIndex(definition: IndexDefinition): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔧 Creating index: ${definition.name} on ${definition.table}(${definition.columns.join(', ')})`);

      // Validate index definition
      const validation = this.validateIndexDefinition(definition);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Check for duplicate indexes
      const duplicate = this.findDuplicateIndex(definition);
      if (duplicate) {
        return { success: false, error: `Duplicate index found: ${duplicate.name}` };
      }

      // Generate SQL for index creation
      const sql = this.generateCreateIndexSQL(definition);
      console.log(`📝 SQL: ${sql}`);

      // In real implementation, execute SQL
      // await this.executeSQL(sql);

      // Store index definition
      definition.createdAt = new Date();
      definition.usageCount = 0;
      this.indexes.set(definition.name, definition);

      console.log(`✅ Index ${definition.name} created successfully`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error creating index:');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Drop database index
  async dropIndex(indexName: string, force = false): Promise<{ success: boolean; error?: string }> {
    try {
      const index = this.indexes.get(indexName);
      if (!index) {
        return { success: false, error: 'Index not found' };
      }

      // Check if index is critical (unless forced)
      if (!force && index.priority === 'high') {
        return { success: false, error: 'Cannot drop high-priority index without force flag' };
      }

      console.log(`🗑️ Dropping index: ${indexName}`);

      // Generate SQL for index drop
      const sql = `DROP INDEX ${index.concurrent ? 'CONCURRENTLY' : ''} IF EXISTS ${indexName}`;
      console.log(`📝 SQL: ${sql}`);

      // In real implementation, execute SQL
      // await this.executeSQL(sql);

      this.indexes.delete(indexName);

      console.log(`✅ Index ${indexName} dropped successfully`);
      return { success: true };

    } catch (error) {
      console.error('❌ Error dropping index:');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Analyze query patterns and suggest indexes
  async analyzeQueryPatterns(queries: string[]): Promise<IndexOptimizationPlan> {
    console.log(`🔍 Analyzing ${queries.length} query patterns...`);
    const startTime = Date.now();

    // Parse and normalize queries
    const patterns: QueryPattern[] = [];
    for (const query of queries) {
      const pattern = this.parseQuery(query);
      if (pattern) {
        patterns.push(pattern);
      }
    }

    // Group similar patterns
    const groupedPatterns = this.groupQueryPatterns(patterns);

    // Analyze current index usage
    const currentIndexes = Array.from(this.indexes.values());
    const indexAnalysis = await this.analyzeIndexUsage(currentIndexes);

    // Generate optimization recommendations
    const recommendations = this.generateIndexRecommendations(groupedPatterns, indexAnalysis);

    const plan: IndexOptimizationPlan = {
      id: this.generatePlanId(),
      createdAt: new Date(),
      tables: [...new Set(patterns.flatMap(p => p.tables))],
      currentIndexes,
      recommendedActions: recommendations,
      estimatedTotalImpact: this.calculateTotalImpact(recommendations)
    };

    this.optimizationPlans.push(plan);

    const took = Date.now() - startTime;
    console.log(`✅ Query pattern analysis completed in ${took}ms`);
    console.log(`📊 Found ${recommendations.length} optimization opportunities`);

    return plan;
  }

  // Execute optimization plan
  async executeOptimizationPlan(planId: string, actions?: string[]): Promise<{
    success: boolean;
    executed: number;
    failed: number;
    errors: Array<{ action: string; error: string }>;
  }> {
    const plan = this.optimizationPlans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Optimization plan not found');
    }

    console.log(`⚡ Executing optimization plan: ${planId}`);
    const startTime = Date.now();

    let executed = 0;
    let failed = 0;
    const errors: Array<{ action: string; error: string }> = [];

    const actionsToExecute = actions 
      ? plan.recommendedActions.filter(a => actions.includes(a.indexName))
      : plan.recommendedActions.filter(a => a.priority === 'critical' || a.priority === 'high');

    for (const action of actionsToExecute) {
      try {
        console.log(`🔧 Executing: ${action.action} ${action.indexName}`);

        switch (action.action) {
          case 'create':
            if (action.definition) {
              const result = await this.createIndex(action.definition);
              if (!result.success) {
                throw new Error(result.error);
              }
            }
            break;

          case 'drop':
            const dropResult = await this.dropIndex(action.indexName);
            if (!dropResult.success) {
              throw new Error(dropResult.error);
            }
            break;

          case 'rebuild':
            await this.rebuildIndex(action.indexName);
            break;

          case 'modify':
            // Modify index (drop and recreate with new definition)
            if (action.definition) {
              await this.dropIndex(action.indexName, true);
              const createResult = await this.createIndex(action.definition);
              if (!createResult.success) {
                throw new Error(createResult.error);
              }
            }
            break;
        }

        executed++;
        console.log(`✅ Completed: ${action.action} ${action.indexName}`);

      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ action: `${action.action} ${action.indexName}`, error: errorMessage });
        console.error(`❌ Failed: ${action.action} ${action.indexName} - ${errorMessage}`);
      }
    }

    const took = Date.now() - startTime;
    console.log(`🏁 Optimization plan execution completed in ${took}ms`);
    console.log(`📊 Results: ${executed} successful, ${failed} failed`);

    return { success: failed === 0, executed, failed, errors };
  }

  // Get index statistics
  getIndexStatistics(): {
    totalIndexes: number;
    indexesByTable: { [table: string]: number };
    indexesByType: { [type: string]: number };
    totalSize: number;
    averageUsage: number;
    topPerformingIndexes: Array<{ name: string; effectiveness: number }>;
    underutilizedIndexes: Array<{ name: string; usage: number }>;
  } {
    const indexes = Array.from(this.indexes.values());
    
    const indexesByTable: { [table: string]: number } = {};
    const indexesByType: { [type: string]: number } = {};
    let totalSize = 0;
    let totalUsage = 0;

    for (const index of indexes) {
      indexesByTable[index.table] = (indexesByTable[index.table] || 0) + 1;
      indexesByType[index.type] = (indexesByType[index.type] || 0) + 1;
      totalSize += index.estimatedSize;
      totalUsage += index.performance.effectiveness;
    }

    const averageUsage = indexes.length > 0 ? totalUsage / indexes.length : 0;

    const topPerformingIndexes = indexes
      .sort((a, b) => b.performance.effectiveness - a.performance.effectiveness)
      .slice(0, 10)
      .map(index => ({ name: index.name, effectiveness: index.performance.effectiveness }));

    const underutilizedIndexes = indexes
      .filter(index => index.performance.effectiveness < this.INDEX_USAGE_THRESHOLD)
      .sort((a, b) => a.performance.effectiveness - b.performance.effectiveness)
      .slice(0, 10)
      .map(index => ({ name: index.name, usage: index.performance.effectiveness }));

    return {
      totalIndexes: indexes.length,
      indexesByTable,
      indexesByType,
      totalSize,
      averageUsage,
      topPerformingIndexes,
      underutilizedIndexes
    };
  }

  // Monitor query performance
  recordQueryExecution(query: string, executionTime: number, planInfo?: {
    cost: number;
    rowsExamined: number;
    rowsReturned: number;
    indexesUsed: string[];
  }): void {
    const pattern = this.parseQuery(query);
    if (!pattern) return;

    const existingPattern = this.queryPatterns.get(pattern.normalizedQuery);
    if (existingPattern) {
      existingPattern.frequency++;
      existingPattern.avgExecutionTime = 
        (existingPattern.avgExecutionTime * (existingPattern.frequency - 1) + executionTime) / existingPattern.frequency;
      existingPattern.lastSeen = new Date();
      
      if (planInfo) {
        existingPattern.performance = {
          planCost: planInfo.cost,
          actualTime: executionTime,
          rowsExamined: planInfo.rowsExamined,
          rowsReturned: planInfo.rowsReturned,
          indexesUsed: planInfo.indexesUsed
        };

        // Update index usage statistics
        for (const indexName of planInfo.indexesUsed) {
          const index = this.indexes.get(indexName);
          if (index) {
            index.usageCount++;
            index.lastUsed = new Date();
            index.performance.totalQueries++;
            index.performance.avgQueryTime = 
              (index.performance.avgQueryTime * (index.performance.totalQueries - 1) + executionTime) / 
              index.performance.totalQueries;
          }
        }
      }
    } else {
      pattern.frequency = 1;
      pattern.avgExecutionTime = executionTime;
      pattern.lastSeen = new Date();
      
      if (planInfo) {
        pattern.performance = {
          planCost: planInfo.cost,
          actualTime: executionTime,
          rowsExamined: planInfo.rowsExamined,
          rowsReturned: planInfo.rowsReturned,
          indexesUsed: planInfo.indexesUsed
        };
      }

      this.queryPatterns.set(pattern.normalizedQuery, pattern);
    }
  }

  // Get query performance insights
  getQueryInsights(): {
    totalQueries: number;
    slowQueries: QueryPattern[];
    frequentQueries: QueryPattern[];
    unoptimizedQueries: QueryPattern[];
    indexUsageStats: Array<{
      indexName: string;
      usageCount: number;
      avgQueryTime: number;
      effectiveness: number;
    }>;
  } {
    const patterns = Array.from(this.queryPatterns.values());
    
    const slowQueries = patterns
      .filter(p => p.avgExecutionTime > this.QUERY_TIME_THRESHOLD)
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 10);

    const frequentQueries = patterns
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    const unoptimizedQueries = patterns
      .filter(p => p.performance.indexesUsed.length === 0 && p.avgExecutionTime > 100)
      .sort((a, b) => b.avgExecutionTime - a.avgExecutionTime)
      .slice(0, 10);

    const indexUsageStats = Array.from(this.indexes.values())
      .map(index => ({
        indexName: index.name,
        usageCount: index.usageCount,
        avgQueryTime: index.performance.avgQueryTime,
        effectiveness: index.performance.effectiveness
      }))
      .sort((a, b) => b.usageCount - a.usageCount);

    return {
      totalQueries: patterns.reduce((sum, p) => sum + p.frequency, 0),
      slowQueries,
      frequentQueries,
      unoptimizedQueries,
      indexUsageStats
    };
  }

  private initializeDefaultIndexes(): void {
    // Common indexes for contract management system
    const defaultIndexes: IndexDefinition[] = [
      {
        name: 'idx_contracts_status',
        table: 'contracts',
        columns: ['status'],
        type: 'btree',
        priority: 'high',
        estimatedSize: 1024 * 1024, // 1MB
        usageCount: 0,
        performance: { avgQueryTime: 0, totalQueries: 0, effectiveness: 0 }
      },
      {
        name: 'idx_contracts_created_at',
        table: 'contracts',
        columns: ['created_at'],
        type: 'btree',
        priority: 'medium',
        estimatedSize: 2 * 1024 * 1024, // 2MB
        usageCount: 0,
        performance: { avgQueryTime: 0, totalQueries: 0, effectiveness: 0 }
      },
      {
        name: 'idx_contracts_fulltext',
        table: 'contracts',
        columns: ['title', 'content'],
        type: 'fulltext',
        priority: 'high',
        estimatedSize: 10 * 1024 * 1024, // 10MB
        usageCount: 0,
        performance: { avgQueryTime: 0, totalQueries: 0, effectiveness: 0 }
      },
      {
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        type: 'btree',
        unique: true,
        priority: 'high',
        estimatedSize: 512 * 1024, // 512KB
        usageCount: 0,
        performance: { avgQueryTime: 0, totalQueries: 0, effectiveness: 0 }
      }
    ];

    for (const index of defaultIndexes) {
      this.indexes.set(index.name, index);
    }

    console.log(`🔧 Initialized ${defaultIndexes.length} default indexes`);
  }

  private validateIndexDefinition(definition: IndexDefinition): { valid: boolean; error?: string } {
    if (!definition.name || !definition.table || !definition.columns.length) {
      return { valid: false, error: 'Missing required fields: name, table, or columns' };
    }

    if (definition.columns.length > 16) {
      return { valid: false, error: 'Too many columns in index (max 16)' };
    }

    const tableIndexes = Array.from(this.indexes.values()).filter(idx => idx.table === definition.table);
    if (tableIndexes.length >= this.MAX_INDEXES_PER_TABLE) {
      return { valid: false, error: `Too many indexes on table ${definition.table} (max ${this.MAX_INDEXES_PER_TABLE})` };
    }

    return { valid: true };
  }

  private findDuplicateIndex(definition: IndexDefinition): IndexDefinition | null {
    for (const existing of this.indexes.values()) {
      if (existing.table === definition.table &&
          existing.columns.length === definition.columns.length &&
          existing.columns.every((col: string, i: number) => col === definition.columns[i])) {
        return existing;
      }
    }
    return null;
  }

  private generateCreateIndexSQL(definition: IndexDefinition): string {
    const uniqueClause = definition.unique ? 'UNIQUE ' : '';
    const concurrentClause = definition.concurrent ? 'CONCURRENTLY ' : '';
    const typeClause = definition.type !== 'btree' ? ` USING ${definition.type.toUpperCase()}` : '';
    const partialClause = definition.partial ? ` WHERE ${definition.partial}` : '';

    return `CREATE ${uniqueClause}INDEX ${concurrentClause}${definition.name} ON ${definition.table}${typeClause} (${definition.columns.join(', ')})${partialClause}`;
  }

  private parseQuery(query: string): QueryPattern | null {
    try {
      const normalizedQuery = this.normalizeQuery(query);
      const id = crypto.createHash('md5').update(normalizedQuery).digest('hex');

      // Simple query parsing (in real implementation, use proper SQL parser)
      const tables = this.extractTables(query);
      const columns = this.extractColumns(query);
      const operations = this.extractOperations(query);
      const whereConditions = this.extractWhereConditions(query);
      const orderBy = this.extractOrderBy(query);
      const groupBy = this.extractGroupBy(query);
      const joins = this.extractJoins(query);

      return {
        id,
        query,
        normalizedQuery,
        frequency: 0,
        avgExecutionTime: 0,
        tables,
        columns,
        operations,
        whereConditions,
        orderBy,
        groupBy,
        joins,
        lastSeen: new Date(),
        performance: {
          planCost: 0,
          actualTime: 0,
          rowsExamined: 0,
          rowsReturned: 0,
          indexesUsed: []
        }
      };
    } catch (error) {
      console.error('Error parsing query:');
      return null;
    }
  }

  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/\b\d+\b/g, '?') // Replace numbers with placeholders
      .replace(/'[^']*'/g, '?') // Replace string literals with placeholders
      .trim();
  }

  private extractTables(query: string): string[] {
    const tables: string[] = [];
    const fromMatch = query.match(/from\s+(\w+)/gi);
    const joinMatches = query.match(/join\s+(\w+)/gi);
    
    if (fromMatch) {
      tables.push(...fromMatch.map(m => m.split(/\s+/)[1]));
    }
    if (joinMatches) {
      tables.push(...joinMatches.map(m => m.split(/\s+/)[1]));
    }
    
    return [...new Set(tables)];
  }

  private extractColumns(query: string): string[] {
    // Simplified column extraction
    const selectMatch = query.match(/select\s+(.*?)\s+from/i);
    if (!selectMatch) return [];
    
    const columnsPart = selectMatch[1];
    if (columnsPart.includes('*')) return ['*'];
    
    return columnsPart.split(',').map(col => col.trim().split(/\s+/)[0]);
  }

  private extractOperations(query: string): ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[] {
    const operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[] = [];
    
    if (/^\s*select/i.test(query)) operations.push('SELECT');
    if (/^\s*insert/i.test(query)) operations.push('INSERT');
    if (/^\s*update/i.test(query)) operations.push('UPDATE');
    if (/^\s*delete/i.test(query)) operations.push('DELETE');
    
    return operations;
  }

  private extractWhereConditions(query: string): QueryPattern['whereConditions'] {
    const conditions: QueryPattern['whereConditions'] = [];
    const whereMatch = query.match(/where\s+(.*?)(?:\s+order\s+by|\s+group\s+by|\s+limit|$)/i);
    
    if (whereMatch) {
      const whereClause = whereMatch[1];
      // Simplified condition parsing
      const conditionMatches = whereClause.match(/(\w+)\s*(=|!=|<|>|<=|>=|like|in)\s*/gi);
      
      if (conditionMatches) {
        for (const match of conditionMatches) {
          const [, column, operator] = match.match(/(\w+)\s*(=|!=|<|>|<=|>=|like|in)/i) || [];
          if (column && operator) {
            let type: 'equality' | 'range' | 'like' | 'in' = 'equality';
            if (['<', '>', '<=', '>='].includes(operator)) type = 'range';
            else if (operator.toLowerCase() === 'like') type = 'like';
            else if (operator.toLowerCase() === 'in') type = 'in';
            
            conditions.push({ column, operator, type });
          }
        }
      }
    }
    
    return conditions;
  }

  private extractOrderBy(query: string): string[] {
    const orderMatch = query.match(/order\s+by\s+(.*?)(?:\s+limit|$)/i);
    if (!orderMatch) return [];
    
    return orderMatch[1].split(',').map(col => col.trim().split(/\s+/)[0]);
  }

  private extractGroupBy(query: string): string[] {
    const groupMatch = query.match(/group\s+by\s+(.*?)(?:\s+order\s+by|\s+limit|$)/i);
    if (!groupMatch) return [];
    
    return groupMatch[1].split(',').map(col => col.trim());
  }

  private extractJoins(query: string): QueryPattern['joins'] {
    const joins: QueryPattern['joins'] = [];
    const joinMatches = query.match(/(inner|left|right|full)?\s*join\s+(\w+)\s+on\s+(.*?)(?:\s+(?:inner|left|right|full)?\s*join|\s+where|\s+order|\s+group|$)/gi);
    
    if (joinMatches) {
      for (const match of joinMatches) {
        const parts = match.match(/(inner|left|right|full)?\s*join\s+(\w+)\s+on\s+(.*)/i);
        if (parts) {
          const [, joinType, table, condition] = parts;
          const type = (joinType?.toLowerCase() as 'inner' | 'left' | 'right' | 'full') || 'inner';
          const columns = condition.match(/(\w+)/g) || [];
          
          joins.push({ table, columns, type });
        }
      }
    }
    
    return joins;
  }

  private groupQueryPatterns(patterns: QueryPattern[]): Map<string, QueryPattern[]> {
    const groups = new Map<string, QueryPattern[]>();
    
    for (const pattern of patterns) {
      const key = `${pattern.tables.join(',')}_${pattern.operations.join(',')}_${pattern.whereConditions.map(c => c.column).join(',')}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(pattern);
    }
    
    return groups;
  }

  private async analyzeIndexUsage(indexes: IndexDefinition[]): Promise<IndexAnalysis[]> {
    const analyses: IndexAnalysis[] = [];
    
    for (const index of indexes) {
      const analysis: IndexAnalysis = {
        indexName: index.name,
        table: index.table,
        size: index.estimatedSize,
        usage: {
          scans: Math.floor(Math.random() * 1000), // Mock data
          seeks: Math.floor(Math.random() * 5000),
          lookups: Math.floor(Math.random() * 10000),
          updates: Math.floor(Math.random() * 500)
        },
        performance: {
          avgSeekTime: Math.random() * 10,
          avgScanTime: Math.random() * 100,
          hitRatio: Math.random(),
          fragmentationLevel: Math.random() * 0.5
        },
        recommendations: []
      };

      // Generate recommendations based on analysis
      if (analysis.performance.fragmentationLevel > this.FRAGMENTATION_THRESHOLD) {
        analysis.recommendations.push({
          type: 'rebuild',
          reason: `High fragmentation level: ${(analysis.performance.fragmentationLevel * 100).toFixed(1)}%`,
          impact: 'medium',
          estimatedImprovement: '20-30% query performance improvement'
        });
      }

      if (analysis.performance.hitRatio < 0.1) {
        analysis.recommendations.push({
          type: 'drop',
          reason: `Low hit ratio: ${(analysis.performance.hitRatio * 100).toFixed(1)}%`,
          impact: 'low',
          estimatedImprovement: 'Reduced storage overhead'
        });
      }

      analyses.push(analysis);
    }
    
    return analyses;
  }

  private generateIndexRecommendations(
    groupedPatterns: Map<string, QueryPattern[]>,
    indexAnalysis: IndexAnalysis[]
  ): IndexOptimizationPlan['recommendedActions'] {
    const recommendations: IndexOptimizationPlan['recommendedActions'] = [];

    // Analyze query patterns for missing indexes
    for (const [, patterns] of groupedPatterns) {
      const totalFrequency = patterns.reduce((sum, p) => sum + p.frequency, 0);
      const avgExecutionTime = patterns.reduce((sum, p) => sum + p.avgExecutionTime, 0) / patterns.length;

      if (totalFrequency > 10 && avgExecutionTime > this.QUERY_TIME_THRESHOLD) {
        const representativePattern = patterns[0];
        
        // Suggest index for WHERE conditions
        if (representativePattern.whereConditions.length > 0) {
          const indexColumns = representativePattern.whereConditions
            .filter(c => c.type === 'equality' || c.type === 'range')
            .map(c => c.column);

          if (indexColumns.length > 0) {
            const indexName = `idx_${representativePattern.tables[0]}_${indexColumns.join('_')}`;
            
            recommendations.push({
              action: 'create',
              indexName,
              definition: {
                name: indexName,
                table: representativePattern.tables[0],
                columns: indexColumns,
                type: 'btree',
                priority: avgExecutionTime > 5000 ? 'high' : 'high',
                estimatedSize: indexColumns.length * 1024 * 1024, // Rough estimate
                usageCount: 0,
                performance: { avgQueryTime: 0, totalQueries: 0, effectiveness: 0 }
              },
              reason: `Frequent slow queries on ${representativePattern.tables[0]}(${indexColumns.join(', ')})`,
              priority: avgExecutionTime > 5000 ? 'critical' : 'high',
              estimatedImpact: {
                querySpeedup: 70,
                storageChange: indexColumns.length * 1024 * 1024,
                maintenanceOverhead: 5
              },
              affectedQueries: patterns.map(p => p.id)
            });
          }
        }
      }
    }

    // Add recommendations from index analysis
    for (const analysis of indexAnalysis) {
      for (const rec of analysis.recommendations) {
        recommendations.push({
          action: rec.type === 'optimize' ? 'modify' : rec.type,
          indexName: analysis.indexName,
          reason: rec.reason,
          priority: rec.impact === 'high' ? 'high' : rec.impact === 'medium' ? 'medium' : 'low',
          estimatedImpact: {
            querySpeedup: rec.type === 'rebuild' ? 25 : rec.type === 'drop' ? 0 : 50,
            storageChange: rec.type === 'drop' ? -analysis.size : 0,
            maintenanceOverhead: rec.type === 'drop' ? -2 : 1
          },
          affectedQueries: []
        });
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private calculateTotalImpact(recommendations: IndexOptimizationPlan['recommendedActions']): IndexOptimizationPlan['estimatedTotalImpact'] {
    let performanceGain = 0;
    let storageIncrease = 0;
    let maintenanceIncrease = 0;

    for (const rec of recommendations) {
      performanceGain += rec.estimatedImpact.querySpeedup;
      storageIncrease += rec.estimatedImpact.storageChange;
      maintenanceIncrease += rec.estimatedImpact.maintenanceOverhead;
    }

    return {
      performanceGain: Math.min(performanceGain, 300), // Cap at 300%
      storageIncrease,
      maintenanceIncrease
    };
  }

  private async rebuildIndex(indexName: string): Promise<void> {
    console.log(`🔄 Rebuilding index: ${indexName}`);
    
    const index = this.indexes.get(indexName);
    if (!index) {
      throw new Error('Index not found');
    }

    // In real implementation:
    // 1. Create new index with temporary name
    // 2. Drop old index
    // 3. Rename new index
    
    console.log(`✅ Index ${indexName} rebuilt successfully`);
  }

  private generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private startPerformanceMonitoring(): void {
    // Start background monitoring
    setInterval(() => {
      this.updateIndexEffectiveness();
    }, 60000); // Update every minute

    console.log('📊 Started performance monitoring');
  }

  private updateIndexEffectiveness(): void {
    for (const index of this.indexes.values()) {
      if (index.performance.totalQueries > 0) {
        // Calculate effectiveness based on usage and performance
        const usageScore = Math.min(index.usageCount / 1000, 1); // Normalize to 0-1
        const performanceScore = Math.max(0, 1 - index.performance.avgQueryTime / 1000); // Better performance = higher score
        
        index.performance.effectiveness = (usageScore + performanceScore) / 2;
      }
    }
  }
}

// Export singleton instance
export const searchIndexing = SearchIndexing.getInstance();

// Helper functions
export async function createIndex(definition: IndexDefinition): Promise<{ success: boolean; error?: string }> {
  return searchIndexing.createIndex(definition);
}

export async function analyzeQueries(queries: string[]): Promise<IndexOptimizationPlan> {
  return searchIndexing.analyzeQueryPatterns(queries);
}

export function recordQuery(query: string, executionTime: number, planInfo?: {
  cost: number;
  rowsExamined: number;
  rowsReturned: number;
  indexesUsed: string[];
}): void {
  searchIndexing.recordQueryExecution(query, executionTime, planInfo);
}

export function getIndexStats(): ReturnType<typeof searchIndexing.getIndexStatistics> {
  return searchIndexing.getIndexStatistics();
}

export function getQueryInsights(): ReturnType<typeof searchIndexing.getQueryInsights> {
  return searchIndexing.getQueryInsights();
} 