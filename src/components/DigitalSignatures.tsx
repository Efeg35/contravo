'use client';

import React, { useState, useEffect } from 'react';
import { Contract } from '@prisma/client';
import { 
  PenIcon, 
  UserIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  PlusIcon,
  TrashIcon,
  SendIcon
} from 'lucide-react';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface DigitalSignature {
  id: string;
  contractId: string;
  userId: string;
  status: 'PENDING' | 'SIGNED' | 'DECLINED' | 'EXPIRED' | 'CANCELLED';
  signedAt: string | null;
  expiresAt: string;
  order: number;
  isRequired: boolean;
  declineReason: string | null;
  user: User;
  createdAt: string;
}

interface SignaturePackage {
  id: string;
  contractId: string;
  title: string;
  description: string | null;
  status: 'DRAFT' | 'SENT' | 'IN_PROGRESS' | 'COMPLETED' | 'EXPIRED' | 'CANCELLED';
  expiresAt: string;
  sendReminders: boolean;
  allowDecline: boolean;
  completedAt: string | null;
  createdBy: User;
}

interface DigitalSignaturesProps {
  contract: Contract;
  onUpdate?: () => void;
}

interface NewSigner {
  userId: string;
  email: string;
  name: string;
  isRequired: boolean;
}

const DigitalSignatures: React.FC<DigitalSignaturesProps> = ({ 
  contract, 
  onUpdate 
}) => {
  const [signaturePackage, setSignaturePackage] = useState<SignaturePackage | null>(null);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);

  // Yeni imza paketi formu state'leri
  const [newPackage, setNewPackage] = useState({
    title: `${contract.title} - Dijital İmza Paketi`,
    description: '',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 gün sonra
    sendReminders: true,
    allowDecline: true
  });
  const [newSigners, setNewSigners] = useState<NewSigner[]>([]);

  // İmza verilerini yükle
  const loadSignatures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contract.id}/signatures`);
      
      if (!response.ok) {
        throw new Error('İmza verileri yüklenemedi');
      }

      const data = await response.json();
      setSignaturePackage(data.signaturePackage);
      setSignatures(data.signatures || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcıları yükle
  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const users = await response.json();
        setAvailableUsers(users);
      }
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
    }
  };

  useEffect(() => {
    loadSignatures();
    loadUsers();
  }, [contract.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // İmza paketi oluştur
  const createSignaturePackage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contract.id}/signatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPackage,
          signers: newSigners
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'İmza paketi oluşturulamadı');
      }

      await loadSignatures();
      setShowCreateForm(false);
      onUpdate?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // İmzacı ekle
  const addSigner = () => {
    setNewSigners([...newSigners, {
      userId: '',
      email: '',
      name: '',
      isRequired: true
    }]);
  };

  // İmzacı kaldır
  const removeSigner = (index: number) => {
    setNewSigners(newSigners.filter((_, i) => i !== index));
  };

  // İmzacı güncelle
  const updateSigner = (index: number, field: keyof NewSigner, value: string | boolean) => {
    const updated = [...newSigners];
    updated[index] = { ...updated[index], [field]: value };
    
    // Kullanıcı seçildiğinde email ve name'i otomatik doldur
    if (field === 'userId' && value) {
      const user = availableUsers.find(u => u.id === value);
      if (user) {
        updated[index].email = user.email || '';
        updated[index].name = user.name || '';
      }
    }
    
    setNewSigners(updated);
  };

  // İmza durumu
  const signContract = async (signatureId: string, signatureData: string) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/signatures/${signatureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'sign',
          signatureData
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'İmza işlemi başarısız');
      }

      await loadSignatures();
      onUpdate?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'İmza hatası');
    }
  };

  // İmzayı reddet
  const declineSignature = async (signatureId: string, reason: string) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/signatures/${signatureId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'decline',
          declineReason: reason
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Reddetme işlemi başarısız');
      }

      await loadSignatures();
      onUpdate?.();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Reddetme hatası');
    }
  };

  // Durum renkleri
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'text-green-600 bg-green-50';
      case 'DECLINED': return 'text-red-600 bg-red-50';
      case 'EXPIRED': return 'text-gray-600 bg-gray-50';
      case 'CANCELLED': return 'text-gray-600 bg-gray-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Bekliyor';
      case 'SIGNED': return 'İmzalandı';
      case 'DECLINED': return 'Reddedildi';
      case 'EXPIRED': return 'Süresi Doldu';
      case 'CANCELLED': return 'İptal Edildi';
      case 'DRAFT': return 'Taslak';
      case 'SENT': return 'Gönderildi';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'COMPLETED': return 'Tamamlandı';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <PenIcon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-medium text-gray-900">Dijital İmzalar</h3>
        </div>
        
        {!signaturePackage && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            İmza Paketi Oluştur
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* İmza Paketi Oluşturma Formu */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="text-md font-medium text-gray-900 mb-4">Yeni İmza Paketi</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Başlık</label>
              <input
                type="text"
                value={newPackage.title}
                onChange={(e) => setNewPackage({ ...newPackage, title: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Son Tarih</label>
              <input
                type="date"
                value={newPackage.expiresAt}
                onChange={(e) => setNewPackage({ ...newPackage, expiresAt: e.target.value })}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Açıklama</label>
            <textarea
              value={newPackage.description}
              onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
              rows={2}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="flex items-center space-x-4 mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newPackage.sendReminders}
                onChange={(e) => setNewPackage({ ...newPackage, sendReminders: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Hatırlatma gönder</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={newPackage.allowDecline}
                onChange={(e) => setNewPackage({ ...newPackage, allowDecline: e.target.checked })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Reddetmeye izin ver</span>
            </label>
          </div>

          {/* İmzacılar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">İmzacılar</label>
              <button
                onClick={addSigner}
                className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                <PlusIcon className="h-3 w-3 mr-1" />
                İmzacı Ekle
              </button>
            </div>
            
            {newSigners.map((signer, index) => (
              <div key={index} className="flex items-center space-x-2 mb-2">
                <select
                  value={signer.userId}
                  onChange={(e) => updateSigner(index, 'userId', e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="">Kullanıcı Seçin</option>
                  {availableUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={signer.isRequired}
                    onChange={(e) => updateSigner(index, 'isRequired', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-1 text-xs text-gray-600">Zorunlu</span>
                </label>
                
                <button
                  onClick={() => removeSigner(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={createSignaturePackage}
              disabled={newSigners.length === 0 || !newPackage.title}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SendIcon className="h-4 w-4 mr-2" />
              Paketi Oluştur ve Gönder
            </button>
            
            <button
              onClick={() => setShowCreateForm(false)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {/* İmza Paketi Bilgileri */}
      {signaturePackage && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-gray-900">{signaturePackage.title}</h4>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signaturePackage.status)}`}>
              {getStatusText(signaturePackage.status)}
            </span>
          </div>
          
          {signaturePackage.description && (
            <p className="text-sm text-gray-600 mb-3">{signaturePackage.description}</p>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Son Tarih:</span>
              <p className="text-gray-600">{new Date(signaturePackage.expiresAt).toLocaleDateString('tr-TR')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Oluşturan:</span>
              <p className="text-gray-600">{signaturePackage.createdBy.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Hatırlatma:</span>
              <p className="text-gray-600">{signaturePackage.sendReminders ? 'Açık' : 'Kapalı'}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reddetme:</span>
              <p className="text-gray-600">{signaturePackage.allowDecline ? 'İzinli' : 'Yasak'}</p>
            </div>
          </div>
        </div>
      )}

      {/* İmza Listesi */}
      {signatures.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">İmzacılar ({signatures.length})</h4>
          
          {signatures.map((signature) => (
            <div key={signature.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <UserIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {signature.user.name} ({signature.order}. sıra)
                  </p>
                  <p className="text-sm text-gray-500">{signature.user.email}</p>
                  {signature.signedAt && (
                    <p className="text-xs text-gray-500">
                      İmzalandı: {new Date(signature.signedAt).toLocaleString('tr-TR')}
                    </p>
                  )}
                  {signature.declineReason && (
                    <p className="text-xs text-red-600">
                      Red sebebi: {signature.declineReason}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {signature.isRequired && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Zorunlu
                  </span>
                )}
                
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(signature.status)}`}>
                  {signature.status === 'SIGNED' && <CheckCircleIcon className="h-3 w-3 mr-1" />}
                  {signature.status === 'DECLINED' && <XCircleIcon className="h-3 w-3 mr-1" />}
                  {signature.status === 'PENDING' && <ClockIcon className="h-3 w-3 mr-1" />}
                  {getStatusText(signature.status)}
                </span>

                {/* İmza butonları (sadece kendi imzası için) */}
                {signature.status === 'PENDING' && (
                  <div className="flex space-x-1">
                    <button
                      onClick={() => signContract(signature.id, `signature_${Date.now()}`)}
                      className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                    >
                      İmzala
                    </button>
                    
                    {signaturePackage?.allowDecline && (
                      <button
                        onClick={() => {
                          const reason = prompt('Reddetme sebebi:');
                          if (reason) declineSignature(signature.id, reason);
                        }}
                        className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Reddet
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : signaturePackage ? (
        <div className="text-center py-6">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">İmzacı bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">Bu paket için henüz imzacı eklenmemiş.</p>
        </div>
      ) : (
        <div className="text-center py-6">
          <PenIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">İmza paketi bulunamadı</h3>
          <p className="mt-1 text-sm text-gray-500">
            Bu sözleşme için dijital imza paketi oluşturmak üzere yukarıdaki butonu kullanın.
          </p>
        </div>
      )}
    </div>
  );
};

export default DigitalSignatures; 