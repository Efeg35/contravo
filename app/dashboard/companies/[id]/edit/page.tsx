'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Textarea } from '../../../../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';

interface FormData {
  name: string;
  description: string;
  address: string;
  phone: string;
  website: string;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditCompanyPage({ params }: PageProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    phone: '',
    website: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  
  const resolvedParams = use(params);

  const fetchCompany = useCallback(async () => {
    try {
      const response = await fetch(`/api/companies/${resolvedParams.id}`);
      if (response.ok) {
        const company = await response.json();
        setFormData({
          name: company.name || '',
          description: company.description || '',
          address: company.address || '',
          phone: company.phone || '',
          website: company.website || '',
        });
      } else if (response.status === 404) {
        toast.error('Şirket bulunamadı');
        router.push('/dashboard/companies');
      } else {
        toast.error('Şirket bilgileri yüklenirken hata oluştu');
      }
    } catch (_error) {
      console.error('Error fetching company:');
      toast.error('Şirket bilgileri yüklenirken hata oluştu');
    } finally {
      setFetching(false);
    }
  }, [resolvedParams.id, router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    fetchCompany();
  }, [session, status, router, resolvedParams.id, fetchCompany]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Şirket adı zorunludur';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Şirket adı en az 2 karakter olmalıdır';
    }

    if (formData.website && formData.website.trim()) {
      try {
        new URL(formData.website);
      } catch (_error) {
        newErrors.website = 'Geçerli bir website URL\'si giriniz';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/companies/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          address: formData.address.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          website: formData.website.trim() || undefined,
        }),
      });

      if (response.ok) {
        toast.success('Şirket başarıyla güncellendi');
        router.push(`/dashboard/companies/${resolvedParams.id}`);
      } else {
        const error = await response.json();
        if (error.issues) {
          // Zod validation errors
          const newErrors: Partial<FormData> = {};
                     error.issues.forEach((issue: { path?: string[]; message: string }) => {
            if (issue.path && issue.path[0]) {
              newErrors[issue.path[0] as keyof FormData] = issue.message;
            }
          });
          setErrors(newErrors);
        } else {
          toast.error(error.error || 'Şirket güncellenirken hata oluştu');
        }
      }
    } catch (_error) {
      console.error('Error updating company:');
      toast.error('Şirket güncellenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (status === 'loading' || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href={`/dashboard/companies/${resolvedParams.id}`}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Şirket Düzenle
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Şirket bilgilerini güncelleyin
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Şirket Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Şirket Adı *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Şirket adını giriniz"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Açıklama
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Şirket hakkında kısa açıklama"
                  rows={3}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Adres
                </label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Şirket adresi"
                  rows={2}
                  className={errors.address ? 'border-red-500' : ''}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Telefon
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+90 XXX XXX XX XX"
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.phone}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Website
                  </label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleInputChange('website', e.target.value)}
                    placeholder="https://example.com"
                    className={errors.website ? 'border-red-500' : ''}
                  />
                  {errors.website && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.website}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link href={`/dashboard/companies/${resolvedParams.id}`}>
                  <Button variant="outline" type="button">
                    İptal
                  </Button>
                </Link>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Güncelleniyor...
                    </>
                  ) : (
                    'Güncelle'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 