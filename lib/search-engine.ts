export interface SearchDocument {
  id: string;
  type: 'contract' | 'user' | 'company' | 'document' | 'template';
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  status: 'active' | 'inactive' | 'archived';
  permissions: {
    read: string[];
    write: string[];
  };
}

export interface SearchQuery {
  query: string;
  type?: SearchDocument['type'] | SearchDocument['type'][];
  filters?: {
    type?: SearchDocument['type'] | SearchDocument['type'][];
    tags?: string[];
    createdBy?: string[];
    dateRange?: {
      from?: Date;
      to?: Date;
    };
    status?: SearchDocument['status'][];
    metadata?: Record<string, unknown>;
  };
  sort?: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination?: {
    page: number;
    limit: number;
  };
  highlight?: boolean;
  fuzzy?: boolean;
  boost?: {
    title?: number;
    content?: number;
    tags?: number;
  };
}

export interface SearchResult {
  document: SearchDocument;
  score: number;
  highlights?: {
    title?: string[];
    content?: string[];
    tags?: string[];
  };
  explanation?: {
    value: number;
    description: string;
    details: Array<{
      value: number;
      description: string;
    }>;
  };
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number; // milliseconds
  maxScore: number;
  aggregations?: {
    types: { [key: string]: number };
    tags: { [key: string]: number };
    creators: { [key: string]: number };
    dateHistogram: Array<{
      date: string;
      count: number;
    }>;
  };
  suggestions?: string[];
}

export interface SearchIndex {
  name: string;
  documents: Map<string, SearchDocument>;
  invertedIndex: Map<string, Set<string>>; // term -> document IDs
  fieldIndex: Map<string, Map<string, Set<string>>>; // field -> term -> document IDs
  createdAt: Date;
  lastUpdated: Date;
  documentCount: number;
  termCount: number;
}

export class SearchEngine {
  private static instance: SearchEngine;
  private indices: Map<string, SearchIndex> = new Map();
  private stopWords: Set<string>;
  private stemmer: (word: string) => string;
  private analytics: {
    totalSearches: number;
    popularQueries: Map<string, number>;
    slowQueries: Array<{ query: string; took: number; timestamp: Date }>;
    noResultQueries: Array<{ query: string; timestamp: Date }>;
  };

  private constructor() {
    this.stopWords = new Set([
      'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
      'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
      'to', 'was', 'will', 'with', 'bir', 'bu', 'da', 'de', 'den', 'için',
      'ile', 'olan', 've', 'veya', 'ya'
    ]);
    
    this.stemmer = this.createSimpleStemmer();
    this.analytics = {
      totalSearches: 0,
      popularQueries: new Map(),
      slowQueries: [],
      noResultQueries: []
    };

    this.initializeDefaultIndex();
  }

  static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  // Create or get search index
  createIndex(name: string): SearchIndex {
    if (this.indices.has(name)) {
      return this.indices.get(name)!;
    }

    const index: SearchIndex = {
      name,
      documents: new Map(),
      invertedIndex: new Map(),
      fieldIndex: new Map(),
      createdAt: new Date(),
      lastUpdated: new Date(),
      documentCount: 0,
      termCount: 0
    };

    this.indices.set(name, index);
    console.log(`🔍 Created search index: ${name}`);
    return index;
  }

