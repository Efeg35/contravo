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
  ChevronLeftIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  EllipsisHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  XMarkIcon,
  BoltIcon,
  ChartBarIcon,
  BellIcon,
  ClockIcon as ClockIconOutline,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { 
  CheckIcon as CheckIconSolid,
  BoltIcon as BoltIconSolid 
} from '@heroicons/react/24/solid';

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
  value?: number;
  department?: string;
  contractType?: string;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  turnsCompleted?: number;
  totalTurns?: number;
}

interface FilterStats {
  total: number;
  inProgress: number;
  assignedToMe: number;
  participating: number;
  completed: number;
  overdue: number;
  expiringSoon: number;
}

const STAGE_COLORS = {
  'DRAFT': 'bg-gray-400',
  'IN_REVIEW': 'bg-yellow-400',
  'APPROVED': 'bg-blue-400', 
  'SIGNED': 'bg-green-400',
  'ARCHIVED': 'bg-gray-400',
  'REJECTED': 'bg-red-400'
};

const PRIORITY_COLORS = {
  'LOW': 'text-gray-600',
  'MEDIUM': 'text-yellow-600',
  'HIGH': 'text-orange-600',
  'URGENT': 'text-red-600'
};

const RISK_COLORS = {
  'LOW': 'bg-green-100 text-green-800',
  'MEDIUM': 'bg-yellow-100 text-yellow-800',
  'HIGH': 'bg-red-100 text-red-800'
};

