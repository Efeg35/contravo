'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  PencilIcon,
  ArrowPathIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { NextAction } from '@/src/lib/contract-helper';

interface SmartActionButtonProps {
  contractId: string;
  nextAction: NextAction;
  onActionComplete?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export default function SmartActionButton({ 
  contractId, 
  nextAction, 
  onActionComplete 
}: SmartActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [availableApprovers, setAvailableApprovers] = useState<User[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const router = useRouter();

  // Onaylayıcıları yükle
  const loadApprovers = async () => {
    setLoadingApprovers(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/potential-approvers`);
      if (response.ok) {
        const data = await response.json();
        setAvailableApprovers(data.users || []);
      }
    } catch (error) {
      console.error('Onaylayıcılar yüklenemedi:', error);
    } finally {
      setLoadingApprovers(false);
    }
  };

  // Modal açıldığında onaylayıcıları yükle
  useEffect(() => {
    if (showApprovalModal && availableApprovers.length === 0) {
      loadApprovers();
    }
  }, [showApprovalModal]);

  // Eğer action yoksa hiçbir şey render etme
  if (!nextAction.action || !nextAction.label) {
    return null;
  }

  // Action tipine göre ikon belirle
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'REQUEST_APPROVAL':
        return CheckCircleIcon;
      case 'APPROVE_CONTRACT':
        return CheckCircleIcon;
      case 'SEND_FOR_SIGNATURE':
        return DocumentTextIcon;
      case 'SIGN_DOCUMENT':
        return PencilIcon;
      case 'ACTIVATE_CONTRACT':
        return ArrowPathIcon;
      default:
        return DocumentTextIcon;
    }
  };

  // Action tipine göre buton rengini belirle
  const getButtonVariant = (action: string): "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" => {
    switch (action) {
      case 'REQUEST_APPROVAL':
        return 'default';
      case 'APPROVE_CONTRACT':
        return 'default';
      case 'SEND_FOR_SIGNATURE':
        return 'default';
      case 'SIGN_DOCUMENT':
        return 'default';
      case 'ACTIVATE_CONTRACT':
        return 'default';
      default:
        return 'default';
    }
  };

  // Onaylayıcı seçimini onayla
  const handleApprovalSubmit = async () => {
    if (selectedApprovers.length === 0) {
      alert('Lütfen en az bir onaylayıcı seçin.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch(`/api/contracts/${contractId}/approvals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approverIds: selectedApprovers })
      });

      if (response.ok) {
        setShowApprovalModal(false);
        setSelectedApprovers([]);
        
        // Başarılı olduğunda callback'i çağır
        if (onActionComplete) {
          onActionComplete();
        }
        
        // Sayfayı yenile
        router.refresh();
        
        console.log('Onay istekleri başarıyla gönderildi');
      } else {
        throw new Error('API isteği başarısız oldu');
      }
    } catch (error) {
      console.error('Onay gönderme hatası:', error);
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  // Server Action'ları çağıran fonksiyon
  const handleAction = async () => {
    if (isLoading) return;

    // REQUEST_APPROVAL için modal aç
    if (nextAction.action === 'REQUEST_APPROVAL') {
      setShowApprovalModal(true);
      return;
    }

    setIsLoading(true);
    
    try {
      let response;
      
      switch (nextAction.action) {

        case 'APPROVE_CONTRACT':
          response = await fetch(`/api/contracts/${contractId}/approvals`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'APPROVE', 
              status: 'APPROVED',
              comment: 'Otomatik onay' 
            })
          });
          break;

        case 'SEND_FOR_SIGNATURE':
          response = await fetch(`/api/contracts/${contractId}/signatures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'SEND_FOR_SIGNATURE' })
          });
          break;

        case 'SIGN_DOCUMENT':
          response = await fetch(`/api/contracts/${contractId}/signatures`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              action: 'SIGN',
              signatureData: `signed_${Date.now()}` // Basit imza verisi
            })
          });
          break;

        case 'ACTIVATE_CONTRACT':
          response = await fetch(`/api/contracts/${contractId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'ACTIVE'
            })
          });
          break;

        default:
          console.error('Bilinmeyen eylem:', nextAction.action);
          return;
      }

      if (response && response.ok) {
        // Başarılı olduğunda callback'i çağır
        if (onActionComplete) {
          onActionComplete();
        }
        
        // Sayfayı yenile
        router.refresh();
        
        // Başarı bildirimi (isteğe bağlı)
        console.log('Eylem başarıyla tamamlandı:', nextAction.label);
      } else {
        throw new Error('API isteği başarısız oldu');
      }

    } catch (error) {
      console.error('Eylem hatası:', error);
      // Hata bildirimi (isteğe bağlı - toast notification eklenebilir)
      alert('Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsLoading(false);
    }
  };

  const ActionIcon = getActionIcon(nextAction.action);

  return (
    <>
      <Button
        onClick={handleAction}
        disabled={isLoading}
        variant={getButtonVariant(nextAction.action)}
        size="lg"
        className="
          bg-blue-600 hover:bg-blue-700 
          text-white font-semibold 
          px-6 py-3 
          rounded-lg 
          shadow-md hover:shadow-lg 
          transition-all duration-200 
          flex items-center gap-2
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      >
        {isLoading ? (
          <ArrowPathIcon className="h-5 w-5 animate-spin" />
        ) : (
          <ActionIcon className="h-5 w-5" />
        )}
        {isLoading ? 'İşleniyor...' : nextAction.label}
      </Button>

      {/* Onaylayıcı Seçim Modalı */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Onaylayıcı Seçin
              </h3>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loadingApprovers ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Kullanıcılar yükleniyor...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Bu sözleşmeyi onaylamasını istediğiniz kişileri seçin:
                  </p>
                  
                  {availableApprovers.length === 0 ? (
                    <p className="text-sm text-gray-500">Onaylayıcı bulunamadı.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableApprovers.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedApprovers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedApprovers([...selectedApprovers, user.id]);
                              } else {
                                setSelectedApprovers(
                                  selectedApprovers.filter(id => id !== user.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {user.email}
                              {user.role && ` • ${user.role}`}
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowApprovalModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleApprovalSubmit}
                    disabled={selectedApprovers.length === 0 || isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      `Onaya Gönder (${selectedApprovers.length})`
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
} 