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
import { createAmendment } from '../../../../src/lib/actions/contract-actions';

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
  parentContract?: {
    id: string;
    title: string;
    status: string;
  };
  amendments?: Array<{
    id: string;
    title: string;
    status: string;
    createdAt: string;
    createdBy: {
      name?: string;
      email: string;
    };
  }>;
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
  const [users, setUsers] = useState<{id: string, name?: string, email: string}[]>([]);
  const [selectedApprovers, setSelectedApprovers] = useState<string[]>([]);

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

  useEffect(() => {
    if (session && id) {
      fetch(`/api/contracts/${id}/approvals`).then(res => res.json()).then(data => {
        if (data.approvals) {
          setSelectedApprovers(data.approvals.map((a: any) => a.approver.id));
        }
      });
      fetch('/api/users').then(res => res.json()).then(data => setUsers(data.users || data));
    }
  }, [session, id]);

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
    setSelectedApprovers(selectedApprovers);
  };

  const handleSave = async () => {
    // Verileri normalize et
    const payload = {
      ...editData,
      value: editData.value === undefined || editData.value === null || String(editData.value) === '' || isNaN(Number(editData.value)) ? undefined : Number(editData.value),
      startDate: editData.startDate ? new Date(editData.startDate).toISOString() : undefined,
      endDate: editData.endDate ? new Date(editData.endDate).toISOString() : undefined,
      expirationDate: editData.expirationDate ? new Date(editData.expirationDate).toISOString() : undefined,
      noticePeriodDays: editData.noticePeriodDays === undefined || editData.noticePeriodDays === null || String(editData.noticePeriodDays) === '' || isNaN(Number(editData.noticePeriodDays)) ? undefined : Number(editData.noticePeriodDays),
      approverIds: Array.isArray(selectedApprovers) ? selectedApprovers : [],
    };
    // content alanı null veya undefined ise payload'dan çıkar
    if (payload.content === null || payload.content === undefined) {
      delete payload.content;
    }
    try {
      const response = await fetch(`/api/contracts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const updatedContract = await response.json();
        setContract(updatedContract);
        setIsEditing(false);
        toast.success('Sözleşme başarıyla güncellendi!');
      } else {
        const errorData = await response.json();
        if (errorData.details) {
          errorData.details.forEach((detail: any) => {
            toast.error(`${detail.field}: ${detail.message}`);
          });
        } else {
          toast.error('Sözleşme güncellenirken bir hata oluştu');
        }
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
                  {contract.status === 'SIGNED' ? (
                    <button
                      onClick={async () => {
                        try {
                          await createAmendment(contract.id);
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : 'Değişiklik oluşturulurken hata oluştu');
                        }
                      }}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                    >
                      📝 Değişiklik Yap
                    </button>
                  ) : (
                    <>
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

          {/* Ana Sözleşme Bilgisi - Eğer bu bir ek sözleşme ise */}
          {contract.parentContract && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
              <div className="px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Bu bir ek sözleşmedir
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Ana Sözleşme: 
                      <Link 
                        href={`/dashboard/contracts/${contract.parentContract.id}`}
                        className="ml-1 font-medium hover:underline"
                      >
                        {contract.parentContract.title}
                      </Link>
                      <span className="ml-2 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded">
                        {getStatusText(contract.parentContract.status)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ek Sözleşmeler - Eğer bu sözleşmenin ekleri varsa */}
          {contract.amendments && contract.amendments.length > 0 && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
              <div className="px-6 py-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Bu Sözleşmeye Bağlı Değişiklikler ({contract.amendments.length})
                  </h3>
                </div>
                
                <div className="space-y-3">
                  {contract.amendments.map((amendment) => (
                    <div 
                      key={amendment.id}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Link 
                            href={`/dashboard/contracts/${amendment.id}`}
                            className="text-sm font-medium text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline"
                          >
                            {amendment.title}
                          </Link>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(amendment.status)}`}>
                            {getStatusText(amendment.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Oluşturan: {amendment.createdBy.name || amendment.createdBy.email} • 
                          Tarih: {new Date(amendment.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link 
                          href={`/dashboard/contracts/${amendment.id}`}
                          className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
                  isEditable={contract.status !== 'SIGNED'}
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

          {isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Onaylayıcılar</label>
              <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-700">
                {users.map(user => (
                  <label key={user.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedApprovers.includes(user.id)}
                      onChange={() => setSelectedApprovers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900 dark:text-white">{user.name || user.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
} 