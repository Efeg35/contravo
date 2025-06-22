import prisma from '@/lib/prisma';
import React from 'react';
import Link from 'next/link';
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
import ContractFilters from './ContractFilters';
import SortableHeader from './components/SortableHeader';
import { getCurrentUser } from '@/lib/auth-helpers';
import { getContractsVisibilityFilter } from '@/lib/permissions';
import { redirect } from 'next/navigation';
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
  updatedAt?: string;
}

interface ContractStats {
  totalContracts: number;
  signedContracts: number;
  inReviewContracts: number;
  draftContracts: number;
  totalValue: number;
}

export default async function ContractsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ 
    q?: string; 
    status?: string; 
    type?: string;
    sortBy?: 'title' | 'status' | 'createdAt' | 'updatedAt' | 'expirationDate';
    order?: 'asc' | 'desc';
  }> 
}) {
  // Kullanıcı kimlik doğrulaması
  const user = await getCurrentUser();
  if (!user) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const q = params.q || '';
  const status = params.status || 'all';
  const typeFilter = params.type || 'all';
  const sortBy = params.sortBy || 'createdAt';
  const order = params.order || 'desc';

  // Güvenlik: Kullanıcının görme yetkisi olan sözleşmeler için filtre oluştur
  const visibilityFilter = await getContractsVisibilityFilter(user.id, user.role);

  // Dinamik where koşulu oluştur
  const where: any = {
    AND: [
      visibilityFilter, // Güvenlik filtresi eklendi
      // Mevcut arama filtreleri
      ...(q ? [{ title: { contains: q, mode: 'insensitive' } }] : []),
      ...(status && status !== 'all' ? [{ status }] : []),
      ...(typeFilter && typeFilter !== 'all' ? [{ type: typeFilter }] : [])
    ]
  };

  // Paralel veri çekme - artık güvenlik filtresiyle
  const [totalCount, reviewingCount, signedCount, contracts] = await Promise.all([
    prisma.contract.count({ where: { AND: [visibilityFilter] } }), // Güvenlik filtresi eklendi
    prisma.contract.count({ where: { AND: [visibilityFilter, { status: 'IN_REVIEW' }] } }), // Güvenlik filtresi eklendi
    prisma.contract.count({ where: { AND: [visibilityFilter, { status: 'SIGNED' }] } }), // Güvenlik filtresi eklendi
    prisma.contract.findMany({
      where,
      orderBy: { [sortBy]: order },
      include: {
        createdBy: true,
        company: true,
      },
    })
  ]);

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

  // Filter contracts
  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(q.toLowerCase()) ||
                         contract.description?.toLowerCase().includes(q.toLowerCase()) ||
                         contract.otherPartyName?.toLowerCase().includes(q.toLowerCase());
    const matchesFilter = status === 'all' || contract.status === status;
    const matchesType = typeFilter === 'all' || contract.type === typeFilter;
    
    return matchesSearch && matchesFilter && matchesType;
  });

  if (contracts.length === 0) {
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
        
        <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/contracts/new">
            <Plus className="h-5 w-5 mr-2" />
            Yeni Sözleşme Oluştur
          </Link>
        </Button>
      </div>

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
              {/* Arama ve filtreleme çubuğu */}
              <ContractFilters />

              {/* İstatistik kartları */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Sözleşme</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">İncelemede</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">{reviewingCount}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">İmzalanan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{signedCount}</div>
                  </CardContent>
                </Card>
              </div>
              {/* Contracts List */}
              {filteredContracts.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">Sözleşme bulunamadı</h3>
                  <p className="text-gray-500">
                    {status === 'all' ? 'Henüz hiç sözleşme oluşturmamışsınız.' : 'Bu filtreye uygun sözleşme bulunamadı.'}
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
                  <div className="grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg font-medium">
                    <div className="col-span-4">
                      <SortableHeader label="Başlık" sortKey="title" />
                    </div>
                    <div className="col-span-2">
                      <SortableHeader label="Durum" sortKey="status" />
                    </div>
                    <div className="col-span-2">
                      <SortableHeader label="Oluşturma Tarihi" sortKey="createdAt" />
                    </div>
                    <div className="col-span-2">
                      <SortableHeader label="Son Güncelleme" sortKey="updatedAt" />
                    </div>
                    <div className="col-span-2">
                      <SortableHeader label="Bitiş Tarihi" sortKey="expirationDate" />
                    </div>
                  </div>
                  {filteredContracts.map((contract) => (
                    <div key={contract.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                        <Link href={`/contract/${contract.id}`} className="flex-1 min-w-0">
                            <h3 className="text-lg font-medium truncate">{contract.title}</h3>
                            <p className="text-sm text-gray-500 truncate">{contract.description}</p>
                          </Link>
                              </div>
                        <div className="col-span-2">
                          <Badge className={getStatusColor(contract.status)}>
                            {getStatusText(contract.status)}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-sm text-gray-500">
                          {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500">
                          {contract.updatedAt ? new Date(contract.updatedAt).toLocaleDateString('tr-TR') : '-'}
                        </div>
                        <div className="col-span-2 text-sm text-gray-500">
                          {contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : '-'}
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
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Yeni Sözleşme Oluştur
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/collaboration">
                  <Users className="h-4 w-4 mr-2" />
                  Gerçek Zamanlı İşbirliği
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/workflows">
                  <Workflow className="h-4 w-4 mr-2" />
                  İş Akışı Tasarımı
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/approvals">
                  <CheckCheck className="h-4 w-4 mr-2" />
                  Onay İş Akışı
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/tracking">
                  <Activity className="h-4 w-4 mr-2" />
                  İş Akışı Takibi
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/dashboard/contracts/automation">
                  <Zap className="h-4 w-4 mr-2" />
                  Otomasyon Kuralları
                </Link>
              </Button>
              
              <div className="border-t pt-3 mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Advanced Contract Authoring</p>
                
                <Button asChild variant="outline" className="w-full justify-start mb-2">
                  <Link href="/dashboard/contracts/editor">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Collaborative Editor
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full justify-start mb-2">
                  <Link href="/dashboard/contracts/smart-clauses">
                    <Brain className="h-4 w-4 mr-2" />
                    Smart Clauses
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full justify-start mb-2">
                  <Link href="/dashboard/contracts/conditional-logic">
                    <GitBranch className="h-4 w-4 mr-2" />
                    Conditional Logic
                  </Link>
                </Button>
                
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/dashboard/contracts/language-support">
                    <Globe className="h-4 w-4 mr-2" />
                    Language Support
                  </Link>
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