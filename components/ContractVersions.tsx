'use client';

import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface ContractVersion {
  id: string;
  versionNumber: string;
  title: string;
  description?: string;
  content: string;
  status: string;
  value?: number;
  currency?: string;
  startDate?: string;
  endDate?: string;
  changeType: string;
  changeDescription?: string;
  changeLog?: Record<string, unknown>;
  createdAt: string;
  createdBy: {
    id: string;
    name?: string;
    email: string;
  };
}

interface ContractVersionsProps {
  contractId: string;
  isOwner: boolean;
  onVersionUpdate?: () => void;
}

const changeTypeLabels = {
  CREATED: 'Oluşturuldu',
  UPDATED: 'Güncellendi',
  CONTENT_MODIFIED: 'İçerik Değiştirildi',
  TERMS_CHANGED: 'Şartlar Değiştirildi',
  STATUS_CHANGED: 'Durum Değiştirildi',
  ARCHIVED: 'Arşivlendi'
};

const changeTypeColors = {
  CREATED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  UPDATED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CONTENT_MODIFIED: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  TERMS_CHANGED: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  STATUS_CHANGED: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ARCHIVED: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
};

export default function ContractVersions({ 
  contractId, 
  isOwner,
  onVersionUpdate 
}: ContractVersionsProps) {
  // const { data: session } = useSession(); // Şu anda kullanılmıyor
  const [versions, setVersions] = useState<ContractVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    changeType: 'UPDATED',
    changeDescription: '',
  });

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts/${contractId}/versions`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      } else {
        toast.error('Versiyon geçmişi yüklenirken hata oluştu');
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast.error('Versiyon geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fetchVersionsCallback = useCallback(fetchVersions, [contractId]);

  // Load versions
  useEffect(() => {
    fetchVersionsCallback();
  }, [fetchVersionsCallback]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.changeDescription.trim()) {
      toast.error('Değişiklik açıklaması gereklidir');
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`/api/contracts/${contractId}/versions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const newVersion = await response.json();
        setVersions(prev => [newVersion, ...prev]);
        setShowCreateForm(false);
        setFormData({ changeType: 'UPDATED', changeDescription: '' });
        toast.success('Yeni versiyon oluşturuldu');
        onVersionUpdate?.();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Versiyon oluşturulurken hata oluştu');
      }
    } catch (error) {
      console.error('Error creating version:', error);
      toast.error('Versiyon oluşturulurken hata oluştu');
    } finally {
      setCreating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Versiyon Geçmişi
          </h3>
          {isOwner && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Yeni Versiyon
            </button>
          )}
        </div>
      </div>

      {/* Create Version Form */}
      {showCreateForm && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <form onSubmit={handleCreateVersion} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Değişiklik Türü
              </label>
              <select
                value={formData.changeType}
                onChange={(e) => setFormData(prev => ({ ...prev, changeType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {Object.entries(changeTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Değişiklik Açıklaması
              </label>
              <textarea
                value={formData.changeDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, changeDescription: e.target.value }))}
                rows={3}
                required
                placeholder="Bu versiyonda yapılan değişiklikleri açıklayın..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Oluşturuluyor...' : 'Versiyon Oluştur'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Versions List */}
      <div className="px-6 py-4">
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              Henüz versiyon geçmişi bulunmuyor
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className="flex items-start space-x-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                      v{version.versionNumber}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          changeTypeColors[version.changeType as keyof typeof changeTypeColors]
                        }`}
                      >
                        {changeTypeLabels[version.changeType as keyof typeof changeTypeLabels]}
                      </span>
                      {index === 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                          Güncel
                        </span>
                      )}
                    </div>
                    <time className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(version.createdAt)}
                    </time>
                  </div>
                  
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                    {version.changeDescription}
                  </p>
                  
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      {version.createdBy.name || version.createdBy.email} tarafından oluşturuldu
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 