'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  FunnelIcon,
  UserIcon,
  ClockIcon,
  CalendarIcon,
  DocumentTextIcon,
  EyeIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface Contract {
  id: string;
  title: string;
  status: string;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  currentStage: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  lastActivity: string;
  createdAt: string;
  otherPartyName?: string;
  dueDate?: string;
}

interface FilterStats {
  total: number;
  inProgress: number;
  assignedToMe: number;
  overdue: number;
  expiringSoon: number;
}

const STAGE_COLORS = {
  'DRAFT': 'bg-gray-400',
  'IN_REVIEW': 'bg-yellow-400',
  'APPROVED': 'bg-blue-400', 
  'SIGNED': 'bg-green-400',
  'ARCHIVED': 'bg-purple-400',
  'REJECTED': 'bg-red-400'
};

const PRIORITY_COLORS = {
  'LOW': 'text-gray-600',
  'MEDIUM': 'text-yellow-600',
  'HIGH': 'text-orange-600',
  'URGENT': 'text-red-600'
};

export default function TaskFocusedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'all';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filterStats, setFilterStats] = useState<FilterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const filterOptions = [
    { key: 'all', label: 'Tüm İş Akışları', count: filterStats?.total || 0 },
    { key: 'inProgress', label: 'Devam Edenler', count: filterStats?.inProgress || 0 },
    { key: 'assignedToMe', label: 'Bana Atananlar', count: filterStats?.assignedToMe || 0 },
    { key: 'overdue', label: 'Vadesi Geçenler', count: filterStats?.overdue || 0 },
    { key: 'expiringSoon', label: 'Yakında Vadesi Dolacaklar', count: filterStats?.expiringSoon || 0 },
  ];

  useEffect(() => {
    fetchContracts();
    fetchFilterStats();
  }, [currentView]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        view: currentView,
        limit: '50',
        sortBy: 'lastActivity',
        order: 'desc'
      });

      const response = await fetch(`/api/contracts?${params}`);
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterStats = async () => {
    try {
      const response = await fetch('/api/dashboard/workflow-stats');
      if (response.ok) {
        const data = await response.json();
        setFilterStats(data);
      }
    } catch (error) {
      console.error('Error fetching filter stats:', error);
    }
  };

  const handleFilterChange = (filterKey: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', filterKey);
    router.push(url.pathname + url.search);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Bugün';
    if (days === 1) return 'Dün';
    if (days < 7) return `${days} gün önce`;
    if (days < 30) return `${Math.floor(days / 7)} hafta önce`;
    return `${Math.floor(days / 30)} ay önce`;
  };

  const getStageDisplay = (stage: string) => {
    const stageMap = {
      'DRAFT': 'Taslak',
      'IN_REVIEW': 'İncelemede',
      'APPROVED': 'Onaylandı',
      'SIGNED': 'İmzalandı',
      'ARCHIVED': 'Arşivlendi',
      'REJECTED': 'Reddedildi'
    };
    return stageMap[stage as keyof typeof stageMap] || stage;
  };

  const filteredContracts = contracts.filter(contract =>
    contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contract.otherPartyName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-theme(spacing.32))] bg-white">
      {/* Left Sidebar - Filters */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">İş Akışları</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Sözleşme ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Options */}
        <div className="flex-1 p-4">
          <nav className="space-y-1">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => handleFilterChange(option.key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentView === option.key
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{option.label}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  currentView === option.key
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {option.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/dashboard/contracts/new"
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <DocumentTextIcon className="w-4 h-4 mr-2" />
            Yeni Sözleşme
          </Link>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {filterOptions.find(f => f.key === currentView)?.label || 'İş Akışları'}
              </h1>
              <span className="text-sm text-gray-500">
                {filteredContracts.length} sözleşme
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <FunnelIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Contract Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <DocumentTextIcon className="w-12 h-12 mb-4" />
              <p className="text-lg font-medium">Sözleşme bulunamadı</p>
              <p className="text-sm">Yeni bir sözleşme oluşturmak için yukarıdaki butonu kullanın</p>
            </div>
          ) : (
            <div className="min-w-full">
              {/* Table Header */}
              <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
                <div className="grid grid-cols-12 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="col-span-4">Sözleşme Adı</div>
                  <div className="col-span-2">Aşama</div>
                  <div className="col-span-2">Sıra Kimde</div>
                  <div className="col-span-2">Son Aktivite</div>
                  <div className="col-span-1">Tarih</div>
                  <div className="col-span-1">İşlemler</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200">
                {filteredContracts.map((contract) => (
                  <div
                    key={contract.id}
                    className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="grid grid-cols-12 gap-4 items-center">
                      {/* Contract Name */}
                      <div className="col-span-4">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {contract.title}
                            </p>
                            {contract.otherPartyName && (
                              <p className="text-xs text-gray-500 truncate">
                                {contract.otherPartyName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stage */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${STAGE_COLORS[contract.currentStage as keyof typeof STAGE_COLORS] || 'bg-gray-400'}`}></div>
                          <span className="text-sm text-gray-900">
                            {getStageDisplay(contract.currentStage)}
                          </span>
                        </div>
                      </div>

                      {/* Assigned To */}
                      <div className="col-span-2">
                        {contract.assignedTo ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-blue-600">
                                {contract.assignedTo.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <span className="text-sm text-gray-900 truncate">
                              {contract.assignedTo.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Atanmamış</span>
                        )}
                      </div>

                      {/* Last Activity */}
                      <div className="col-span-2">
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {getRelativeTime(contract.lastActivity)}
                          </span>
                        </div>
                      </div>

                      {/* Created Date */}
                      <div className="col-span-1">
                        <span className="text-sm text-gray-600">
                          {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1">
                        <Link
                          href={`/contract/${contract.id}`}
                          className="inline-flex items-center p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 