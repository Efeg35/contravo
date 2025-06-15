'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

interface FormData {
  name: string;
  email: string;
}

interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  role: string;
  createdAt: string;
}

export default function EditProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const fetchProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const profile: UserProfile = await response.json();
        setFormData({
          name: profile.name || '',
          email: profile.email || '',
        });
      } else {
        toast.error('Profil bilgileri yüklenirken hata oluştu');
        router.push('/dashboard/profile');
      }
    } catch {
      console.error('Error fetching profile:');
      toast.error('Profil bilgileri yüklenirken hata oluştu');
    } finally {
      setFetching(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [session, status, router, fetchProfile]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Ad soyad zorunludur';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Ad soyad en az 2 karakter olmalıdır';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-posta adresi zorunludur';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Geçerli bir e-posta adresi giriniz';
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
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
        }),
      });

      if (response.ok) {
        toast.success('Profil başarıyla güncellendi');
        router.push('/dashboard/profile');
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
          toast.error(error.error || 'Profil güncellenirken hata oluştu');
        }
      }
    } catch {
      console.error('Error updating profile:');
      toast.error('Profil güncellenirken hata oluştu');
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <Link 
              href="/dashboard/profile"
              className="flex items-center space-x-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Profil</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Profili Düzenle
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Profil bilgilerinizi güncelleyin
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Profil Bilgileri</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ad Soyad *
                </label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ad soyadınızı giriniz"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-posta Adresi *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="E-posta adresinizi giriniz"
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  E-posta adresinizi değiştirirseniz, yeni adresinizle giriş yapmanız gerekecek.
                </p>
              </div>

              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link href="/dashboard/profile">
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
                    'Profili Güncelle'
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