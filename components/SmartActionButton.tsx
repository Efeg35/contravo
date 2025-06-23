'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
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
  workflowTemplateId?: string;
  onActionComplete?: () => void;
}

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  department?: string;
  departmentRole?: string;
  category?: string;
  displayName?: string;
}

export default function SmartActionButton({ 
  contractId, 
  nextAction, 
  workflowTemplateId,
  onActionComplete 
}: SmartActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [availableApprovers, setAvailableApprovers] = useState<User[]>([]);
  const [availableSigners, setAvailableSigners] = useState<User[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);
  const [selectedSigners, setSelectedSigners] = useState<string[]>([]);
  const [loadingApprovers, setLoadingApprovers] = useState(false);
  const [loadingSigners, setLoadingSigners] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

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

  // İmzalayıcıları yükle
  const loadSigners = async () => {
    setLoadingSigners(true);
    try {
      const response = await fetch(`/api/contracts/${contractId}/potential-signers`);
      if (response.ok) {
        const data = await response.json();
        setAvailableSigners(data.users || []);
      }
    } catch (error) {
      console.error('İmzalayıcılar yüklenirken hata:', error);
    } finally {
      setLoadingSigners(false);
    }
  };

  // Modal açıldığında onaylayıcıları yükle
  useEffect(() => {
    if (showApprovalModal && availableApprovers.length === 0) {
      loadApprovers();
    }
  }, [showApprovalModal, availableApprovers.length]);

  // Session yüklenene kadar bekle
  if (status === 'loading') {
    return (
      <Button disabled className="bg-gray-400 text-white px-6 py-3 rounded-lg">
        Yükleniyor...
      </Button>
    );
  }

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
        body: JSON.stringify({ 
          approverIds: selectedApprovers,
          workflowTemplateId 
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API Response:', result);
        
        setShowApprovalModal(false);
        setSelectedApprovers([]);
        
        // Başarılı olduğunda toast bildirimi göster
        if (result.firstApproverName) {
          toast.success(`Başarılı! Sözleşmeniz '${result.firstApproverName}'na onay için gönderildi.`);
        } else {
          toast.success('Onay istekleri başarıyla gönderildi!');
        }
        
        // Başarılı olduğunda callback'i çağır
        if (onActionComplete) {
          onActionComplete();
        }
        
        // Sayfayı yenile
        router.refresh();
        
        console.log('Onay istekleri başarıyla gönderildi');
      } else {
        // Hata detayını al
        const errorData = await response.text();
        console.error('API Error Response:', errorData);
        console.error('Response Status:', response.status);
        throw new Error(`API isteği başarısız oldu: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('Onay gönderme hatası:', error);
      alert(`Bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
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
          // Önce kullanıcının approval'ını bul
          const approvalsResponse = await fetch(`/api/contracts/${contractId}/approvals`);
          if (!approvalsResponse.ok) {
            throw new Error('Approval bilgileri alınamadı');
          }
          
          const approvalsData = await approvalsResponse.json();
          console.log('Approvals data:', approvalsData);
          console.log('Current user ID:', session?.user?.id);
          
          const userApproval = approvalsData.approvals?.find((approval: any) => 
            approval.approver.id === session?.user?.id && 
            ['PENDING', 'REVISION_REQUESTED'].includes(approval.status)
          );
          
          console.log('Found user approval:', userApproval);
          
          if (!userApproval) {
            throw new Error('Onaylanacak approval bulunamadı. Lütfen sayfayı yenileyin.');
          }
          
          // Şimdi approval'ı güncelle
          response = await fetch(`/api/contracts/${contractId}/approvals/${userApproval.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              status: 'APPROVED',
              comment: 'Onaylandı' 
            })
          });
          
          console.log('Approval update response status:', response.status);
          break;

        case 'SEND_FOR_SIGNATURE':
          setShowSignatureModal(true);
          loadSigners();
          return; // Modal açılacak, API çağrısı yapmıyoruz

        case 'SIGN_DOCUMENT':
          response = await fetch(`/api/contracts/${contractId}/signatures`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              signatureData: `signed_${Date.now()}_${session?.user?.id}` // Basit imza verisi
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

  const handleSignatureSubmit = async () => {
    if (selectedSigners.length === 0) return;
    
    setIsLoading(true);
    try {
      // Önce sözleşme durumunu güncelle ve ilk imzacıya assign et
      const contractResponse = await fetch(`/api/contracts/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'SENT_FOR_SIGNATURE',
          assignedToId: selectedSigners[0]
        })
      });

      if (!contractResponse.ok) {
        throw new Error('Sözleşme durumu güncellenemedi');
      }

      // Sonra imzalayıcıları ekle
      const signatureResponse = await fetch(`/api/contracts/${contractId}/signatures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'CREATE_SIGNATURE_PACKAGE',
          signerIds: selectedSigners
        })
      });

      if (!signatureResponse.ok) {
        throw new Error('İmza paketi oluşturulamadı');
      }

      setShowSignatureModal(false);
      setSelectedSigners([]);
      
      if (onActionComplete) {
        onActionComplete();
      }
      
      router.refresh();
      
    } catch (error) {
      console.error('İmza gönderme hatası:', error);
      alert('İmza gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
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
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {user.displayName || user.name}
                              </div>
                              {user.category && (
                                <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                  {user.category}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {user.email}
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

      {/* İmzalayıcı Seçim Modalı */}
      {showSignatureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                İmzalayıcı Seçin
              </h3>
              <button
                onClick={() => setShowSignatureModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {loadingSigners ? (
              <div className="flex items-center justify-center py-8">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">İmzalayıcılar yükleniyor...</span>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-3">
                    Bu sözleşmeyi imzalamasını istediğiniz kişileri seçin:
                  </p>
                  
                  {availableSigners.length === 0 ? (
                    <p className="text-sm text-gray-500">İmzalayıcı bulunamadı.</p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {availableSigners.map((user) => (
                        <label
                          key={user.id}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                        >
                          <input
                            type="checkbox"
                            checked={selectedSigners.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSigners([...selectedSigners, user.id]);
                              } else {
                                setSelectedSigners(
                                  selectedSigners.filter(id => id !== user.id)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {user.name}
                              </div>
                              {user.category && (
                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                                  {user.category}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {user.email}
                            </div>
                            {(user.department || user.departmentRole) && (
                              <div className="text-xs text-gray-600 mt-1">
                                {user.department && user.departmentRole 
                                  ? `${user.department} • ${user.departmentRole}`
                                  : user.department || user.departmentRole
                                }
                              </div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => setShowSignatureModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleSignatureSubmit}
                    disabled={selectedSigners.length === 0 || isLoading}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    {isLoading ? (
                      <>
                        <ArrowPathIcon className="h-4 w-4 animate-spin mr-2" />
                        Gönderiliyor...
                      </>
                    ) : (
                      `İmzaya Gönder (${selectedSigners.length})`
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