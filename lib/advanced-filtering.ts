export interface FilterCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike' | 'regex' | 'exists' | 'between' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
}

export interface FilterGroup {
  conditions: (FilterCondition | FilterGroup)[];
  operator: 'AND' | 'OR';
  not?: boolean;
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
  nullsFirst?: boolean;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface AggregationOptions {
  field: string;
  type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'distinct' | 'group';
  alias?: string;
  having?: FilterCondition;
}

export interface FilterQuery {
  filters?: FilterGroup;
  sort?: SortOption[];
  pagination?: PaginationOptions;
  aggregations?: AggregationOptions[];
  fields?: string[]; // Select specific fields
  joins?: JoinOptions[];
  groupBy?: string[];
  having?: FilterGroup;
}

export interface JoinOptions {
  table: string;
  alias?: string;
  type: 'inner' | 'left' | 'right' | 'full';
  on: Array<{
    left: string;
    right: string;
    operator?: '=' | '!=' | '>' | '<' | '>=' | '<=';
  }>;
}

export interface FilterResult<T = unknown> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore: boolean;
  aggregations?: { [key: string]: any };
  executionTime: number;
  query: {
    sql: string;
    parameters: any[];
  };
}

export interface FilterSchema {
  table: string;
  fields: {
    [fieldName: string]: {
      type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object';
      nullable?: boolean;
      indexed?: boolean;
      searchable?: boolean;
      sortable?: boolean;
      filterable?: boolean;
      validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
      };
      transform?: (value: any) => unknown;
    };
  };
  relations?: {
    [relationName: string]: {
      table: string;
      type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
      foreignKey: string;
      localKey?: string;
      through?: string; // For many-to-many
    };
  };
}

export class AdvancedFiltering {
  private static instance: AdvancedFiltering;
  private schemas: Map<string, FilterSchema> = new Map();
  private queryCache: Map<string, { result: FilterResult; timestamp: number }> = new Map();
  private performanceMetrics: {
    totalQueries: number;
    avgExecutionTime: number;
    slowQueries: Array<{ query: string; time: number; timestamp: Date }>;
    cacheHits: number;
    cacheMisses: number;
  };

  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly SLOW_QUERY_THRESHOLD = 1000; // 1 second
  private readonly MAX_CACHE_SIZE = 1000;

  private constructor() {
    this.performanceMetrics = {
      totalQueries: 0,
      avgExecutionTime: 0,
      slowQueries: [],
      cacheHits: 0,
      cacheMisses: 0
    };

    this.initializeDefaultSchemas();
    this.startCacheCleanup();
  }

  static getInstance(): AdvancedFiltering {
    if (!AdvancedFiltering.instance) {
      AdvancedFiltering.instance = new AdvancedFiltering();
    }
    return AdvancedFiltering.instance;
  }

  // Register schema for filtering
  registerSchema(schema: FilterSchema): void {
    this.schemas.set(schema.table, schema);
    console.log(`📋 Registered schema for table: ${schema.table}`);
  }

