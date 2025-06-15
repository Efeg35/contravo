'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  FileText, 
  TrendingUp, 
  Users, 
  Building2,
  BarChart3,
  Settings,
  CheckCheck,
  GitBranch,
  Heart,
  Tag,
  Workflow,
  Activity,
  Zap,
  Star,
  MessageSquare,
  Edit3,
  UserPlus,
  Brain,
  Globe
} from 'lucide-react';
// import BulkOperations from '@/components/BulkOperations';

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

interface ContractStats {
  totalContracts: number;
  signedContracts: number;
  inReviewContracts: number;
  draftContracts: number;
  totalValue: number;
}

export default function ContractsPage() {
  const { data: session } = useSession();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showBulkMode, setShowBulkMode] = useState(false);
  const [selectedContractIds, setSelectedContractIds] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Fetch contracts
  const fetchContracts = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/contracts?page=${page}&limit=${pagination.limit}&search=${searchTerm}&status=${filter}&type=${typeFilter}`);
      const data = await response.json();
      
      if (response.ok) {
        setContracts(data.contracts || []);
        setPagination(data.pagination || pagination);
      }
    } catch (error) {
      console.error('Sözleşmeler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/contracts/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  useEffect(() => {
    fetchContracts();
    fetchStats();
  }, [searchTerm, filter, typeFilter, fetchContracts]);

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'IN_REVIEW':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-300';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-300';
      case 'SIGNED':
        return 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-300';
      case 'ARCHIVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-700 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get status text
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

  // Get type text
  const getTypeText = (type: string) => {
    switch (type) {
      case 'NDA': return 'Gizlilik Sözleşmesi';
      case 'SERVICE': return 'Hizmet Sözleşmesi';
      case 'EMPLOYMENT': return 'İş Sözleşmesi';
      case 'PARTNERSHIP': return 'Ortaklık Sözleşmesi';
      case 'SALES': return 'Satış Sözleşmesi';
      case 'LEASE': return 'Kira Sözleşmesi';
      case 'OTHER': return 'Diğer';
      default: return type;
    }
  };

  // Handle PDF download
  const handleDownloadPDF = async (contract: Contract) => {
    try {
      const response = await fetch(`/api/contracts/${contract.id}/pdf`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${contract.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error('PDF indirilemedi');
      }
    } catch (error) {
      console.error('PDF indirme hatası:', error);
    }
  };

  // Handle bulk actions
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
          ...data
        })
      });

      if (response.ok) {
        fetchContracts(pagination.page);
        setSelectedContractIds([]);
        setShowBulkMode(false);
      }
    } catch (error) {
      console.error('Toplu işlem hatası:', error);
    }
  };

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.otherPartyName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || contract.status === filter;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    
    return matchesSearch && matchesFilter && matchesType;
  });

  if (loading && contracts.length === 0) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Sözleşmeler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Sözleşme Yönetimi
          </h1>
          <p className="text-gray-600 mt-2">
            Sözleşmelerinizi oluşturun, yönetin ve takip edin
          </p>
        </div>
        
        <Button 
          size="lg"
          onClick={() => window.location.href = '/dashboard/contracts/new'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Sözleşme Oluştur
        </Button>
      </div>

      {/* Statistics Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                Aktif sözleşme sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İmzalanan</CardTitle>
              <CheckCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.signedContracts}</div>
              <p className="text-xs text-muted-foreground">
                Tamamlanan sözleşmeler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">İncelemede</CardTitle>
              <Users className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.inReviewContracts}</div>
              <p className="text-xs text-muted-foreground">
                Onay bekleyen sözleşmeler
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Değer</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalValue ? `₺${stats.totalValue.toLocaleString('tr-TR')}` : '₺0'}
              </div>
              <p className="text-xs text-muted-foreground">
                Sözleşme toplam değeri
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contracts List */}
        <div className="lg:col-span-2">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Sözleşme Listesi
              </CardTitle>
              <CardDescription>
                Mevcut sözleşmelerinizi görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] overflow-auto">
              {/* Search and Filters */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Sözleşme ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tüm Durumlar</option>
                      <option value="DRAFT">Taslak</option>
                      <option value="IN_REVIEW">İncelemede</option>
                      <option value="APPROVED">Onaylandı</option>
                      <option value="SIGNED">İmzalandı</option>
                      <option value="ARCHIVED">Arşivlendi</option>
                    </select>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Tüm Türler</option>
                      <option value="NDA">Gizlilik</option>
                      <option value="SERVICE">Hizmet</option>
                      <option value="EMPLOYMENT">İş</option>
                      <option value="PARTNERSHIP">Ortaklık</option>
                      <option value="SALES">Satış</option>
                      <option value="LEASE">Kira</option>
                      <option value="OTHER">Diğer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contracts List */}
              {filteredContracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Sözleşme bulunamadı</h3>
                  <p className="text-gray-500">
                    {filter === 'all' ? 'Henüz hiç sözleşme oluşturmamışsınız.' : 'Bu filtreye uygun sözleşme bulunamadı.'}
                  </p>
                  <Link
                    href="/dashboard/contracts/new"
                    className="inline-flex items-center px-4 py-2 mt-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    İlk sözleşmenizi oluşturun
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredContracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <Link href={`/dashboard/contracts/${contract.id}`} className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 truncate">
                                {contract.title}
                              </div>
                              <div className="text-sm text-gray-500 truncate">
                                {contract.description}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                {getTypeText(contract.type)} • {contract.otherPartyName || 'Diğer Taraf Belirtilmemiş'} • {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className="flex items-center gap-2 ml-4">
                          <Badge className={getStatusColor(contract.status)}>
                            {getStatusText(contract.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/new'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Sözleşme Oluştur
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/collaboration'}
              >
                <Users className="h-4 w-4 mr-2" />
                Gerçek Zamanlı İşbirliği
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/workflows'}
              >
                <Workflow className="h-4 w-4 mr-2" />
                İş Akışı Tasarımı
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/approvals'}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Onay İş Akışı
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/tracking'}
              >
                <Activity className="h-4 w-4 mr-2" />
                İş Akışı Takibi
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/contracts/automation'}
              >
                <Zap className="h-4 w-4 mr-2" />
                Otomasyon Kuralları
              </Button>
              
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Advanced Contract Authoring</p>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start mb-2"
                  onClick={() => window.location.href = '/dashboard/contracts/editor'}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Collaborative Editor
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start mb-2"
                  onClick={() => window.location.href = '/dashboard/contracts/smart-clauses'}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  Smart Clauses
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start mb-2"
                  onClick={() => window.location.href = '/dashboard/contracts/conditional-logic'}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Conditional Logic
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/dashboard/contracts/language-support'}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Language Support
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Popular Contract Types */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popüler Sözleşme Türleri</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Gizlilik</Badge>
                  <span className="text-sm text-gray-500">8 sözleşme</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Hizmet</Badge>
                  <span className="text-sm text-gray-500">6 sözleşme</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">İş</Badge>
                  <span className="text-sm text-gray-500">4 sözleşme</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Ortaklık</Badge>
                  <span className="text-sm text-gray-500">3 sözleşme</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Gizlilik sözleşmesi imzalandı</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Hizmet sözleşmesi oluşturuldu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-gray-600">İş sözleşmesi incelemede</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help & Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                İpuçları
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-2">
              <p>• Sözleşmeleri türlerine göre kategorilere ayırın</p>
              <p>• İş akışları ile onay süreçlerini otomatikleştirin</p>
              <p>• Gerçek zamanlı işbirliği ile ekibinizle çalışın</p>
              <p>• Şablonlar kullanarak hızlı sözleşme oluşturun</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 