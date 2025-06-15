'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { downloadContractPDF, ContractData } from '../../../../lib/pdfGenerator';
import FileUpload from '../../../../components/FileUpload';
import AttachmentList from '../../../../components/AttachmentList';
import ContractApproval from '../../../../components/ContractApproval';
import ContractVersions from '../../../../components/ContractVersions';
import DigitalSignatures from '../../../../components/DigitalSignatures';
import ContractEditor from '../../../../components/ContractEditor';

interface ContractDetail {
  id: string;
  title: string;
  description?: string;
  content?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'ARCHIVED';
  type: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  expirationDate?: string;    // 📅 SONA ERİŞ TARİHİ - Anahtar Tarih Takibi
  noticePeriodDays?: number;  // 📢 FESİH İHBAR SÜRESİ - Kritik Tarih Hesaplaması
  otherPartyName?: string;
  otherPartyEmail?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    name?: string;
    email: string;
  };
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ContractDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contract, setContract] = useState<ContractDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ContractDetail>>({});
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setContract(data);
          setEditData(data);
        } else if (response.status === 404) {
          toast.error('Sözleşme bulunamadı');
          router.push('/dashboard/contracts');
        } else {
          toast.error('Sözleşme yüklenirken bir hata oluştu');
          console.error('Failed to fetch contract');
        }
      } catch (error) {
        toast.error('Bağlantı hatası oluştu');
        console.error('Error fetching contract:');
      } finally {
        setLoading(false);
      }
    };

    if (session && id) {
      fetchContract();
    }
  }, [session, id, router]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'ARCHIVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'İmzalandı';
      case 'IN_REVIEW': return 'İncelemede';
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      case 'DRAFT': return 'Taslak';
      case 'ARCHIVED': return 'Arşivlendi';
      default: return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'general': return 'Genel Sözleşme';
      case 'procurement': return 'Tedarik Sözleşmesi';
      case 'service': return 'Hizmet Sözleşmesi';
      case 'sales': return 'Satış Sözleşmesi';
      case 'employment': return 'İş Sözleşmesi';
      case 'partnership': return 'Ortaklık Sözleşmesi';
      case 'nda': return 'Gizlilik Sözleşmesi (NDA)';
      case 'rental': return 'Kira Sözleşmesi';
      default: return type;
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({ ...contract });
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
        setIsEditing(false);
        toast.success('Sözleşme başarıyla güncellendi!');
      } else {
        toast.error('Sözleşme güncellenirken bir hata oluştu');
        console.error('Failed to update contract');
      }
    } catch (error) {
      toast.error('Bağlantı hatası oluştu');
      console.error('Error updating contract:');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({ ...contract });
  };

  const handleDelete = async () => {
    if (confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) {
      try {
        const response = await fetch(`/api/contracts/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          toast.success('Sözleşme başarıyla silindi!');
          router.push('/dashboard/contracts');
        } else {
          toast.error('Sözleşme silinirken bir hata oluştu');
          console.error('Failed to delete contract');
        }
      } catch (error) {
        toast.error('Bağlantı hatası oluştu');
        console.error('Error deleting contract:');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!contract) return;
    
    try {
              const contractData: ContractData = {
          id: contract.id,
          title: contract.title,
                    description: contract.description,
          status: contract.status,
          type: contract.type,
          value: contract.value,
          startDate: contract.startDate,
          endDate: contract.endDate,
          otherPartyName: contract.otherPartyName,
          otherPartyEmail: contract.otherPartyEmail,
        createdAt: contract.createdAt,
        createdBy: contract.createdBy
      };

      await downloadContractPDF(contractData);
      toast.success('PDF başarıyla indirildi!');
    } catch (error) {
      console.error('PDF oluşturma hatası:');
      toast.error('PDF oluşturulurken bir hata oluştu');
    }
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleContractUpdate = () => {
    setRefreshTrigger(prev => prev + 1);
    const fetchContract = async () => {
      try {
        const response = await fetch(`/api/contracts/${id}`);
        if (response.ok) {
          const data = await response.json();
          setContract(data);
        }
      } catch (error) {
        console.error('Error fetching updated contract:', error);
      }
    };
    fetchContract();
  };

  const handleContentChange = async (newContent: string) => {
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
      }
    } catch (error) {
      console.error('Error updating contract content:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Sözleşme yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Sözleşme bulunamadı</h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Aradığınız sözleşme mevcut değil.</p>
          <Link
            href="/dashboard/contracts"
            className="mt-4 inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Sözleşmeler Listesine Dön
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/dashboard/contracts"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Sözleşmeler
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Sözleşme Düzenle' : 'Sözleşme Detayı'}
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              {isEditing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Kaydet
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrint}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Yazdır
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    PDF İndir
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Düzenle
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                  >
                    Sil
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Contract Info */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol taraf - Temel Bilgiler */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Temel Bilgiler</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlık</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.title || ''}
                          onChange={(e) => setEditData({...editData, title: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contract.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Açıklama</label>
                      {isEditing ? (
                        <textarea
                          value={editData.description || ''}
                          onChange={(e) => setEditData({...editData, description: e.target.value})}
                          rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contract.description || 'Açıklama yok'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tür</label>
                      {isEditing ? (
                        <select
                          value={editData.type || ''}
                          onChange={(e) => setEditData({...editData, type: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="general">Genel Sözleşme</option>
                          <option value="procurement">Tedarik Sözleşmesi</option>
                          <option value="service">Hizmet Sözleşmesi</option>
                          <option value="sales">Satış Sözleşmesi</option>
                          <option value="employment">İş Sözleşmesi</option>
                          <option value="partnership">Ortaklık Sözleşmesi</option>
                          <option value="nda">Gizlilik Sözleşmesi (NDA)</option>
                          <option value="rental">Kira Sözleşmesi</option>
                        </select>
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{getTypeText(contract.type)}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Durum</label>
                      {isEditing ? (
                        <select
                          value={editData.status || ''}
                          onChange={(e) => setEditData({...editData, status: e.target.value as ContractDetail['status']})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="DRAFT">Taslak</option>
                          <option value="IN_REVIEW">İncelemede</option>
                          <option value="APPROVED">Onaylandı</option>
                          <option value="REJECTED">Reddedildi</option>
                          <option value="SIGNED">İmzalandı</option>
                          <option value="ARCHIVED">Arşivlendi</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                          {getStatusText(contract.status)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ taraf - Diğer Bilgiler */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Ek Bilgiler</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Değer (TL)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          value={editData.value || ''}
                          onChange={(e) => setEditData({...editData, value: parseFloat(e.target.value) || undefined})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {contract.value ? `₺${contract.value.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Başlangıç Tarihi</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.startDate ? editData.startDate.split('T')[0] : ''}
                          onChange={(e) => setEditData({...editData, startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {contract.startDate ? new Date(contract.startDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bitiş Tarihi</label>
                      {isEditing ? (
                        <input
                          type="date"
                          value={editData.endDate ? editData.endDate.split('T')[0] : ''}
                          onChange={(e) => setEditData({...editData, endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                          {contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : 'Belirtilmemiş'}
                        </p>
                      )}
                    </div>

                    {/* 📅 SONA ERİŞ TARİHİ - Anahtar Tarih Takibi */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        📅 Bitiş Tarihi
                        <span className="text-xs text-gray-500 block">Sözleşmenin sona ereceği kritik tarih</span>
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {contract.expirationDate ? new Date(contract.expirationDate).toLocaleDateString('tr-TR') : 'Henüz belirlenmemiş'}
                      </p>
                    </div>

                    {/* 📢 FESİH İHBAR SÜRESİ - Kritik Tarih Hesaplaması */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        📢 İhbar Süresi
                        <span className="text-xs text-gray-500 block">Fesih için gerekli önceden bildirim süresi</span>
                      </label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {contract.noticePeriodDays ? `${contract.noticePeriodDays} gün` : 'Henüz belirlenmemiş'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diğer Taraf</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.otherPartyName || ''}
                          onChange={(e) => setEditData({...editData, otherPartyName: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contract.otherPartyName || 'Belirtilmemiş'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diğer Taraf E-posta</label>
                      {isEditing ? (
                        <input
                          type="email"
                          value={editData.otherPartyEmail || ''}
                          onChange={(e) => setEditData({...editData, otherPartyEmail: e.target.value})}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      ) : (
                        <p className="mt-1 text-sm text-gray-900 dark:text-white">{contract.otherPartyEmail || 'Belirtilmemiş'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Meta Bilgiler */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <div>
                    <span className="font-medium">Oluşturan:</span> {contract.createdBy.name || contract.createdBy.email}
                  </div>
                  <div>
                    <span className="font-medium">Oluşturulma:</span> {new Date(contract.createdAt).toLocaleString('tr-TR')}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Collaborative Contract Editor */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                📝 Sözleşme İçeriği - Canlı İşbirliği
              </h3>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <ContractEditor
                  contractId={contract.id}
                  initialContent={contract.content || '# Sözleşme İçeriği\n\nSözleşme içeriğinizi buraya yazın...'}
                  onSave={handleContentChange}
                />
              </div>
            </div>
          </div>

          {/* Contract Approval Section */}
          <div className="mb-6">
            <ContractApproval
              contractId={contract.id}
              contractStatus={contract.status}
              isOwner={contract.createdBy.email === session?.user?.email}
              onStatusUpdate={handleContractUpdate}
            />
          </div>

          {/* Contract Versions Section */}
          <div className="mb-6">
            <ContractVersions
              contractId={contract.id}
              isOwner={contract.createdBy.email === session?.user?.email}
              onVersionUpdate={handleContractUpdate}
            />
          </div>

          {/* Digital Signatures Section */}
          <div className="mb-6">
            <DigitalSignatures
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              contract={contract as any}
              onUpdate={handleContractUpdate}
            />
          </div>

          {/* File Upload Section */}
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
            <div className="px-6 py-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Dosya Ekleri</h3>
              
              {/* Upload Component */}
              <div className="mb-6">
                <FileUpload 
                  contractId={contract.id} 
                  onUploadSuccess={handleUploadSuccess}
                />
              </div>

              {/* Attachments List */}
              <div>
                <AttachmentList 
                  contractId={contract.id}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 