  // Execute filter query
  async executeFilter<T = unknown>(
    table: string,
    query: FilterQuery,
    options: {
      useCache?: boolean;
      explain?: boolean;
      timeout?: number;
    } = {}
  ): Promise<FilterResult<T>> {
    const startTime = Date.now();
    const { useCache = true, explain = false } = options;
    // Timeout configuration for future use
    // const timeout = options.timeout || 30000;

    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(table, query);

      // Check cache
      if (useCache) {
        const cached = this.getFromCache(cacheKey);
        if (cached) {
          this.performanceMetrics.cacheHits++;
          console.log(`💾 Cache hit for query on ${table}`);
          return cached as FilterResult<T>;
        }
        this.performanceMetrics.cacheMisses++;
      }

      // Validate query against schema
      const schema = this.schemas.get(table);
      if (!schema) {
        throw new Error(`Schema not found for table: ${table}`);
      }

      this.validateQuery(query, schema);

      // Build SQL query
      const sqlQuery = this.buildSQLQuery(table, query, schema);
      
      if (explain) {
        console.log('🔍 Generated SQL:', sqlQuery.sql);
        console.log('📊 Parameters:', sqlQuery.parameters);
      }

      // Execute query (mock implementation)
      const result = await this.executeSQLQuery<T>(sqlQuery);

      const executionTime = Date.now() - startTime;
      result.executionTime = executionTime;

      // Update performance metrics
      this.updatePerformanceMetrics(executionTime, sqlQuery.sql);

      // Cache result
      if (useCache && executionTime < this.SLOW_QUERY_THRESHOLD) {
        this.setCache(cacheKey, result);
      }

      console.log(`✅ Filter executed on ${table}: ${result.data.length}/${result.total} results in ${executionTime}ms`);

      return result;

    } catch {
      console.error('❌ Error applying filters:', _error);
      throw _error;
    }
  }

  // Build dynamic filter from user input
  buildDynamicFilter(
    userInput: {
      search?: string;
      filters?: { [field: string]: any };
      sort?: string;
      page?: number;
      limit?: number;
    },
    schema: FilterSchema
  ): FilterQuery {
    const query: FilterQuery = {};

    // Build search conditions
    if (userInput.search) {
      const searchConditions: FilterCondition[] = [];
      
      for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
        if (fieldDef.searchable && fieldDef.type === 'string') {
          searchConditions.push({
            field: fieldName,
            operator: 'ilike',
            value: `%${userInput.search}%`,
            type: fieldDef.type
          });
        }
      }

      if (searchConditions.length > 0) {
        query.filters = {
          conditions: searchConditions,
          operator: 'OR'
        };
      }
    }

    // Build field filters
    if (userInput.filters) {
      const filterConditions: FilterCondition[] = [];

      for (const [field, value] of Object.entries(userInput.filters)) {
        const fieldDef = schema.fields[field];
        if (!fieldDef || !fieldDef.filterable) continue;

        if (value === null || value === undefined) continue;

        // Handle different value types
        if (Array.isArray(value)) {
          filterConditions.push({
            field,
            operator: 'in',
            value,
            type: fieldDef.type
          });
        } else if (typeof value === 'object' && value !== null) {
          // Handle range filters: { min: 10, max: 100 }
          const rangeValue = value as { min?: any; max?: any };
          if (rangeValue.min !== undefined && rangeValue.max !== undefined) {
            filterConditions.push({
              field,
              operator: 'between',
              value: [rangeValue.min, rangeValue.max],
              type: fieldDef.type
            });
          } else if (rangeValue.min !== undefined) {
            filterConditions.push({
              field,
              operator: 'gte',
              value: rangeValue.min,
              type: fieldDef.type
            });
          } else if (rangeValue.max !== undefined) {
            filterConditions.push({
              field,
              operator: 'lte',
              value: rangeValue.max,
              type: fieldDef.type
            });
          }
        } else {
          filterConditions.push({
            field,
            operator: 'eq',
            value,
            type: fieldDef.type
          });
        }
      }

      if (filterConditions.length > 0) {
        if (query.filters) {
          // Combine with search filters
          query.filters = {
            conditions: [query.filters, {
              conditions: filterConditions,
              operator: 'AND'
            }],
            operator: 'AND'
          };
        } else {
          query.filters = {
            conditions: filterConditions,
            operator: 'AND'
          };
        }
      }
    }

    // Build sort
    if (userInput.sort) {
      const sortParts = userInput.sort.split(',');
      query.sort = sortParts.map(part => {
        const [field, direction] = part.trim().split(':');
        const fieldDef = schema.fields[field];
        
        if (!fieldDef || !fieldDef.sortable) {
          throw new Error(`Field ${field} is not sortable`);
        }

        return {
          field,
          direction: (direction?.toLowerCase() === 'desc' ? 'desc' : 'asc') as 'asc' | 'desc'
        };
      });
    }

    // Build pagination
    if (userInput.page || userInput.limit) {
      query.pagination = {
        page: userInput.page || 1,
        limit: Math.min(userInput.limit || 20, 100) // Cap at 100
      };
    }

    return query;
  }

  // Get filter suggestions based on data
  async getFilterSuggestions(
    table: string,
    field: string,
    query?: string,
    limit = 10
  ): Promise<Array<{ value: any; count: number; label?: string }>> {
    const schema = this.schemas.get(table);
    if (!schema) {
      throw new Error(`Schema not found for table: ${table}`);
    }

    const fieldDef = schema.fields[field];
    if (!fieldDef || !fieldDef.filterable) {
      throw new Error(`Field ${field} is not filterable`);
    }

    // Mock implementation - in real app, query database
    const suggestions = await this.queryFieldValues(table, field, query, limit);
    
    console.log(`💡 Generated ${suggestions.length} suggestions for ${table}.${field}`);
    return suggestions;
  }

  // Validate filter permissions
  validateFilterPermissions(
    query: FilterQuery,
    userPermissions: {
      canAccessFields: string[];
      canFilterFields: string[];
      canSortFields: string[];
      maxLimit: number;
    }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check field access
    if (query.fields) {
      for (const field of query.fields) {
        if (!userPermissions.canAccessFields.includes(field)) {
          errors.push(`Access denied to field: ${field}`);
        }
      }
    }

    // Check filter permissions
    if (query.filters) {
      const filterFields = this.extractFieldsFromFilterGroup(query.filters);
      for (const field of filterFields) {
        if (!userPermissions.canFilterFields.includes(field)) {
          errors.push(`Filter access denied to field: ${field}`);
        }
      }
    }

    // Check sort permissions
    if (query.sort) {
      for (const sort of query.sort) {
        if (!userPermissions.canSortFields.includes(sort.field)) {
          errors.push(`Sort access denied to field: ${sort.field}`);
        }
      }
    }

    // Check pagination limits
    if (query.pagination && query.pagination.limit > userPermissions.maxLimit) {
      errors.push(`Limit exceeds maximum allowed: ${userPermissions.maxLimit}`);
    }

    return { valid: errors.length === 0, errors };
  }

  // Get performance metrics
  getPerformanceMetrics(): typeof this.performanceMetrics & {
    cacheStats: {
      size: number;
      hitRate: number;
      memoryUsage: number;
    };
  } {
    const totalCacheRequests = this.performanceMetrics.cacheHits + this.performanceMetrics.cacheMisses;
    const hitRate = totalCacheRequests > 0 ? this.performanceMetrics.cacheHits / totalCacheRequests : 0;

    return {
      ...this.performanceMetrics,
      cacheStats: {
        size: this.queryCache.size,
        hitRate,
        memoryUsage: this.estimateCacheMemoryUsage()
      }
    };
  }

  // Clear cache
  clearCache(pattern?: string): number {
    if (!pattern) {
      const size = this.queryCache.size;
      this.queryCache.clear();
      console.log(`🧹 Cleared entire filter cache (${size} entries)`);
      return size;
    }

    let cleared = 0;
    const regex = new RegExp(pattern);
    
    for (const [key] of this.queryCache) {
      if (regex.test(key)) {
        this.queryCache.delete(key);
        cleared++;
      }
    }

    console.log(`🧹 Cleared ${cleared} cache entries matching pattern: ${pattern}`);
    return cleared;
  }

  private initializeDefaultSchemas(): void {
    // Contract schema
    this.registerSchema({
      table: 'contracts',
      fields: {
        id: { type: 'string', indexed: true, filterable: true },
        title: { type: 'string', searchable: true, sortable: true, filterable: true },
        content: { type: 'string', searchable: true },
        status: { 
          type: 'string', 
          filterable: true, 
          sortable: true,
          validation: { enum: ['draft', 'active', 'expired', 'terminated'] }
        },
        created_at: { type: 'date', indexed: true, sortable: true, filterable: true },
        updated_at: { type: 'date', indexed: true, sortable: true, filterable: true },
        created_by: { type: 'string', indexed: true, filterable: true },
        company_id: { type: 'string', indexed: true, filterable: true },
        value: { type: 'number', sortable: true, filterable: true },
        tags: { type: 'array', filterable: true },
        metadata: { type: 'object', searchable: true }
      },
      relations: {
        company: {
          table: 'companies',
          type: 'manyToOne',
          foreignKey: 'company_id',
          localKey: 'id'
        },
        creator: {
          table: 'users',
          type: 'manyToOne',
          foreignKey: 'created_by',
          localKey: 'id'
        }
      }
    });

    // User schema
    this.registerSchema({
      table: 'users',
      fields: {
        id: { type: 'string', indexed: true, filterable: true },
        email: { type: 'string', indexed: true, searchable: true, filterable: true },
        name: { type: 'string', searchable: true, sortable: true, filterable: true },
        role: { 
          type: 'string', 
          filterable: true,
          validation: { enum: ['admin', 'manager', 'user'] }
        },
        created_at: { type: 'date', indexed: true, sortable: true, filterable: true },
        last_login: { type: 'date', sortable: true, filterable: true },
        is_active: { type: 'boolean', filterable: true }
      }
    });

    // Company schema
    this.registerSchema({
      table: 'companies',
      fields: {
        id: { type: 'string', indexed: true, filterable: true },
        name: { type: 'string', searchable: true, sortable: true, filterable: true },
        industry: { type: 'string', filterable: true },
        size: { 
          type: 'string', 
          filterable: true,
          validation: { enum: ['startup', 'small', 'medium', 'large', 'enterprise'] }
        },
        created_at: { type: 'date', indexed: true, sortable: true, filterable: true },
        country: { type: 'string', filterable: true },
        revenue: { type: 'number', sortable: true, filterable: true }
      }
    });

    console.log('📋 Initialized default filter schemas');
  }

  private validateQuery(query: FilterQuery, schema: FilterSchema): void {
    // Validate fields
    if (query.fields) {
      for (const field of query.fields) {
        if (!schema.fields[field]) {
          throw new Error(`Unknown field: ${field}`);
        }
      }
    }

    // Validate filters
    if (query.filters) {
      this.validateFilterGroup(query.filters, schema);
    }

    // Validate sort
    if (query.sort) {
      for (const sort of query.sort) {
        const fieldDef = schema.fields[sort.field];
        if (!fieldDef) {
          throw new Error(`Unknown sort field: ${sort.field}`);
        }
        if (!fieldDef.sortable) {
          throw new Error(`Field ${sort.field} is not sortable`);
        }
      }
    }

    // Validate aggregations
    if (query.aggregations) {
      for (const agg of query.aggregations) {
        const fieldDef = schema.fields[agg.field];
        if (!fieldDef) {
          throw new Error(`Unknown aggregation field: ${agg.field}`);
        }
        
        // Check if aggregation type is compatible with field type
        if (agg.type === 'sum' || agg.type === 'avg') {
          if (fieldDef.type !== 'number') {
            throw new Error(`Cannot use ${agg.type} aggregation on non-numeric field: ${agg.field}`);
          }
        }
      }
    }
  }

  private validateFilterGroup(group: FilterGroup, schema: FilterSchema): void {
    for (const condition of group.conditions) {
      if ('conditions' in condition) {
        // Nested group
        this.validateFilterGroup(condition, schema);
      } else {
        // Filter condition
        this.validateFilterCondition(condition, schema);
      }
    }
  }

  private validateFilterCondition(condition: FilterCondition, schema: FilterSchema): void {
    const fieldDef = schema.fields[condition.field];
    if (!fieldDef) {
      throw new Error(`Unknown filter field: ${condition.field}`);
    }

    if (!fieldDef.filterable) {
      throw new Error(`Field ${condition.field} is not filterable`);
    }

    // Validate value type
    if (condition.value !== null && condition.value !== undefined) {
      const expectedType = condition.type || fieldDef.type;
      
      if (!this.isValidValueType(condition.value, expectedType, condition.operator)) {
        throw new Error(`Invalid value type for field ${condition.field}: expected ${expectedType}`);
      }

      // Validate against field constraints
      if (fieldDef.validation) {
        this.validateFieldValue(condition.value, fieldDef.validation, condition.field);
      }
    }
  }

  private isValidValueType(value: any, expectedType: string, operator: string): boolean {
    if (operator === 'in' || operator === 'nin' || operator === 'between') {
      return Array.isArray(value);
    }

    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || typeof value === 'string';
      case 'array':
        return Array.isArray(value);
      case 'object':
      case 'json':
        return typeof value === 'object';
      default:
        return true;
    }
  }

  private validateFieldValue(value: any, validation: NonNullable<FilterSchema['fields'][string]['validation']>, fieldName: string): void {
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`Invalid value for field ${fieldName}: must be one of ${validation.enum.join(', ')}`);
    }

    if (typeof value === 'number') {
      if (validation.min !== undefined && value < validation.min) {
        throw new Error(`Value for field ${fieldName} must be >= ${validation.min}`);
      }
      if (validation.max !== undefined && value > validation.max) {
        throw new Error(`Value for field ${fieldName} must be <= ${validation.max}`);
      }
    }

    if (typeof value === 'string' && validation.pattern) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        throw new Error(`Value for field ${fieldName} does not match required pattern`);
      }
    }
  }

  private buildSQLQuery(table: string, query: FilterQuery, schema: FilterSchema): { sql: string; parameters: any[] } {
    const parameters: any[] = [];
    let paramIndex = 1;

    // SELECT clause
    let selectClause = 'SELECT ';
    if (query.fields && query.fields.length > 0) {
      selectClause += query.fields.map(field => `"${field}"`).join(', ');
    } else {
      selectClause += '*';
    }

    // Add aggregations
    if (query.aggregations) {
      const aggClauses = query.aggregations.map(agg => {
        const alias = agg.alias || `${agg.type}_${agg.field}`;
        switch (agg.type) {
          case 'count':
            return `COUNT("${agg.field}") AS "${alias}"`;
          case 'sum':
            return `SUM("${agg.field}") AS "${alias}"`;
          case 'avg':
            return `AVG("${agg.field}") AS "${alias}"`;
          case 'min':
            return `MIN("${agg.field}") AS "${alias}"`;
          case 'max':
            return `MAX("${agg.field}") AS "${alias}"`;
          case 'distinct':
            return `COUNT(DISTINCT "${agg.field}") AS "${alias}"`;
          default:
            return `"${agg.field}"`;
        }
      });

      if (query.fields && query.fields.length > 0) {
        selectClause += ', ' + aggClauses.join(', ');
      } else {
        selectClause = 'SELECT ' + aggClauses.join(', ');
      }
    }

    // FROM clause
    let fromClause = ` FROM "${table}"`;

    // JOIN clauses
    if (query.joins) {
      for (const join of query.joins) {
        const joinType = join.type.toUpperCase();
        const joinTable = join.alias ? `"${join.table}" AS "${join.alias}"` : `"${join.table}"`;
        
        const onConditions = join.on.map(condition => {
          const operator = condition.operator || '=';
          return `"${condition.left}" ${operator} "${condition.right}"`;
        }).join(' AND ');

        fromClause += ` ${joinType} JOIN ${joinTable} ON ${onConditions}`;
      }
    }

    // WHERE clause
    let whereClause = '';
    if (query.filters) {
      const { clause, params } = this.buildWhereClause(query.filters, parameters, paramIndex, schema);
      whereClause = ` WHERE ${clause}`;
      parameters.push(...params);
      paramIndex += params.length;
    }

    // GROUP BY clause
    let groupByClause = '';
    if (query.groupBy && query.groupBy.length > 0) {
      groupByClause = ` GROUP BY ${query.groupBy.map(field => `"${field}"`).join(', ')}`;
    }

    // HAVING clause
    let havingClause = '';
    if (query.having) {
      const { clause, params } = this.buildWhereClause(query.having, parameters, paramIndex, schema);
      havingClause = ` HAVING ${clause}`;
      parameters.push(...params);
      paramIndex += params.length;
    }

    // ORDER BY clause
    let orderByClause = '';
    if (query.sort && query.sort.length > 0) {
      const sortClauses = query.sort.map(sort => {
        const nullsClause = sort.nullsFirst ? ' NULLS FIRST' : ' NULLS LAST';
        return `"${sort.field}" ${sort.direction.toUpperCase()}${nullsClause}`;
      });
      orderByClause = ` ORDER BY ${sortClauses.join(', ')}`;
    }

    // LIMIT and OFFSET clauses
    let limitClause = '';
    if (query.pagination) {
      const offset = query.pagination.offset || (query.pagination.page - 1) * query.pagination.limit;
      limitClause = ` LIMIT ${query.pagination.limit} OFFSET ${offset}`;
    }

    const sql = selectClause + fromClause + whereClause + groupByClause + havingClause + orderByClause + limitClause;

    return { sql, parameters };
  }

  private buildWhereClause(
    group: FilterGroup, 
    existingParams: any[], 
    startParamIndex: number,
    schema: FilterSchema
  ): { clause: string; params: any[] } {
    const params: any[] = [];
    const clauses: string[] = [];
    let paramIndex = startParamIndex;

    for (const condition of group.conditions) {
      if ('conditions' in condition) {
        // Nested group
        const { clause, params: nestedParams } = this.buildWhereClause(condition, existingParams, paramIndex, schema);
        clauses.push(`(${clause})`);
        params.push(...nestedParams);
        paramIndex += nestedParams.length;
      } else {
        // Filter condition
        const { clause, params: conditionParams } = this.buildConditionClause(condition, paramIndex, schema);
        clauses.push(clause);
        params.push(...conditionParams);
        paramIndex += conditionParams.length;
      }
    }

    let finalClause = clauses.join(` ${group.operator} `);
    if (group.not) {
      finalClause = `NOT (${finalClause})`;
    }

    return { clause: finalClause, params };
  }

  private buildConditionClause(
    condition: FilterCondition, 
    paramIndex: number,
    schema: FilterSchema
  ): { clause: string; params: any[] } {
    const field = `"${condition.field}"`;
    const params: any[] = [];
    let clause = '';

    // Transform value if needed
    const fieldDef = schema.fields[condition.field];
    let value = condition.value;
    if (fieldDef?.transform) {
      value = fieldDef.transform(value);
    }

    switch (condition.operator) {
      case 'eq':
        clause = `${field} = $${paramIndex}`;
        params.push(value);
        break;
      case 'ne':
        clause = `${field} != $${paramIndex}`;
        params.push(value);
        break;
      case 'gt':
        clause = `${field} > $${paramIndex}`;
        params.push(value);
        break;
      case 'gte':
        clause = `${field} >= $${paramIndex}`;
        params.push(value);
        break;
      case 'lt':
        clause = `${field} < $${paramIndex}`;
        params.push(value);
        break;
      case 'lte':
        clause = `${field} <= $${paramIndex}`;
        params.push(value);
        break;
      case 'in':
        if (Array.isArray(value) && value.length > 0) {
          const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
          clause = `${field} IN (${placeholders})`;
          params.push(...value);
        } else {
          clause = '1=0'; // No matches
        }
        break;
      case 'nin':
        if (Array.isArray(value) && value.length > 0) {
          const placeholders = value.map((_, i) => `$${paramIndex + i}`).join(', ');
          clause = `${field} NOT IN (${placeholders})`;
          params.push(...value);
        } else {
          clause = '1=1'; // All matches
        }
        break;
      case 'like':
        clause = `${field} LIKE $${paramIndex}`;
        params.push(value);
        break;
      case 'ilike':
        clause = `${field} ILIKE $${paramIndex}`;
        params.push(value);
        break;
      case 'regex':
        clause = `${field} ~ $${paramIndex}`;
        params.push(value);
        break;
      case 'exists':
        clause = `${field} IS NOT NULL`;
        break;
      case 'between':
        if (Array.isArray(value) && value.length === 2) {
          clause = `${field} BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
          params.push(value[0], value[1]);
        }
        break;
      case 'contains':
        if (fieldDef?.type === 'array') {
          clause = `$${paramIndex} = ANY(${field})`;
          params.push(value);
        } else if (fieldDef?.type === 'object') {
          clause = `${field} @> $${paramIndex}::jsonb`;
          params.push(JSON.stringify(value));
        } else {
          clause = `${field} LIKE $${paramIndex}`;
          params.push(`%${value}%`);
        }
        break;
      case 'startsWith':
        clause = `${field} LIKE $${paramIndex}`;
        params.push(`${value}%`);
        break;
      case 'endsWith':
        clause = `${field} LIKE $${paramIndex}`;
        params.push(`%${value}`);
        break;
      default:
        throw new Error(`Unsupported operator: ${condition.operator}`);
    }

    return { clause, params };
  }

  private async executeSQLQuery<T>(
    sqlQuery: { sql: string; parameters: any[] }
  ): Promise<FilterResult<T>> {
    // Mock implementation - in real app, execute against database
    console.log(`🔍 Executing SQL: ${sqlQuery.sql}`);
    console.log(`📊 Parameters: ${JSON.stringify(sqlQuery.parameters)}`);

    // Simulate query execution
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));

    // Mock result
    const mockData: T[] = [] as T[];
    const total = Math.floor(Math.random() * 1000);

    return {
      data: mockData,
      total,
      hasMore: mockData.length < total,
      executionTime: 0, // Will be set by caller
      query: sqlQuery
    };
  }

  private async queryFieldValues(
    table: string,
    field: string,
    query?: string,
    limit = 10
  ): Promise<Array<{ value: any; count: number; label?: string }>> {
    // Mock implementation
    const mockValues = [
      { value: 'active', count: 150, label: 'Active' },
      { value: 'draft', count: 75, label: 'Draft' },
      { value: 'expired', count: 25, label: 'Expired' },
      { value: 'terminated', count: 10, label: 'Terminated' }
    ];

    if (query) {
      return mockValues.filter(v => 
        String(v.value).toLowerCase().includes(query.toLowerCase()) ||
        (v.label && v.label.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, limit);
    }

    return mockValues.slice(0, limit);
  }

  private extractFieldsFromFilterGroup(group: FilterGroup): string[] {
    const fields: string[] = [];

    for (const condition of group.conditions) {
      if ('conditions' in condition) {
        fields.push(...this.extractFieldsFromFilterGroup(condition));
      } else {
        fields.push(condition.field);
      }
    }

    return [...new Set(fields)];
  }

  private generateCacheKey(table: string, query: FilterQuery): string {
    return `${table}:${JSON.stringify(query)}`;
  }

  private getFromCache(key: string): FilterResult | null {
    const cached = this.queryCache.get(key);
    if (!cached) return null;

    // Check TTL
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.queryCache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCache(key: string, result: FilterResult): void {
    // Implement LRU eviction if cache is full
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.queryCache.keys().next().value;
      if (oldestKey) {
        this.queryCache.delete(oldestKey);
      }
    }

    this.queryCache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  private updatePerformanceMetrics(executionTime: number, query: string): void {
    this.performanceMetrics.totalQueries++;
    
    // Update average execution time
    this.performanceMetrics.avgExecutionTime = 
      (this.performanceMetrics.avgExecutionTime * (this.performanceMetrics.totalQueries - 1) + executionTime) / 
      this.performanceMetrics.totalQueries;

    // Track slow queries
    if (executionTime > this.SLOW_QUERY_THRESHOLD) {
      this.performanceMetrics.slowQueries.push({
        query,
        time: executionTime,
        timestamp: new Date()
      });

      // Keep only last 100 slow queries
      if (this.performanceMetrics.slowQueries.length > 100) {
        this.performanceMetrics.slowQueries = this.performanceMetrics.slowQueries.slice(-100);
      }
    }
  }

  private estimateCacheMemoryUsage(): number {
    // Rough estimation of cache memory usage
    let totalSize = 0;
    for (const [key, cached] of this.queryCache) {
      totalSize += key.length * 2; // UTF-16 characters
      totalSize += JSON.stringify(cached.result).length * 2;
      totalSize += 64; // Overhead
    }
    return totalSize;
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, cached] of this.queryCache) {
        if (now - cached.timestamp > this.CACHE_TTL) {
          this.queryCache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
      }
    }, this.CACHE_TTL / 2); // Run cleanup every half TTL
  }
}

// Export singleton instance
export const advancedFiltering = AdvancedFiltering.getInstance();

// Helper functions
export async function executeFilter<T = unknown>(
  table: string,
  query: FilterQuery,
  options?: Parameters<typeof advancedFiltering.executeFilter>[2]
): Promise<FilterResult<T>> {
  return advancedFiltering.executeFilter<T>(table, query, options);
}

export function buildDynamicFilter(
  userInput: Parameters<typeof advancedFiltering.buildDynamicFilter>[0],
  table: string
): FilterQuery {
  const schema = advancedFiltering['schemas'].get(table);
  if (!schema) {
    throw new Error(`Schema not found for table: ${table}`);
  }
  return advancedFiltering.buildDynamicFilter(userInput, schema);
}

export async function getFilterSuggestions(
  table: string,
  field: string,
  query?: string,
  limit?: number
): Promise<Array<{ value: any; count: number; label?: string }>> {
  return advancedFiltering.getFilterSuggestions(table, field, query, limit);
}

export function registerFilterSchema(schema: FilterSchema): void {
  advancedFiltering.registerSchema(schema);
}

export function getFilteringMetrics(): ReturnType<typeof advancedFiltering.getPerformanceMetrics> {
  return advancedFiltering.getPerformanceMetrics();
} 