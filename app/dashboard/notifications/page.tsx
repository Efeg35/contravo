'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/button';
import { Card, CardContent } from '../../../components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'CONTRACT_EXPIRING' | 'CONTRACT_EXPIRED' | 'CONTRACT_REMINDER' | 'APPROVAL_NEEDED' | 'APPROVAL_RECEIVED' | 'VERSION_CREATED';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  contractId?: string;
  metadata?: Record<string, unknown>;
}

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'CONTRACT_EXPIRING',
      title: 'Sözleşme sona eriyor',
      message: 'ABC Şirketi ile olan hizmet sözleşmeniz 15 gün içinde sona erecek.',
      isRead: false,
      createdAt: '2024-01-15T10:30:00Z',
      contractId: 'contract-1'
    },
    {
      id: '2', 
      type: 'APPROVAL_NEEDED',
      title: 'Onay bekleniyor',
      message: 'Yeni ortaklık sözleşmesi onayınızı bekliyor.',
      isRead: false,
      createdAt: '2024-01-14T14:20:00Z',
      contractId: 'contract-2'
    },
    {
      id: '3',
      type: 'VERSION_CREATED', 
      title: 'Yeni versiyon oluşturuldu',
      message: 'İş sözleşmesi için yeni bir versiyon oluşturuldu.',
      isRead: true,
      createdAt: '2024-01-13T09:15:00Z',
      contractId: 'contract-3'
    }
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [session, status, router]);

  const fetchData = async () => {
    try {
      const notificationsRes = await fetch('/api/notifications');

      if (notificationsRes.ok) {
        const notificationData = await notificationsRes.json();
        setNotifications(notificationData);
      }
    } catch {
      toast.error('Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2">Yükleniyor...</span>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-indigo-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Bildirimler
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={() => {
                  setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                  toast.success('Tüm bildirimler okundu olarak işaretlendi');
                }}
                variant="outline"
              >
                <Check className="h-4 w-4 mr-2" />
                Tümünü Okundu İşaretle
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Henüz bildirim yok
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Yeni bildirimler burada görünecek.
                </p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-4 border-l-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {notification.title}
                        </h3>
                        {!notification.isRead && (
                          <Badge variant="secondary" className="bg-indigo-100 text-indigo-700">
                            Yeni
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {notification.type === 'CONTRACT_EXPIRING' && 'Süresi Doluyor'}
                          {notification.type === 'APPROVAL_NEEDED' && 'Onay Gerekli'}
                          {notification.type === 'VERSION_CREATED' && 'Yeni Versiyon'}
                        </Badge>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 mb-3">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('tr-TR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setNotifications(prev =>
                              prev.map(n =>
                                n.id === notification.id ? { ...n, isRead: true } : n
                              )
                            );
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNotifications(prev => prev.filter(n => n.id !== notification.id));
                          toast.success('Bildirim silindi');
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 