export default function TaskFocusedDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentView = searchParams.get('view') || 'all';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [filterStats, setFilterStats] = useState<FilterStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [sortBy, setSortBy] = useState('lastActivity');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAIInsights, setShowAIInsights] = useState(false);

  const filterOptions = [
    { 
      key: 'all', 
      label: 'In Progress (Active)', 
      count: filterStats?.inProgress || 7907,
      icon: BoltIcon,
      color: 'text-green-600'
    },
    { 
      key: 'myworkflows', 
      label: 'All Workflows', 
      count: filterStats?.total || 10590,
      icon: DocumentTextIcon,
      color: 'text-blue-600'
    },
    { 
      key: 'assignedToMe', 
      label: 'Assigned To Me', 
      count: filterStats?.assignedToMe || 71,
      icon: UserIcon,
      color: 'text-purple-600'
    },
    { 
      key: 'participating', 
      label: 'Participating In', 
      count: filterStats?.participating || 87,
      icon: UserIcon,
      color: 'text-indigo-600'
    },
    { 
      key: 'completed', 
      label: 'Completed', 
      count: filterStats?.completed || 1803,
      icon: CheckIcon,
      color: 'text-gray-600'
    },
    { 
      key: 'overdue', 
      label: 'Overdue', 
      count: filterStats?.overdue || 24,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600'
    },
  ];

  const myViews = [
    { key: 'procurement-rfp', label: 'Procurement | RFP', count: 349, icon: ChartBarIcon },
    { key: 'procurement-spend', label: 'Procurement | Spend > $1M', count: 23, icon: ChartBarIcon },
    { key: 'general-mnda', label: 'General | MNDA\'s in Negotiation', count: 1278, icon: DocumentTextIcon },
    { key: 'sales-high-value', label: 'Sales | High Value Contracts', count: 1273, icon: ChartBarIcon },
  ];

  const priorityViews = [
    { key: 'finance-business', label: 'Finance Business Department', count: 60, icon: ChartBarIcon },
    { key: 'ytd-completed', label: 'YTD Completed Contracts', count: 917, icon: CheckIcon },
  ];

  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true,
    workflowName: true,
    stage: true,
    turn: true,
    noTurns: true,
    assignees: true,
    riskLevel: true,
    contractValue: true,
    latestActivity: true,
    dateCreated: true,
    actions: true
  });

  useEffect(() => {
    fetchContracts();
    fetchFilterStats();
  }, [currentView, sortBy, sortOrder]);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        view: currentView,
        limit: '50',
        sortBy: sortBy,
        order: sortOrder,
        ...(searchQuery && { search: searchQuery })
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

  const handleSelectContract = (contractId: string) => {
    setSelectedContracts(prev => 
      prev.includes(contractId) 
        ? prev.filter(id => id !== contractId)
        : [...prev, contractId]
    );
  };

  const handleSelectAll = () => {
    if (selectedContracts.length === contracts.length) {
      setSelectedContracts([]);
    } else {
      setSelectedContracts(contracts.map(c => c.id));
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleBatchAction = (action: string) => {
    console.log(`Batch action: ${action} on contracts:`, selectedContracts);
    // Implement batch actions
    setSelectedContracts([]);
    setShowBatchActions(false);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return '1d ago';
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getStageColor = (stage: string) => {
    const stageColorMap = {
      'DRAFT': 'bg-gray-500',
      'IN_REVIEW': 'bg-green-500',
      'APPROVED': 'bg-blue-500',
      'SIGNED': 'bg-green-600',
      'ARCHIVED': 'bg-gray-600',
      'REJECTED': 'bg-red-500'
    };
    return stageColorMap[stage as keyof typeof stageColorMap] || 'bg-gray-400';
  };

  const getStageDisplay = (stage: string) => {
    const stageMap = {
      'DRAFT': 'Review',
      'IN_REVIEW': 'Review',
      'APPROVED': 'Archive',
      'SIGNED': 'Archive',
      'ARCHIVED': 'Archive',
      'REJECTED': 'Review'
    };
    return stageMap[stage as keyof typeof stageMap] || 'Review';
  };

  const getStageBadgeColor = (stage: string) => {
    const stageBadgeColorMap = {
      'DRAFT': 'bg-gray-100 text-gray-700',
      'IN_REVIEW': 'bg-yellow-100 text-yellow-800',
      'APPROVED': 'bg-blue-100 text-blue-800',
      'SIGNED': 'bg-green-100 text-green-800',
      'ARCHIVED': 'bg-gray-100 text-gray-600',
      'REJECTED': 'bg-red-100 text-red-800'
    };
    return stageBadgeColorMap[stage as keyof typeof stageBadgeColorMap] || 'bg-gray-100 text-gray-700';
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '-';
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const SortableHeader = ({ column, children, className = "" }: { column: string, children: React.ReactNode, className?: string }) => (
    <th 
      className={`px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center space-x-1">
        <span>{children}</span>
        {sortBy === column && (
          sortOrder === 'asc' ? 
            <ArrowUpIcon className="h-3 w-3" /> : 
            <ArrowDownIcon className="h-3 w-3" />
        )}
      </div>
    </th>
  );

  return (
    <div className="w-full h-screen bg-white">
      {/* Left Sidebar - Fixed to left wall */}
      <div className="fixed left-0 top-16 w-64 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 overflow-y-auto z-40">
        {/* Sidebar Header */}
        <div className="px-2 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <BoltIconSolid className="h-5 w-5 text-teal-600 mr-2" />
              <span className="text-sm font-medium text-gray-900">Workflow Center</span>
                </div>
                </div>
              </div>
              
        {/* AI Insights Panel */}
        <div className="px-2 py-2 border-b border-gray-200">
          <button
            onClick={() => setShowAIInsights(!showAIInsights)}
            className="w-full flex items-center justify-between px-2 py-2 text-sm rounded bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100 text-gray-700"
          >
            <div className="flex items-center">
              <BoltIconSolid className="h-4 w-4 text-purple-600 mr-2" />
              <span className="font-medium">AI Insights</span>
            </div>
            <ChevronDownIcon className={`h-4 w-4 transition-transform ${showAIInsights ? 'rotate-180' : ''}`} />
          </button>
          
          {showAIInsights && (
            <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-md">
              <div className="space-y-2 text-xs">
                <div className="flex items-center text-purple-700">
                  <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                  <span>24 contracts require urgent attention</span>
                </div>
                <div className="flex items-center text-blue-700">
                  <ClockIconOutline className="h-3 w-3 mr-1" />
                  <span>15 contracts expiring in 30 days</span>
                </div>
                <div className="flex items-center text-green-700">
                  <ChartBarIcon className="h-3 w-3 mr-1" />
                  <span>avg. completion time: 12 days</span>
                </div>
              </div>
            </div>
          )}
          </div>

        {/* Main Filters */}
        <div className="px-2 py-2">
          <div className="space-y-1">
            {filterOptions.map((option) => {
              const Icon = option.icon;
              return (
              <button
                  key={option.key}
                  onClick={() => handleFilterChange(option.key)}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-gray-50 group ${
                    currentView === option.key ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className={`h-3.5 w-3.5 mr-1.5 ${option.color}`} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                    {option.count.toLocaleString()}
                  </span>
              </button>
              );
            })}
          </div>
        </div>

        {/* MY VIEWS Section */}
        <div className="px-2 py-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            MY VIEWS
          </div>
          <div className="space-y-1">
            {myViews.map((view) => {
              const Icon = view.icon;
              return (
              <button
                  key={view.key}
                  onClick={() => handleFilterChange(view.key)}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-gray-50 ${
                    currentView === view.key ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-3 w-3 mr-1.5 text-gray-400" />
                    <span className="text-sm whitespace-normal">{view.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {view.count.toLocaleString()}
                  </span>
              </button>
              );
            })}
          </div>
        </div>

        {/* BY PRIORITY LEVEL Section */}
        <div className="px-2 py-2 border-t border-gray-200">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            BY PRIORITY LEVEL
          </div>
          <div className="space-y-1">
            {priorityViews.map((view) => {
              const Icon = view.icon;
              return (
              <button
                  key={view.key}
                  onClick={() => handleFilterChange(view.key)}
                  className={`w-full flex items-center justify-between px-2 py-2 text-sm rounded hover:bg-gray-50 ${
                    currentView === view.key ? 'bg-blue-50 text-blue-700' : 'text-gray-600'
                  }`}
                >
                  <div className="flex items-center">
                    <Icon className="h-3 w-3 mr-1.5 text-gray-400" />
                    <span className="text-sm whitespace-normal">{view.label}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {view.count.toLocaleString()}
                  </span>
              </button>
              );
            })}
          </div>
        </div>
      </div>

        {/* Main Content - Full width with left margin for sidebar */}
      <div className="w-full flex flex-col overflow-hidden min-w-0 ml-64 h-[calc(100vh-4rem)]">
                  {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {filterOptions.find(f => f.key === currentView)?.label || 'All Workflows'}
              </h1>
              
              {selectedContracts.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {selectedContracts.length} selected
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setShowBatchActions(!showBatchActions)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Actions
                      <ChevronDownIcon className="ml-1 h-4 w-4 inline" />
                    </button>
                    
                    {showBatchActions && (
                      <div className="absolute top-8 left-0 w-48 bg-white border border-gray-200 rounded shadow-lg z-10">
                        <button
                          onClick={() => handleBatchAction('approve')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          Bulk Approve
                        </button>
                        <button
                          onClick={() => handleBatchAction('assign')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          Bulk Assign
                        </button>
                        <button
                          onClick={() => handleBatchAction('archive')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50"
                        >
                          Bulk Archive
                        </button>
                    </div>
                    )}
                  </div>
                </div>
              )}
              </div>

            <div className="flex items-center space-x-3">
              {/* Advanced Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for a workflow..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && fetchContracts()}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Action Buttons */}
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded hover:bg-teal-700 flex items-center">
                <PlusIcon className="h-4 w-4 mr-1" />
                Start workflow
              </button>

              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50">
                More
              </button>

              <button className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center">
                <FunnelIcon className="h-4 w-4 mr-1" />
                Filter
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50 flex items-center"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-1" />
                  Columns
                </button>

                {showColumnSettings && (
                  <div className="absolute top-10 right-0 w-64 bg-white border border-gray-200 rounded shadow-lg z-10 p-3">
                    <div className="text-sm font-medium text-gray-900 mb-2">Show/Hide Columns</div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {Object.entries(visibleColumns).map(([key, visible]) => (
                        <label key={key} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={visible}
                            onChange={(e) => setVisibleColumns(prev => ({
                              ...prev,
                              [key]: e.target.checked
                            }))}
                            className="mr-2"
                          />
                          <span className="text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Table Container - Now with horizontal scroll capability */}
        <div className="flex-1 overflow-auto px-6">
          <table className="w-full bg-white table-auto">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                {visibleColumns.checkbox && (
                  <th className="px-1 py-2 w-8">
                    <input
                      type="checkbox"
                      checked={selectedContracts.length === contracts.length && contracts.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                  </th>
                )}

                {visibleColumns.workflowName && (
                  <SortableHeader column="title" className="min-w-[200px] max-w-[250px]">
                    WORKFLOW NAME
                  </SortableHeader>
                )}

                {visibleColumns.stage && (
                  <SortableHeader column="currentStage" className="w-16">
                    STAGE
                  </SortableHeader>
                )}

                {visibleColumns.turn && (
                  <SortableHeader column="assignedTo" className="w-20">
                    TURN
                  </SortableHeader>
                )}

                {visibleColumns.noTurns && (
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    NO. TURNS
                  </th>
                )}

                {visibleColumns.assignees && (
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    ASSIGNEES
                  </th>
                )}

                {visibleColumns.riskLevel && (
                  <SortableHeader column="riskLevel" className="w-16">
                    RISK LEVEL
                  </SortableHeader>
                )}

                {visibleColumns.contractValue && (
                  <SortableHeader column="value" className="w-24">
                    CONTRACT VALUE
                  </SortableHeader>
                )}

                {visibleColumns.latestActivity && (
                  <SortableHeader column="lastActivity" className="w-20">
                    LATEST ACTIVITY
                  </SortableHeader>
                )}

                {visibleColumns.dateCreated && (
                  <SortableHeader column="createdAt" className="w-20">
                    DATE CREATED
                  </SortableHeader>
                )}

                {visibleColumns.actions && (
                  <th className="px-1 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    ACTIONS
                  </th>
                )}
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <div className="mt-2">Loading workflows...</div>
                  </td>
                </tr>
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-12 text-gray-500">
                    <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                    <div className="text-lg font-medium">No workflows found</div>
                    <div className="text-sm">Try adjusting your filters or search criteria</div>
                  </td>
                </tr>
              ) : (
                                  contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 group">
                      {visibleColumns.checkbox && (
                        <td className="px-1 py-2">
                          <input
                            type="checkbox"
                            checked={selectedContracts.includes(contract.id)}
                            onChange={() => handleSelectContract(contract.id)}
                            className="rounded border-gray-300"
                          />
                        </td>
                      )}

                      {visibleColumns.workflowName && (
                        <td className="px-1 py-2">
                  <Link
                            href={`/contract/${contract.id}`}
                            className="flex flex-col group-hover:text-blue-600"
                          >
                            <div className="text-gray-900 hover:text-blue-600 text-sm leading-tight">
                              {contract.title}
                            </div>
                            {contract.otherPartyName && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                with {contract.otherPartyName}
                              </div>
                            )}
                  </Link>
                        </td>
                      )}

                      {visibleColumns.stage && (
                        <td className="px-1 py-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStageBadgeColor(contract.currentStage)}`}>
                            {getStageDisplay(contract.currentStage)}
                          </span>
                        </td>
                      )}

                      {visibleColumns.turn && (
                        <td className="px-1 py-2">
                          {contract.assignedTo ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-2 shadow-sm">
                                {contract.assignedTo.name.charAt(0).toUpperCase()}
                      </div>
                              <div className="flex flex-col">
                                <span className="text-xs text-gray-900 font-medium truncate">{contract.assignedTo.name}</span>
                                <span className="text-xs text-gray-500 truncate">{contract.assignedTo.email}</span>
                      </div>
                    </div>
                          ) : (
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                <UserIcon className="h-4 w-4 text-gray-400" />
                      </div>
                              <span className="text-xs text-gray-500">Unassigned</span>
                      </div>
                          )}
                        </td>
                      )}

                      {visibleColumns.noTurns && (
                        <td className="px-1 py-2">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-900">
                              {contract.turnsCompleted || 0}/{contract.totalTurns || 5}
                            </span>
                            <div className="ml-1 w-8 bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-blue-500 h-1 rounded-full" 
                                style={{ 
                                  width: `${((contract.turnsCompleted || 0) / (contract.totalTurns || 5)) * 100}%` 
                                }}
                              ></div>
                </div>
              </div>
                        </td>
                      )}

                      {visibleColumns.assignees && (
                        <td className="px-1 py-2">
                          <div className="flex -space-x-2">
                            {contract.assignedTo && (
                              <div 
                                className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                                title={contract.assignedTo.name}
                              >
                                {contract.assignedTo.name.charAt(0).toUpperCase()}
                  </div>
                            )}
                            {/* Mock additional assignees */}
                            <div 
                              className="w-6 h-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                              title="Mehmet Kaya"
                            >
                              M
                </div>
                            <div 
                              className="w-6 h-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm"
                              title="Ayşe Demir"
                            >
                              A
                            </div>
                            <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white shadow-sm">
                              +2
                            </div>
                          </div>
                        </td>
                      )}

                      {visibleColumns.riskLevel && (
                        <td className="px-1 py-2">
                          {contract.riskLevel && (
                            <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${RISK_COLORS[contract.riskLevel]}`}>
                              {contract.riskLevel}
                            </span>
                          )}
                        </td>
                      )}

                      {visibleColumns.contractValue && (
                        <td className="px-1 py-2 text-xs text-gray-900">
                          {formatCurrency(contract.value)}
                        </td>
                      )}

                      {visibleColumns.latestActivity && (
                        <td className="px-1 py-2 text-xs text-gray-500">
                          {getRelativeTime(contract.lastActivity)}
                        </td>
                      )}

                      {visibleColumns.dateCreated && (
                        <td className="px-1 py-2 text-xs text-gray-500">
                              {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                        </td>
                      )}

                      {visibleColumns.actions && (
                        <td className="px-1 py-2">
                          <button className="text-gray-400 hover:text-gray-600">
                            <EllipsisHorizontalIcon className="h-4 w-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
              </div>

        {/* Pagination */}
        {!loading && contracts.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between shrink-0">
            <div className="flex-1 flex justify-between sm:hidden">
              <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Previous
              </button>
              <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{contracts.length}</span> of{' '}
                  <span className="font-medium">{filterStats?.total || contracts.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Previous</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    aria-current="page"
                    className="z-10 bg-blue-50 border-blue-500 text-blue-600 relative inline-flex items-center px-4 py-2 border text-sm font-medium"
                  >
                    1
                  </button>
                  <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    2
                  </button>
                  <button className="bg-white border-gray-300 text-gray-500 hover:bg-gray-50 relative inline-flex items-center px-4 py-2 border text-sm font-medium">
                    3
                  </button>
                  <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                    <span className="sr-only">Next</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
            </div>
          )}
      </div>
    </div>
  );
} 