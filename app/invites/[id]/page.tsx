'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

interface Invite {
  id: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
  company: {
    id: string;
    name: string;
    description?: string;
  };
  invitedBy: {
    name?: string;
    email: string;
  };
}

export default function InviteAcceptPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvite = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invites/${params.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvite(data);
      } else {
        setError('Davet bulunamadı');
      }
    } catch (error) {
      setError('Davet yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchInvite();
    }
  }, [params.id, fetchInvite]);

  const handleAcceptInvite = async () => {
    if (!session) {
      router.push(`/auth/login?callbackUrl=/invites/${params.id}`);
      return;
    }

    setAccepting(true);

    try {
      const response = await fetch(`/api/invites/${params.id}/accept`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Davet başarıyla kabul edildi!');
        router.push(`/dashboard/companies/${data.companyId}`);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Davet kabul edilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error accepting invite:');
      toast.error('Davet kabul edilirken hata oluştu');
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectInvite = async () => {
    if (!session) return;

    try {
      const response = await fetch(`/api/invites/${params.id}/reject`, {
        method: 'POST',
      });

      if (response.ok) {
        toast.success('Davet reddedildi');
        router.push('/dashboard');
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Davet reddedilirken hata oluştu');
      }
    } catch (error) {
      console.error('Error rejecting invite:');
      toast.error('Davet reddedilirken hata oluştu');
    }
  };

  const getRoleText = (role: string) => {
    return role === 'ADMIN' ? 'Yönetici' : 'Üye';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="w-12 h-12 text-red-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Hata
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              {error}
            </p>
            <Link href="/dashboard">
              <Button>Dashboard'a Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!invite) {
    return null;
  }

  if (invite.status !== 'PENDING') {
    const statusText = invite.status === 'ACCEPTED' ? 'kabul edilmiş' : 'reddedilmiş';
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <svg className="w-12 h-12 text-yellow-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Davet Zaten İşleme Alınmış
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
              Bu davet daha önce {statusText}.
            </p>
            <Link href="/dashboard">
              <Button>Dashboard'a Dön</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-auto flex items-center justify-center">
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">Contravo</h1>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Şirket Daveti
          </h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              🏢 {invite.company.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 dark:text-gray-400">
                <strong>{invite.invitedBy.name || invite.invitedBy.email}</strong> sizi
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {invite.company.name}
              </p>
              <p className="text-gray-600 dark:text-gray-400">
                şirketine <strong>{getRoleText(invite.role)}</strong> olarak katılmaya davet etti.
              </p>
            </div>

            {invite.company.description && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Şirket Hakkında:</strong>
                </p>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {invite.company.description}
                </p>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Davet Tarihi: {new Date(invite.createdAt).toLocaleDateString('tr-TR')}
              </p>
            </div>

            {!session ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Daveti kabul etmek için giriş yapmanız gerekiyor
                </p>
                <div className="flex flex-col space-y-2">
                  <Button 
                    onClick={() => router.push(`/auth/login?callbackUrl=/invites/${params.id}`)}
                    className="w-full"
                  >
                    Giriş Yap ve Kabul Et
                  </Button>
                  <Link 
                    href={`/auth/register?callbackUrl=/invites/${params.id}`}
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full">
                      Kayıt Ol ve Kabul Et
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Button 
                  onClick={handleAcceptInvite}
                  disabled={accepting}
                  className="w-full"
                >
                  {accepting ? 'Kabul Ediliyor...' : '✓ Daveti Kabul Et'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={handleRejectInvite}
                  className="w-full"
                >
                  ✗ Daveti Reddet
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Link 
            href="/dashboard"
            className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Dashboard'a Dön
          </Link>
        </div>
      </div>
    </div>
  );
} 