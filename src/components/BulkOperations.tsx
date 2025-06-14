'use client';

import React, { useState } from 'react';
import { 
  CheckSquareIcon, 
  SquareIcon, 
  DownloadIcon, 
  TrashIcon, 
  ArchiveIcon,
  EditIcon,
  FileTextIcon,
  BuildingIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';

interface Contract {
  id: string;
  title: string;
  status: string;
  type: string;
  createdAt: string;
  otherPartyName?: string;
}

interface BulkOperationsProps {
  contracts: Contract[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onBulkAction: (action: string, data?: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

const BulkOperations: React.FC<BulkOperationsProps> = ({
  contracts,
  selectedIds,
  onSelectionChange,
  onBulkAction,
  loading = false // eslint-disable-line @typescript-eslint/no-unused-vars
}) => {
  const [showActions, setShowActions] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<{ id: string; name: string; description?: string; }[]>([]);

  // Tümünü seç/seçimi kaldır
  const toggleSelectAll = () => {
    if (selectedIds.length === contracts.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(contracts.map(c => c.id));
    }
  };

  // Tekil seçim
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Toplu işlem yürütme
  const executeBulkAction = async (action: string, data?: Record<string, unknown>) => {
    if (selectedIds.length === 0) {
      alert('Lütfen en az bir sözleşme seçin.');
      return;
    }

    setActionLoading(action);
    try {
      await onBulkAction(action, data);
      if (action !== 'EXPORT') {
        onSelectionChange([]); // Seçimi temizle
      }
    } catch (error) {
      console.error('Toplu işlem hatası:', error);
    } finally {
      setActionLoading(null);
      setShowActions(false);
      setShowStatusModal(false);
      setShowTypeModal(false);
      setShowCompanyModal(false);
    }
  };

  // Şirketleri yükle
  const loadCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const companies = await response.json();
        setAvailableCompanies(companies);
        setShowCompanyModal(true);
      }
    } catch (error) {
      console.error('Şirketler yüklenemedi:', error);
    }
  };

  // Durum metni
  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Taslak';
      case 'IN_REVIEW': return 'İncelemede';
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      case 'SIGNED': return 'İmzalandı';
      case 'ARCHIVED': return 'Arşivlendi';
      default: return status;
    }
  };

  // Tür metni
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

  const isAllSelected = selectedIds.length === contracts.length && contracts.length > 0;
  const isPartialSelected = selectedIds.length > 0 && selectedIds.length < contracts.length;

  return (
    <div className="space-y-4">
      {/* Seçim başlığı ve toplu işlemler */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleSelectAll}
            className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            disabled={contracts.length === 0}
          >
            {isAllSelected ? (
              <CheckSquareIcon className="h-5 w-5 text-blue-600" />
            ) : isPartialSelected ? (
              <div className="h-5 w-5 bg-blue-600 rounded border-2 border-blue-600 flex items-center justify-center">
                <div className="h-2 w-2 bg-white rounded-sm"></div>
              </div>
            ) : (
              <SquareIcon className="h-5 w-5" />
            )}
            <span>
              {selectedIds.length > 0
                ? `${selectedIds.length} sözleşme seçildi`
                : `Tümünü seç (${contracts.length})`
              }
            </span>
          </button>
        </div>

        {selectedIds.length > 0 && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowActions(!showActions)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <EditIcon className="h-4 w-4 mr-1" />
              Toplu İşlemler
            </button>

            {showActions && (
              <div className="absolute z-10 mt-1 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="py-1">
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Durumu Güncelle
                  </button>

                  <button
                    onClick={() => setShowTypeModal(true)}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    Türünü Değiştir
                  </button>

                  <button
                    onClick={loadCompanies}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <BuildingIcon className="h-4 w-4 mr-2" />
                    Şirket Ata
                  </button>

                  <hr className="my-1 border-gray-200 dark:border-gray-600" />

                  <button
                    onClick={() => executeBulkAction('ARCHIVE')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <ArchiveIcon className="h-4 w-4 mr-2" />
                    {actionLoading === 'ARCHIVE' ? 'Arşivleniyor...' : 'Arşivle'}
                  </button>

                  <button
                    onClick={() => executeBulkAction('EXPORT', { format: 'csv' })}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    {actionLoading === 'EXPORT' ? 'Dışa aktarılıyor...' : 'CSV olarak dışa aktar'}
                  </button>

                  <button
                    onClick={() => executeBulkAction('EXPORT', { format: 'json' })}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    disabled={actionLoading !== null}
                  >
                    <DownloadIcon className="h-4 w-4 mr-2" />
                    {actionLoading === 'EXPORT' ? 'Dışa aktarılıyor...' : 'JSON olarak dışa aktar'}
                  </button>

                  <hr className="my-1 border-gray-200 dark:border-gray-600" />

                  <button
                    onClick={() => {
                      if (confirm(`${selectedIds.length} sözleşmeyi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) {
                        executeBulkAction('DELETE');
                      }
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    disabled={actionLoading !== null}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    {actionLoading === 'DELETE' ? 'Siliniyor...' : 'Sil'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Durum güncelleme modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Durum Güncelle ({selectedIds.length} sözleşme)
            </h3>
            
            <div className="space-y-3">
              {['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'SIGNED', 'ARCHIVED'].map(status => (
                <button
                  key={status}
                  onClick={() => executeBulkAction('UPDATE_STATUS', { status })}
                  className="w-full text-left px-3 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={actionLoading !== null}
                >
                  {getStatusText(status)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tür güncelleme modal */}
      {showTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tür Değiştir ({selectedIds.length} sözleşme)
            </h3>
            
            <div className="space-y-3">
              {['general', 'procurement', 'service', 'sales', 'employment', 'partnership', 'nda', 'rental'].map(type => (
                <button
                  key={type}
                  onClick={() => executeBulkAction('UPDATE_TYPE', { type })}
                  className="w-full text-left px-3 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={actionLoading !== null}
                >
                  {getTypeText(type)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowTypeModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Şirket atama modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Şirket Ata ({selectedIds.length} sözleşme)
            </h3>
            
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {availableCompanies.map(company => (
                <button
                  key={company.id}
                  onClick={() => executeBulkAction('UPDATE_COMPANY', { companyId: company.id })}
                  className="w-full text-left px-3 py-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={actionLoading !== null}
                >
                  <div className="font-medium">{company.name}</div>
                  {company.description && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">{company.description}</div>
                  )}
                </button>
              ))}
              
              {availableCompanies.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  Henüz şirket bulunamadı
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowCompanyModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sözleşme listesi with checkboxes */}
      <div className="space-y-2">
        {contracts.map(contract => (
          <div 
            key={contract.id} 
            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
              selectedIds.includes(contract.id)
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <button
              onClick={() => toggleSelect(contract.id)}
              className="flex-shrink-0"
            >
              {selectedIds.includes(contract.id) ? (
                <CheckSquareIcon className="h-5 w-5 text-blue-600" />
              ) : (
                <SquareIcon className="h-5 w-5 text-gray-400" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {contract.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                    {getStatusText(contract.status)}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {getTypeText(contract.type)}
                  </span>
                </div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {contract.otherPartyName && `${contract.otherPartyName} • `}
                {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
              </div>
            </div>
          </div>
        ))}

        {contracts.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Sözleşme bulunamadı
          </div>
        )}
      </div>

      {/* Seçim özeti */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <strong>{selectedIds.length}</strong> sözleşme seçildi. Toplu işlemler menüsünden istediğiniz işlemi gerçekleştirebilirsiniz.
            </div>
            <button
              onClick={() => onSelectionChange([])}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkOperations; 