  // Add document to index
  async indexDocument(indexName: string, document: SearchDocument): Promise<void> {
    const startTime = Date.now();
    const index = this.indices.get(indexName);
    
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    // Remove existing document if it exists
    if (index.documents.has(document.id)) {
      await this.removeDocument(indexName, document.id);
    }

    // Add document to index
    index.documents.set(document.id, document);

    // Tokenize and index content
    const tokens = this.tokenize(document.title + ' ' + document.content);
    const uniqueTokens = new Set(tokens);

    // Update inverted index
    for (const token of uniqueTokens) {
      if (!index.invertedIndex.has(token)) {
        index.invertedIndex.set(token, new Set());
        index.termCount++;
      }
      index.invertedIndex.get(token)!.add(document.id);
    }

    // Index individual fields
    this.indexField(index, 'title', document.title, document.id);
    this.indexField(index, 'content', document.content, document.id);
    this.indexField(index, 'tags', document.tags.join(' '), document.id);
    this.indexField(index, 'type', document.type, document.id);
    this.indexField(index, 'status', document.status, document.id);
    this.indexField(index, 'createdBy', document.createdBy, document.id);

    // Index metadata
    for (const [key, value] of Object.entries(document.metadata)) {
      this.indexField(index, `metadata.${key}`, String(value), document.id);
    }

    index.documentCount++;
    index.lastUpdated = new Date();

    const took = Date.now() - startTime;
    console.log(`📝 Indexed document ${document.id} in ${took}ms`);
  }

  // Remove document from index
  async removeDocument(indexName: string, documentId: string): Promise<void> {
    const index = this.indices.get(indexName);
    if (!index || !index.documents.has(documentId)) {
      return;
    }

    const document = index.documents.get(documentId)!;
    
    // Remove from inverted index
    const tokens = this.tokenize(document.title + ' ' + document.content);
    for (const token of tokens) {
      const docSet = index.invertedIndex.get(token);
      if (docSet) {
        docSet.delete(documentId);
        if (docSet.size === 0) {
          index.invertedIndex.delete(token);
          index.termCount--;
        }
      }
    }

    // Remove from field indices
    for (const [, fieldIndex] of index.fieldIndex) {
      for (const [term, docSet] of fieldIndex) {
        docSet.delete(documentId);
        if (docSet.size === 0) {
          fieldIndex.delete(term);
        }
      }
    }

    index.documents.delete(documentId);
    index.documentCount--;
    index.lastUpdated = new Date();

    console.log(`🗑️ Removed document ${documentId} from index`);
  }

  // Search documents
  async search(indexName: string, query: SearchQuery): Promise<SearchResponse> {
    const startTime = Date.now();
    const index = this.indices.get(indexName);
    
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    this.analytics.totalSearches++;
    this.trackQuery(query.query);

    try {
      // Parse and process query
      const processedQuery = this.processQuery(query.query);
      
      // Get candidate documents
      const candidates = this.getCandidateDocuments(index, processedQuery, query);
      
      // Score and rank documents
      const scoredResults = this.scoreDocuments(index, candidates, processedQuery, query);
      
      // Apply filters
      const filteredResults = this.applyFilters(scoredResults, query.filters);
      
      // Sort results
      const sortedResults = this.sortResults(filteredResults, query.sort);
      
      // Apply pagination
      const paginatedResults = this.paginateResults(sortedResults, query.pagination);
      
      // Generate highlights
      const highlightedResults = query.highlight 
        ? this.generateHighlights(paginatedResults, processedQuery)
        : paginatedResults;
      
      // Generate aggregations
      const aggregations = this.generateAggregations(filteredResults);
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(query.query, index);

      const took = Date.now() - startTime;
      const maxScore = highlightedResults.length > 0 ? Math.max(...highlightedResults.map(r => r.score)) : 0;

      // Track slow queries
      if (took > 1000) {
        this.analytics.slowQueries.push({
          query: query.query,
          took,
          timestamp: new Date()
        });
      }

      // Track no result queries
      if (highlightedResults.length === 0) {
        this.analytics.noResultQueries.push({
          query: query.query,
          timestamp: new Date()
        });
      }

      console.log(`🔍 Search completed: "${query.query}" - ${highlightedResults.length}/${filteredResults.length} results in ${took}ms`);

      return {
        results: highlightedResults,
        total: filteredResults.length,
        took,
        maxScore,
        aggregations,
        suggestions
      };

    } catch (_error) {
      console.error('❌ Search index error:', _error);
      throw _error;
    }
  }

