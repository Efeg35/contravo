'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface ContractTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  content: string;
  variables: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'date' | 'select';
    required: boolean;
    options?: string[];
    defaultValue?: string;
  }>;
  usageCount: number;
  isPublic: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
  };
  company?: {
    id: string;
    name: string;
  };
  _count: {
    contracts: number;
  };
}

const TEMPLATE_CATEGORIES = {
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

export default function TemplateDetailPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  
  const [template, setTemplate] = useState<ContractTemplate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error('Şablon bulunamadı');
            router.push('/dashboard/templates');
            return;
          }
          throw new Error('Şablon yüklenemedi');
        }

        const data = await response.json();
        setTemplate(data);
      } catch (_error) {
        console.error('Template fetch error:');
        toast.error('Şablon yüklenirken hata oluştu');
        router.push('/dashboard/templates');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      fetchTemplate();
    }
  }, [templateId, router]);

  const handleUseTemplate = () => {
    router.push(`/dashboard/contracts/new?templateId=${templateId}`);
  };

  const handleDeleteTemplate = async () => {
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

      toast.success('Şablon başarıyla silindi');
      router.push('/dashboard/templates');
    } catch (error: any) {
      console.error('Template delete error:');
      toast.error(error instanceof Error ? error.message : 'Şablon silinirken hata oluştu');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Şablon Bulunamadı
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Aradığınız şablon mevcut değil veya erişim yetkiniz bulunmuyor.
          </p>
          <Link href="/dashboard/templates">
            <Button>Şablonlara Dön</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link 
              href="/dashboard/templates" 
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Şablonlar</span>
            </Link>
          </div>
          
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {template.title}
              </h1>
              {template.description && (
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {template.description}
                </p>
              )}
              <div className="flex items-center space-x-4">
                <Badge variant="secondary">
                  {TEMPLATE_CATEGORIES[template.category as keyof typeof TEMPLATE_CATEGORIES]}
                </Badge>
                {template.isPublic && (
                  <Badge variant="outline">Genel</Badge>
                )}
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {template._count.contracts} kez kullanıldı
                </span>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button onClick={handleUseTemplate}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Bu Şablonu Kullan
              </Button>
              <Link href={`/dashboard/templates/${templateId}/edit`}>
                <Button variant="outline">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Düzenle
                </Button>
              </Link>
              <Button variant="destructive" onClick={handleDeleteTemplate}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Sil
              </Button>
            </div>
          </div>
        </div>

        {/* Template Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Şablon İçeriği</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none dark:prose-invert">
                  <pre className="whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    {template.content}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Template Info */}
            <Card>
              <CardHeader>
                <CardTitle>Şablon Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Oluşturan
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {template.createdBy.name || template.createdBy.email}
                  </p>
                </div>
                {template.company && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Şirket
                    </label>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {template.company.name}
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Oluşturulma Tarihi
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(template.createdAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Son Güncelleme
                  </label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Variables */}
            {template.variables && template.variables.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Şablon Değişkenleri</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {template.variables.map((variable, index) => (
                      <div key={index} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {variable.label}
                          </span>
                          {variable.required && (
                            <Badge variant="destructive" className="text-xs">
                              Zorunlu
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Tip: {variable.type} | Değişken: {variable.name}
                        </p>
                        {variable.defaultValue && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                            Varsayılan: {variable.defaultValue}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 