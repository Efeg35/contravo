'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';

interface FormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface PasswordStrength {
  score: number;
  level: string;
  feedback: string[];
  estimatedCrackTime: string;
  passed: boolean;
}

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  minSpecialChars: number;
  preventCommonPasswords: boolean;
  preventPersonalInfo: boolean;
  historyLimit: number;
  expirationDays?: number;
}

export default function ChangePasswordPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  const [passwordPolicy, setPasswordPolicy] = useState<PasswordPolicy | null>(null);

  // Load password policy on component mount
  useEffect(() => {
    const loadPasswordPolicy = async () => {
      try {
        const response = await fetch('/api/user/password-info');
        if (response.ok) {
          const data = await response.json();
          setPasswordPolicy(data.policy);
        }
      } catch (_error) {
        console.error('Error loading password policy:');
      }
    };

    if (session?.user) {
      loadPasswordPolicy();
    }
  }, [session]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/login');
    return null;
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Mevcut şifre zorunludur';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Yeni şifre zorunludur';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Yeni şifre en az 8 karakter olmalıdır';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifre onayı zorunludur';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
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
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success('Şifre başarıyla güncellendi');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
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
          toast.error(error.error || 'Şifre güncellenirken hata oluştu');
        }
      }
    } catch (_error) {
      console.error('Error updating password:');
      toast.error('Şifre güncellenirken hata oluştu');
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
    
    // Check password strength when new password changes
    if (field === 'newPassword') {
      checkPasswordStrength(value);
    }
  };

  // Check password strength in real-time
  const checkPasswordStrength = async (password: string) => {
    if (password.length === 0) {
      setPasswordStrength(null);
      return;
    }

    try {
      const response = await fetch('/api/user/password-strength', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          password,
          userInfo: session?.user ? {
            email: session.user.email,
            name: session.user.name,
            id: session.user.id
          } : undefined
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setPasswordStrength(data.strength);
      }
    } catch (_error) {
      console.error('Error checking password strength:');
    }
  };

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
                Şifre Değiştir
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Hesabınızın güvenliği için güçlü bir şifre kullanın
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Şifre Güncelleme</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mevcut Şifre *
                </label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={formData.currentPassword}
                    onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                    placeholder="Mevcut şifrenizi giriniz"
                    className={errors.currentPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showCurrentPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-0.415-0.415m4.242 4.242l2.829 2.829m-2.829-2.829l-0.415-0.415M15.536 8.464l-0.415-0.415" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yeni Şifre *
                </label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => handleInputChange('newPassword', e.target.value)}
                    placeholder="Yeni şifrenizi giriniz"
                    className={errors.newPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showNewPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-0.415-0.415m4.242 4.242l2.829 2.829m-2.829-2.829l-0.415-0.415M15.536 8.464l-0.415-0.415" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                {formData.newPassword && passwordStrength && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength.score === 0 || passwordStrength.score === 1 ? 'bg-red-500 w-1/4' :
                            passwordStrength.score === 2 ? 'bg-yellow-500 w-2/4' :
                            passwordStrength.score === 3 ? 'bg-green-500 w-3/4' :
                            passwordStrength.score === 4 ? 'bg-green-600 w-full' : 'w-0'
                          }`}
                        />
                      </div>
                      <span className={`text-xs font-medium ${
                        passwordStrength.score === 0 || passwordStrength.score === 1 ? 'text-red-600' :
                        passwordStrength.score === 2 ? 'text-yellow-600' :
                        passwordStrength.score === 3 ? 'text-green-600' :
                        'text-green-700'
                      }`}>
                        {passwordStrength.level}
                      </span>
                    </div>
                    {passwordStrength.feedback && passwordStrength.feedback.length > 0 && (
                      <div className="mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {passwordStrength.feedback.join(', ')}
                        </p>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Kırılma süresi: {passwordStrength.estimatedCrackTime}
                    </p>
                  </div>
                )}
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
                )}
                {passwordPolicy && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>
                      Şifre gereksinimleri: En az {passwordPolicy.minLength} karakter
                      {passwordPolicy.requireUppercase && ', büyük harf'}
                      {passwordPolicy.requireLowercase && ', küçük harf'}
                      {passwordPolicy.requireNumbers && ', rakam'}
                      {passwordPolicy.requireSpecialChars && `, en az ${passwordPolicy.minSpecialChars} özel karakter`}
                      {passwordPolicy.preventCommonPasswords && ', yaygın şifreler yasak'}
                      {passwordPolicy.preventPersonalInfo && ', kişisel bilgi yasak'}
                      {passwordPolicy.historyLimit > 0 && `, son ${passwordPolicy.historyLimit} şifre tekrar edilemez`}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yeni Şifre Onayı *
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Yeni şifrenizi tekrar giriniz"
                    className={errors.confirmPassword ? 'border-red-500' : ''}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {showConfirmPassword ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878l-0.415-0.415m4.242 4.242l2.829 2.829m-2.829-2.829l-0.415-0.415M15.536 8.464l-0.415-0.415" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      )}
                    </svg>
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
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
                    'Şifre Güncelle'
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