  // Bulk index documents
  async bulkIndex(indexName: string, documents: SearchDocument[]): Promise<{
    indexed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    console.log(`📦 Bulk indexing ${documents.length} documents...`);
    const startTime = Date.now();
    
    let indexed = 0;
    const errors: Array<{ id: string; error: string }> = [];

    for (const document of documents) {
      try {
        await this.indexDocument(indexName, document);
        indexed++;
      } catch (_error) {
        errors.push({
          id: document.id,
          error: _error instanceof Error ? _error.message : 'Unknown error'
        });
      }
    }

    const took = Date.now() - startTime;
    console.log(`✅ Bulk indexing completed: ${indexed}/${documents.length} documents in ${took}ms`);

    return { indexed, errors };
  }

  // Get search analytics
  getAnalytics(): {
    totalSearches: number;
    popularQueries: Array<{ query: string; count: number }>;
    slowQueries: Array<{ query: string; took: number; timestamp: Date }>;
    noResultQueries: Array<{ query: string; timestamp: Date }>;
    indexStats: Array<{
      name: string;
      documentCount: number;
      termCount: number;
      lastUpdated: Date;
    }>;
  } {
    return {
      totalSearches: this.analytics.totalSearches,
      popularQueries: Array.from(this.analytics.popularQueries.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      slowQueries: this.analytics.slowQueries
        .sort((a, b) => b.took - a.took)
        .slice(0, 10),
      noResultQueries: this.analytics.noResultQueries
        .slice(-10),
      indexStats: Array.from(this.indices.values()).map(index => ({
        name: index.name,
        documentCount: index.documentCount,
        termCount: index.termCount,
        lastUpdated: index.lastUpdated
      }))
    };
  }

  // Optimize index
  async optimizeIndex(indexName: string): Promise<void> {
    console.log(`⚡ Optimizing index: ${indexName}`);
    const startTime = Date.now();
    
    const index = this.indices.get(indexName);
    if (!index) {
      throw new Error(`Index ${indexName} not found`);
    }

    // Remove empty term entries
    for (const [term, docSet] of index.invertedIndex) {
      if (docSet.size === 0) {
        index.invertedIndex.delete(term);
        index.termCount--;
      }
    }

    // Clean up field indices
    for (const [, fieldIndex] of index.fieldIndex) {
      for (const [term, docSet] of fieldIndex) {
        if (docSet.size === 0) {
          fieldIndex.delete(term);
        }
      }
    }

    index.lastUpdated = new Date();
    
    const took = Date.now() - startTime;
    console.log(`✅ Index optimization completed in ${took}ms`);
  }

  private initializeDefaultIndex(): void {
    this.createIndex('default');
  }

  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\sğüşıöçĞÜŞIÖÇ]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1 && !this.stopWords.has(token))
      .map(token => this.stemmer(token));
  }

  private createSimpleStemmer(): (word: string) => string {
    const turkishSuffixes = [
      'lar', 'ler', 'dan', 'den', 'tan', 'ten', 'nin', 'nın', 'nun', 'nün',
      'da', 'de', 'ta', 'te', 'ya', 'ye', 'a', 'e', 'ı', 'i', 'u', 'ü', 'o', 'ö'
    ];

    return (word: string): string => {
      if (word.length <= 3) return word;
      
      for (const suffix of turkishSuffixes) {
        if (word.endsWith(suffix) && word.length > suffix.length + 2) {
          return word.slice(0, -suffix.length);
        }
      }
      
      return word;
    };
  }

  private indexField(index: SearchIndex, field: string, value: string, documentId: string): void {
    if (!index.fieldIndex.has(field)) {
      index.fieldIndex.set(field, new Map());
    }

    const fieldIndex = index.fieldIndex.get(field)!;
    const tokens = this.tokenize(value);

    for (const token of tokens) {
      if (!fieldIndex.has(token)) {
        fieldIndex.set(token, new Set());
      }
      fieldIndex.get(token)!.add(documentId);
    }
  }

  private processQuery(query: string): {
    terms: string[];
    phrases: string[];
    operators: Array<{ type: 'AND' | 'OR' | 'NOT'; term: string }>;
  } {
    const terms: string[] = [];
    const phrases: string[] = [];
    const operators: Array<{ type: 'AND' | 'OR' | 'NOT'; term: string }> = [];

    // Extract phrases (quoted text)
    const phraseMatches = query.match(/"([^"]+)"/g);
    if (phraseMatches) {
      phrases.push(...phraseMatches.map(p => p.slice(1, -1)));
      query = query.replace(/"([^"]+)"/g, '');
    }

    // Extract operators
    const operatorMatches = query.match(/(\+|\-|AND|OR|NOT)\s*(\w+)/gi);
    if (operatorMatches) {
      for (const match of operatorMatches) {
        const [operator, term] = match.split(/\s+/);
        const type = operator === '+' || operator.toUpperCase() === 'AND' ? 'AND' :
                    operator === '-' || operator.toUpperCase() === 'NOT' ? 'NOT' : 'OR';
        operators.push({ type, term: term.toLowerCase() });
      }
      query = query.replace(/(\+|\-|AND|OR|NOT)\s*(\w+)/gi, '');
    }

    // Extract remaining terms
    terms.push(...this.tokenize(query));

    return { terms, phrases, operators };
  }

  private getCandidateDocuments(
    index: SearchIndex, 
    processedQuery: ReturnType<typeof this.processQuery>,
    query: SearchQuery
  ): Set<string> {
    const candidates = new Set<string>();

    // Add documents matching terms
    for (const term of processedQuery.terms) {
      const docSet = index.invertedIndex.get(term);
      if (docSet) {
        docSet.forEach(docId => candidates.add(docId));
      }

      // Fuzzy matching if enabled
      if (query.fuzzy) {
        for (const [indexTerm, docSet] of index.invertedIndex) {
          if (this.calculateLevenshteinDistance(term, indexTerm) <= 2) {
            docSet.forEach(docId => candidates.add(docId));
          }
        }
      }
    }

    // Add documents matching phrases
    for (const phrase of processedQuery.phrases) {
      const phraseTokens = this.tokenize(phrase);
      if (phraseTokens.length > 0) {
        let phraseCandidates = index.invertedIndex.get(phraseTokens[0]);
        
        for (let i = 1; i < phraseTokens.length && phraseCandidates; i++) {
          const termDocs = index.invertedIndex.get(phraseTokens[i]);
          if (termDocs) {
            phraseCandidates = new Set([...phraseCandidates].filter(x => termDocs.has(x)));
          } else {
            phraseCandidates = new Set();
            break;
          }
        }

        if (phraseCandidates) {
          phraseCandidates.forEach(docId => candidates.add(docId));
        }
      }
    }

    return candidates;
  }

  private scoreDocuments(
    index: SearchIndex,
    candidates: Set<string>,
    processedQuery: ReturnType<typeof this.processQuery>,
    query: SearchQuery
  ): SearchResult[] {
    const results: SearchResult[] = [];
    const boost = query.boost || { title: 2, content: 1, tags: 1.5 };

    for (const docId of candidates) {
      const document = index.documents.get(docId);
      if (!document) continue;

      let score = 0;

      // TF-IDF scoring for terms
      for (const term of processedQuery.terms) {
        const idf = this.calculateInverseDocumentFrequency(term, index);
        
        // Field-specific scoring
        const titleTf = this.calculateFieldTermFrequency(term, document.title);
        const contentTf = this.calculateFieldTermFrequency(term, document.content);
        const tagsTf = this.calculateFieldTermFrequency(term, document.tags.join(' '));

        score += (titleTf * (boost.title || 1) + contentTf * (boost.content || 1) + tagsTf * (boost.tags || 1)) * idf;
      }

      // Phrase scoring
      for (const phrase of processedQuery.phrases) {
        if (document.title.toLowerCase().includes(phrase.toLowerCase())) {
          score += 10 * (boost.title || 1);
        }
        if (document.content.toLowerCase().includes(phrase.toLowerCase())) {
          score += 5 * (boost.content || 1);
        }
      }

      // Recency boost
      const daysSinceUpdate = (Date.now() - document.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 1 - daysSinceUpdate / 365); // Boost newer documents
      score *= (1 + recencyBoost * 0.1);

      if (score > 0) {
        results.push({
          document,
          score,
          highlights: undefined,
          explanation: {
            value: score,
            description: `Score for document ${docId}`,
            details: [
              { value: score, description: 'Combined TF-IDF score with field boosts' }
            ]
          }
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private applyFilters(results: SearchResult[], filters?: SearchQuery['filters']): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      const doc = result.document;

      // Type filter
      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        if (!types.includes(doc.type)) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!filters.tags.some(tag => doc.tags.includes(tag))) return false;
      }

      // Creator filter
      if (filters.createdBy && filters.createdBy.length > 0) {
        if (!filters.createdBy.includes(doc.createdBy)) return false;
      }

      // Date range filter
      if (filters.dateRange) {
        if (filters.dateRange.from && doc.createdAt < filters.dateRange.from) return false;
        if (filters.dateRange.to && doc.createdAt > filters.dateRange.to) return false;
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(doc.status)) return false;
      }

      // Metadata filter
      if (filters.metadata) {
        for (const [key, value] of Object.entries(filters.metadata)) {
          if (doc.metadata[key] !== value) return false;
        }
      }

      return true;
    });
  }

  private sortResults(results: SearchResult[], sort?: SearchQuery['sort']): SearchResult[] {
    if (!sort || sort.length === 0) {
      return results; // Already sorted by score
    }

    return results.sort((a, b) => {
      for (const sortField of sort) {
        let aValue: any;
        let bValue: any;

        switch (sortField.field) {
          case 'score':
            aValue = a.score;
            bValue = b.score;
            break;
          case 'createdAt':
            aValue = a.document.createdAt.getTime();
            bValue = b.document.createdAt.getTime();
            break;
          case 'updatedAt':
            aValue = a.document.updatedAt.getTime();
            bValue = b.document.updatedAt.getTime();
            break;
          case 'title':
            aValue = a.document.title;
            bValue = b.document.title;
            break;
          default:
            aValue = a.document.metadata[sortField.field];
            bValue = b.document.metadata[sortField.field];
        }

        if (aValue !== bValue) {
          const comparison = aValue! < bValue! ? -1 : 1;
          return sortField.order === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });
  }

  private paginateResults(results: SearchResult[], pagination?: SearchQuery['pagination']): SearchResult[] {
    if (!pagination) return results.slice(0, 20); // Default limit

    const { page = 1, limit = 20 } = pagination;
    const start = (page - 1) * limit;
    return results.slice(start, start + limit);
  }

  private generateHighlights(results: SearchResult[], processedQuery: ReturnType<typeof this.processQuery>): SearchResult[] {
    return results.map(result => {
      const highlights: SearchResult['highlights'] = {};

      // Highlight terms in title
      let highlightedTitle = result.document.title;
      for (const term of processedQuery.terms) {
        const regex = new RegExp(`(${term})`, 'gi');
        highlightedTitle = highlightedTitle.replace(regex, '<mark>$1</mark>');
      }
      if (highlightedTitle !== result.document.title) {
        highlights.title = [highlightedTitle];
      }

      // Highlight terms in content (with context)
      const contentHighlights: string[] = [];
      for (const term of processedQuery.terms) {
        const regex = new RegExp(`(.{0,50})(${term})(.{0,50})`, 'gi');
        const matches = result.document.content.match(regex);
        if (matches) {
          contentHighlights.push(...matches.map(match => 
            match.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>')
          ));
        }
      }
      if (contentHighlights.length > 0) {
        highlights.content = contentHighlights.slice(0, 3); // Limit to 3 highlights
      }

      // Highlight tags
      const highlightedTags: string[] = [];
      for (const tag of result.document.tags) {
        for (const term of processedQuery.terms) {
          if (tag.toLowerCase().includes(term.toLowerCase())) {
            highlightedTags.push(tag.replace(new RegExp(`(${term})`, 'gi'), '<mark>$1</mark>'));
            break;
          }
        }
      }
      if (highlightedTags.length > 0) {
        highlights.tags = highlightedTags;
      }

      return {
        ...result,
        highlights: Object.keys(highlights).length > 0 ? highlights : undefined
      };
    });
  }

  private generateAggregations(results: SearchResult[]): SearchResponse['aggregations'] {
    const types: { [key: string]: number } = {};
    const tags: { [key: string]: number } = {};
    const creators: { [key: string]: number } = {};
    const dateHistogram: { [key: string]: number } = {};

    for (const result of results) {
      const doc = result.document;

      // Type aggregation
      types[doc.type] = (types[doc.type] || 0) + 1;

      // Tags aggregation
      for (const tag of doc.tags) {
        tags[tag] = (tags[tag] || 0) + 1;
      }

      // Creators aggregation
      creators[doc.createdBy] = (creators[doc.createdBy] || 0) + 1;

      // Date histogram (by month)
      const monthKey = doc.createdAt.toISOString().slice(0, 7); // YYYY-MM
      dateHistogram[monthKey] = (dateHistogram[monthKey] || 0) + 1;
    }

    return {
      types,
      tags: Object.fromEntries(
        Object.entries(tags)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 20)
      ),
      creators: Object.fromEntries(
        Object.entries(creators)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
      ),
      dateHistogram: Object.entries(dateHistogram)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, count }))
    };
  }

  private generateSuggestions(query: string, index: SearchIndex): string[] {
    const suggestions: string[] = [];
    const queryTerms = this.tokenize(query);

    if (queryTerms.length === 0) return suggestions;

    // Find similar terms in index
    for (const [term] of index.invertedIndex) {
      for (const queryTerm of queryTerms) {
        const distance = this.calculateLevenshteinDistance(queryTerm, term);
        if (distance <= 2 && distance > 0) {
          const suggestion = query.replace(new RegExp(queryTerm, 'gi'), term);
          if (!suggestions.includes(suggestion)) {
            suggestions.push(suggestion);
          }
        }
      }
    }

    return suggestions.slice(0, 5);
  }

  private calculateTermFrequency(term: string, document: SearchDocument): number {
    const text = (document.title + ' ' + document.content + ' ' + document.tags.join(' ')).toLowerCase();
    const terms = text.split(/\s+/);
    const termCount = terms.filter(t => t === term).length;
    return termCount / terms.length;
  }

  private calculateFieldTermFrequency(term: string, fieldValue: string): number {
    const terms = fieldValue.toLowerCase().split(/\s+/);
    const termCount = terms.filter(t => t === term).length;
    return termCount / Math.max(terms.length, 1);
  }

  private calculateInverseDocumentFrequency(term: string, index: SearchIndex): number {
    const docSet = index.invertedIndex.get(term);
    if (!docSet || docSet.size === 0) return 0;
    
    return Math.log(index.documentCount / docSet.size);
  }

  private calculateLevenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private trackQuery(query: string): void {
    const normalizedQuery = query.toLowerCase().trim();
    this.analytics.popularQueries.set(
      normalizedQuery,
      (this.analytics.popularQueries.get(normalizedQuery) || 0) + 1
    );
  }
}

// Export singleton instance
export const searchEngine = SearchEngine.getInstance();

// Helper functions
export async function indexDocument(document: SearchDocument, indexName = 'default'): Promise<void> {
  return searchEngine.indexDocument(indexName, document);
}

export async function search(query: SearchQuery, indexName = 'default'): Promise<SearchResponse> {
  return searchEngine.search(indexName, query);
}

export async function bulkIndex(documents: SearchDocument[], indexName = 'default'): Promise<{
  indexed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  return searchEngine.bulkIndex(indexName, documents);
}

export function getSearchAnalytics(): ReturnType<typeof searchEngine.getAnalytics> {
  return searchEngine.getAnalytics();
} 