'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Plus, 
  GripVertical, 
  Eye,
  Edit,
  Star,
  BookOpen,
  Building2,
  Users,
  Lock,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Types
interface ClauseVariable {
  id: string;
  name: string;
  label: string;
  type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'EMAIL' | 'PHONE' | 'CURRENCY' | 'PERCENTAGE';
  defaultValue?: string;
  isRequired: boolean;
  description?: string;
}

interface Clause {
  id: string;
  title: string;
  description?: string;
  content: string;
  category: ClauseCategory;
  visibility: 'PUBLIC' | 'COMPANY' | 'PRIVATE';
  isActive: boolean;
  version: number;
  variables: ClauseVariable[];
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  _count: {
    usageStats: number;
  };
  createdAt: string;
  updatedAt: string;
}

type ClauseCategory = 
  | 'LEGAL'
  | 'COMMERCIAL'
  | 'TECHNICAL'
  | 'CONFIDENTIALITY'
  | 'TERMINATION'
  | 'LIABILITY'
  | 'INTELLECTUAL_PROPERTY'
  | 'PAYMENT'
  | 'DELIVERY'
  | 'COMPLIANCE'
  | 'DISPUTE'
  | 'FORCE_MAJEURE'
  | 'OTHER';

interface ClauseLibraryProps {
  companyId?: string;
  onClauseSelect?: (clause: Clause) => void;
  onClauseDrop?: (clause: Clause) => void;
  selectedClauses?: string[];
  className?: string;
}

// Category labels in Turkish
const categoryLabels: Record<ClauseCategory, string> = {
  LEGAL: 'Yasal',
  COMMERCIAL: 'Ticari',
  TECHNICAL: 'Teknik',
  CONFIDENTIALITY: 'Gizlilik',
  TERMINATION: 'Fesih',
  LIABILITY: 'Sorumluluk',
  INTELLECTUAL_PROPERTY: 'Fikri Mülkiyet',
  PAYMENT: 'Ödeme',
  DELIVERY: 'Teslimat',
  COMPLIANCE: 'Uyumluluk',
  DISPUTE: 'Uyuşmazlık',
  FORCE_MAJEURE: 'Mücbir Sebep',
  OTHER: 'Diğer'
};

const ClauseLibrary: React.FC<ClauseLibraryProps> = ({
  companyId,
  onClauseSelect,
  onClauseDrop,
  selectedClauses = [],
  className
}) => {
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ClauseCategory | 'ALL'>('ALL');
  const [selectedVisibility, setSelectedVisibility] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set());

  // Fetch clauses
  const fetchClauses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '50',
        sortBy,
        sortOrder
      });

      if (companyId) params.append('companyId', companyId);
      if (selectedCategory !== 'ALL') params.append('category', selectedCategory);
      if (selectedVisibility !== 'ALL') params.append('visibility', selectedVisibility);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/clauses?${params}`);
      const data = await response.json();

      if (response.ok) {
        setClauses(data.clauses);
      } else {
        console.error('Clause listesi yüklenemedi:', data.error);
      }
    } catch (error) {
      console.error('Clause listesi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClauses();
  }, [companyId, selectedCategory, selectedVisibility, searchTerm, sortBy, sortOrder]);

  // Handle clause expansion
  const toggleClauseExpansion = (clauseId: string) => {
    const newExpanded = new Set(expandedClauses);
    if (newExpanded.has(clauseId)) {
      newExpanded.delete(clauseId);
    } else {
      newExpanded.add(clauseId);
    }
    setExpandedClauses(newExpanded);
  };

  // Render clause card
  const renderClauseCard = (clause: Clause) => {
    const isExpanded = expandedClauses.has(clause.id);
    const isSelected = selectedClauses.includes(clause.id);

    return (
      <Card
        key={clause.id}
        className={cn(
          'mb-3 cursor-pointer transition-all hover:shadow-md border',
          isSelected && 'ring-2 ring-blue-500 border-blue-200',
          'hover:border-gray-300'
        )}
        onClick={() => onClauseSelect?.(clause)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1 rounded hover:bg-gray-100 cursor-grab">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </div>
                
                <CardTitle className="text-sm font-medium line-clamp-1">
                  {clause.title}
                </CardTitle>
                
                <Badge variant="secondary" className="text-xs">
                  {categoryLabels[clause.category]}
                </Badge>
              </div>
              
              {clause.description && (
                <CardDescription className="text-xs line-clamp-2 ml-9">
                  {clause.description}
                </CardDescription>
              )}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              {/* Visibility indicator */}
              {clause.visibility === 'PUBLIC' && (
                <div className="flex items-center" title="Herkese açık">
                  <Users className="h-3 w-3 text-green-500" />
                </div>
              )}
              {clause.visibility === 'COMPANY' && (
                <div className="flex items-center" title="Şirket içi">
                  <Building2 className="h-3 w-3 text-blue-500" />
                </div>
              )}
              {clause.visibility === 'PRIVATE' && (
                <div className="flex items-center" title="Özel">
                  <Lock className="h-3 w-3 text-gray-500" />
                </div>
              )}
              
              {/* Usage count */}
              <span className="text-xs text-gray-500 mx-1">
                {clause._count.usageStats}
              </span>
              
              {/* Actions */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onClauseDrop) {
                    onClauseDrop(clause);
                  }
                }}
                title="Clause'u kullan"
              >
                <Copy className="h-3 w-3" />
              </Button>
              
              {/* Expand/Collapse */}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleClauseExpansion(clause.id);
                }}
              >
                {isExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        
        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-3 ml-9">
              {/* Clause content preview */}
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-xs text-gray-700 line-clamp-4">
                  {clause.content}
                </p>
              </div>
              
              {/* Variables */}
              {clause.variables.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium mb-2">Değişkenler:</h4>
                  <div className="flex flex-wrap gap-1">
                    {clause.variables.map((variable) => (
                      <Badge
                        key={variable.id}
                        variant="outline"
                        className="text-xs"
                      >
                        {variable.label}
                        {variable.isRequired && <span className="text-red-500 ml-1">*</span>}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>Oluşturan: {clause.createdBy.name}</div>
                {clause.company && (
                  <div>Şirket: {clause.company.name}</div>
                )}
                <div>Güncelleme: {new Date(clause.updatedAt).toLocaleDateString('tr-TR')}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    );
  };

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Smart Clauses
        </h2>
        <Button size="sm" onClick={() => window.location.href = '/dashboard/clauses/new'}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Clause
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3 mb-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Clause ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category and Visibility filters */}
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as ClauseCategory | 'ALL')}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Görünürlük" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tümü</SelectItem>
              <SelectItem value="PUBLIC">Herkese Açık</SelectItem>
              <SelectItem value="COMPANY">Şirket İçi</SelectItem>
              <SelectItem value="PRIVATE">Özel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Clauses List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Clause'lar yükleniyor...</p>
          </div>
        ) : clauses.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henüz clause bulunmuyor.</p>
            <p className="text-sm text-gray-400 mt-1">
              İlk clause'unuzu oluşturun.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {clauses.map(renderClauseCard)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClauseLibrary; 