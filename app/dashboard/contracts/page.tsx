'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { downloadContractPDF, ContractData } from '../../../lib/pdfGenerator';
import BulkOperations from '../../../src/components/BulkOperations';

interface Contract {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'SIGNED' | 'ARCHIVED';
  type: string;
  value?: number;
  startDate?: string;
  endDate?: string;
  otherPartyName?: string;
  otherPartyEmail?: string;
  createdAt: string;
  createdBy: {
    name?: string;
    email: string;
  };
  company?: {
    name: string;
  };
}

export default function ContractsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [showBulkMode, setShowBulkMode] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Simple fetch function with useCallback
  const fetchContractsData = useCallback(async (page = 1) => {
      try {
      setLoading(true);
        const url = new URL('/api/contracts', window.location.origin);
      
      // API parameters
      if (filter !== 'all') url.searchParams.set('status', filter);
      if (typeFilter !== 'all') url.searchParams.set('type', typeFilter);
      if (searchTerm.trim()) url.searchParams.set('search', searchTerm.trim());
      if (sortBy) url.searchParams.set('sortBy', sortBy);
      if (sortOrder) url.searchParams.set('sortOrder', sortOrder);
      url.searchParams.set('page', page.toString());
      url.searchParams.set('limit', '25');

        const response = await fetch(url.toString());
        if (response.ok) {
          const data = await response.json();
        setContracts(data.data || []);
        setPagination(data.pagination || {
          page: 1,
          limit: 25,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false
        });
        } else {
          console.error('Failed to fetch contracts');
          setContracts([]);
        }
      } catch (_error) {
        console.error('Error fetching contracts:');
        setContracts([]);
      } finally {
        setLoading(false);
      }
  }, [filter, typeFilter, searchTerm, sortBy, sortOrder]);

  // Simple effect for all changes
  useEffect(() => {
    if (!session) return;
    fetchContractsData(1);
  }, [session, fetchContractsData]);

  // For pagination only
  const fetchContracts = async (page = 1) => {
    await fetchContractsData(page);
  };

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

  // Server-side filtering kullandığımız için filteredContracts artık sadece contracts
  const filteredContracts = contracts;

  const handleDownloadPDF = async (contract: Contract) => {
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
    } catch (_error) {
      console.error('PDF oluşturma hatası:');
      toast.error('PDF oluşturulurken bir hata oluştu');
    }
  };

  // Toplu işlemler
  const handleBulkAction = async (action: string, data?: Record<string, unknown>) => {
    try {
      const response = await fetch('/api/contracts/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          contractIds: selectedContractIds,
          data
        }),
      });

      if (action === 'EXPORT') {
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.style.display = 'none';
          a.href = url;
          a.download = response.headers.get('Content-Disposition')?.split('filename=')[1] || 'export.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          toast.success('Dosya başarıyla indirildi!');
        } else {
          throw new Error('Export işlemi başarısız');
        }
      } else {
        if (response.ok) {
          const result = await response.json();
          toast.success(result.message || 'İşlem başarılı');
          fetchContracts(); // Listeyi yenile
        } else {
          const error = await response.json();
          throw new Error(error.error || 'İşlem başarısız');
        }
      }
    } catch (_error) {
      console.error('Toplu işlem hatası:');
      toast.error(_error instanceof Error ? _error.message : 'Bir hata oluştu');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Sözleşmeler yükleniyor...</p>
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
                href="/dashboard"
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ← Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Sözleşmelerim</h1>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowBulkMode(!showBulkMode)}
                className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium ${
                  showBulkMode 
                    ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                    : 'border-gray-300 text-gray-700 bg-white dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                } hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                {showBulkMode ? 'Normal Görünüm' : 'Toplu İşlemler'}
              </button>
              <Link
                href="/dashboard/contracts/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Yeni Sözleşme
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Advanced Filters */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Filtreler ve Arama</h3>
            
            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Sözleşme başlığı, açıklama veya diğer taraf ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Chips */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Durum</label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tümü</option>
                  <option value="DRAFT">Taslak</option>
                  <option value="IN_REVIEW">İncelemede</option>
                  <option value="APPROVED">Onaylandı</option>
                  <option value="SIGNED">İmzalandı</option>
                  <option value="REJECTED">Reddedildi</option>
                  <option value="ARCHIVED">Arşivlendi</option>
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tür</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">Tüm Türler</option>
                  <option value="general">Genel Sözleşme</option>
                  <option value="procurement">Tedarik Sözleşmesi</option>
                  <option value="service">Hizmet Sözleşmesi</option>
                  <option value="sales">Satış Sözleşmesi</option>
                  <option value="employment">İş Sözleşmesi</option>
                  <option value="partnership">Ortaklık Sözleşmesi</option>
                  <option value="nda">Gizlilik Sözleşmesi (NDA)</option>
                  <option value="rental">Kira Sözleşmesi</option>
                </select>
              </div>

              {/* Sort Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sıralama</label>
                <div className="flex space-x-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="createdAt">Oluşturulma Tarihi</option>
                    <option value="title">Başlık</option>
                    <option value="status">Durum</option>
                    <option value="type">Tür</option>
                    <option value="value">Değer</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <svg className={`h-5 w-5 transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchTerm || filter !== 'all' || typeFilter !== 'all') && (
            <div className="flex flex-wrap gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Aktif filtreler:</span>
                {searchTerm && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Arama: &quot;{searchTerm}&quot;
                    <button
                      onClick={() => setSearchTerm('')}
                      className="ml-1 h-3 w-3 text-blue-600 hover:text-blue-800"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                )}
                {filter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Durum: {getStatusText(filter)}
                    <button
                      onClick={() => setFilter('all')}
                      className="ml-1 h-3 w-3 text-green-600 hover:text-green-800"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                )}
                {typeFilter !== 'all' && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    Tür: {getTypeText(typeFilter)}
                    <button
                      onClick={() => setTypeFilter('all')}
                      className="ml-1 h-3 w-3 text-purple-600 hover:text-purple-800"
                    >
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilter('all');
                    setTypeFilter('all');
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  Tümünü temizle
                </button>
              </div>
            )}
          </div>
            </div>

        {/* Results Counter */}
        <div className="px-4 sm:px-0">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">{pagination.total}</span> sözleşme bulundu
              {pagination.totalPages > 1 && (
                <span className="text-gray-500"> • Sayfa {pagination.page}/{pagination.totalPages}</span>
              )}
            </p>
          </div>
        </div>

        {/* Bulk Operations */}
        {showBulkMode && (
          <div className="px-4 py-6 sm:px-0">
            <BulkOperations
              contracts={filteredContracts}
              selectedIds={selectedContractIds}
              onSelectionChange={setSelectedContractIds}
              onBulkAction={handleBulkAction}
            />
          </div>
        )}

        {/* Contracts List */}
        <div className="px-4 py-6 sm:px-0">
          {filteredContracts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sözleşme bulunamadı</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter === 'all' ? 'Henüz hiç sözleşme oluşturmamışsınız.' : 'Bu filtreye uygun sözleşme bulunamadı.'}
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/contracts/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  İlk sözleşmenizi oluşturun
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredContracts.map((contract) => (
                  <li key={contract.id}>
                    <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 dark:hover:bg-gray-700">
                        <div className="flex items-center justify-between">
                        <Link href={`/dashboard/contracts/${contract.id}`} className="flex items-center flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                            </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {contract.title}
                              </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                {contract.description}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {getTypeText(contract.type)} • {contract.otherPartyName || 'Diğer Taraf Belirtilmemiş'} • {contract.createdBy.name || contract.createdBy.email} • {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center space-x-2 ml-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}>
                              {getStatusText(contract.status)}
                            </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadPDF(contract);
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                            title="PDF İndir"
                          >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </button>
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-4 py-6 sm:px-0">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => fetchContracts(pagination.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Önceki
                </button>
                <button
                  onClick={() => fetchContracts(pagination.page + 1)}
                  disabled={!pagination.hasNext}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sonraki
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Toplam <span className="font-medium">{pagination.total}</span> sözleşmeden{' '}
                    <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> -{' '}
                    <span className="font-medium">
                      {Math.min(pagination.page * pagination.limit, pagination.total)}
                    </span> arası gösteriliyor
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => fetchContracts(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    
                    {/* Page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.page - 2 + i;
                      }
                      
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchContracts(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pageNum === pagination.page
                              ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    
                    <button
                      onClick={() => fetchContracts(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">İstatistikler</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{contracts.length}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Toplam</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {contracts.filter(c => c.status === 'SIGNED').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">İmzalanan</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {contracts.filter(c => c.status === 'IN_REVIEW').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">İncelemede</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                  {contracts.filter(c => c.status === 'DRAFT').length}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Taslak</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 