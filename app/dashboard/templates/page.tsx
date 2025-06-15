'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface ContractTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  usageCount: number;
  isPublic: boolean;
  createdAt: string;
  createdBy: {
    id: string;
    name?: string;
    email?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  _count: {
    contracts: number;
  };
}

interface TemplatesResponse {
  templates: ContractTemplate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const TEMPLATE_CATEGORIES = {
  ALL: 'Tümü',
  EMPLOYMENT: 'İş Sözleşmeleri',
  SERVICE: 'Hizmet Sözleşmeleri',
  PARTNERSHIP: 'Ortaklık Sözleşmeleri',
  SALES: 'Satış Sözleşmeleri',
  RENTAL: 'Kira Sözleşmeleri',
  CONSULTING: 'Danışmanlık Sözleşmeleri',
  NDA: 'Gizlilik Sözleşmeleri',
  SUPPLY: 'Tedarik Sözleşmeleri',
  OTHER: 'Diğer',
};

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    EMPLOYMENT: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    SERVICE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
    PARTNERSHIP: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
    SALES: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
    RENTAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    CONSULTING: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
    NDA: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    SUPPLY: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300',
    OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
  };
  return colors[category] || colors.OTHER;
};

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCategory !== 'ALL' && { category: selectedCategory }),
      });

      const response = await fetch(`/api/templates?${params}`);
      if (!response.ok) {
        throw new Error('Şablonlar yüklenemedi');
      }

      const data: TemplatesResponse = await response.json();
      setTemplates(data.templates);
      setPagination(data.pagination);
    } catch {
      console.error('Templates fetch error:');
      toast.error('Şablonlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplatesCallback = useCallback(fetchTemplates, [selectedCategory, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchTemplatesCallback();
  }, [fetchTemplatesCallback]);

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Şablon silinemedi');
      }

      const result = await response.json();
      toast.success(result.message || 'Şablon başarıyla silindi');
      fetchTemplates();
    } catch (error: any) {
      console.error('Template delete error:');
      toast.error(error instanceof Error ? error.message : 'Şablon silinirken hata oluştu');
    }
  };

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/dashboard" 
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Dashboard</span>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sözleşme Şablonları
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Hazır şablonlarla hızlı sözleşme oluşturun
              </p>
            </div>
            <Link href="/dashboard/templates/new">
              <Button>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Yeni Şablon
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Şablon ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TEMPLATE_CATEGORIES).map(([key, label]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <svg className="w-12 h-12 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Henüz şablon yok
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                İlk sözleşme şablonunuzu oluşturun.
              </p>
              <Link href="/dashboard/templates/new">
                <Button>Şablon Oluştur</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900 dark:text-white mb-1">
                        {template.title}
                      </CardTitle>
                      <Badge className={getCategoryColor(template.category)}>
                        {TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES]}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      {template.isPublic && (
                        <Badge variant="secondary">Public</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {template.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Kullanım:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template._count.contracts} sözleşme
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Oluşturan:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {template.createdBy.name || template.createdBy.email}
                      </span>
                    </div>
                    {template.company && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Şirket:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {template.company.name}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link href={`/dashboard/templates/${template.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        Görüntüle
                      </Button>
                    </Link>
                    <Link href={`/dashboard/contracts/new?template=${template.id}`}>
                      <Button size="sm">
                        Kullan
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
              >
                Önceki
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Sayfa {pagination.page} / {pagination.pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.pages}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 