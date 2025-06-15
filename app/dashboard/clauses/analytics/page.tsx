'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users, 
  BookOpen,
  Calendar,
  ArrowLeft,
  Download,
  RefreshCw,
  Eye,
  Star,
  Clock,
  Target
} from 'lucide-react';

// Types
interface ClauseAnalytics {
  totalClauses: number;
  totalUsage: number;
  avgUsagePerClause: number;
  mostUsedCategory: string;
  leastUsedCategory: string;
  recentActivity: number;
  topClauses: Array<{
    id: string;
    title: string;
    category: string;
    usageCount: number;
    lastUsed: string;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
    usage: number;
    percentage: number;
  }>;
  usageTrends: Array<{
    date: string;
    usage: number;
    newClauses: number;
  }>;
  userStats: Array<{
    userId: string;
    userName: string;
    clausesCreated: number;
    clausesUsed: number;
    lastActivity: string;
  }>;
}

const ClauseAnalyticsPage = () => {
  const router = useRouter();
  
  // State
  const [analytics, setAnalytics] = useState<ClauseAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [refreshing, setRefreshing] = useState(false);

  // Category labels
  const categoryLabels: Record<string, string> = {
    LEGAL: 'Yasal',
    COMMERCIAL: 'Ticari',
    TECHNICAL: 'Teknik',
    CONFIDENTIALITY: 'Gizlilik',
    TERMINATION: 'Fesih',
    LIABILITY: 'Sorumluluk',
    INTELLECTUAL_PROPERTY: 'Fikri Mülkiyet',
    PAYMENT: 'Ödeme',
    DELIVERY: 'Teslimat',
    COMPLIANCE: 'Uyumluluk',
    DISPUTE: 'Uyuşmazlık',
    FORCE_MAJEURE: 'Mücbir Sebep',
    OTHER: 'Diğer'
  };

  // Fetch analytics data
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      // Mock data - in real app this would be an API call
      const mockAnalytics: ClauseAnalytics = {
        totalClauses: 45,
        totalUsage: 234,
        avgUsagePerClause: 5.2,
        mostUsedCategory: 'CONFIDENTIALITY',
        leastUsedCategory: 'FORCE_MAJEURE',
        recentActivity: 12,
        topClauses: [
          {
            id: '1',
            title: 'Standart Gizlilik Maddesi',
            category: 'CONFIDENTIALITY',
            usageCount: 28,
            lastUsed: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            title: 'Ödeme Koşulları',
            category: 'PAYMENT',
            usageCount: 22,
            lastUsed: '2024-01-14T15:45:00Z'
          },
          {
            id: '3',
            title: 'Fesih Şartları',
            category: 'TERMINATION',
            usageCount: 18,
            lastUsed: '2024-01-13T09:20:00Z'
          },
          {
            id: '4',
            title: 'Sorumluluk Sınırlaması',
            category: 'LIABILITY',
            usageCount: 15,
            lastUsed: '2024-01-12T14:10:00Z'
          },
          {
            id: '5',
            title: 'Fikri Mülkiyet Koruması',
            category: 'INTELLECTUAL_PROPERTY',
            usageCount: 12,
            lastUsed: '2024-01-11T11:30:00Z'
          }
        ],
        categoryStats: [
          { category: 'CONFIDENTIALITY', count: 8, usage: 45, percentage: 35 },
          { category: 'PAYMENT', count: 6, usage: 32, percentage: 25 },
          { category: 'TERMINATION', count: 5, usage: 28, percentage: 20 },
          { category: 'LIABILITY', count: 4, usage: 18, percentage: 12 },
          { category: 'INTELLECTUAL_PROPERTY', count: 3, usage: 15, percentage: 8 }
        ],
        usageTrends: [
          { date: '2024-01-01', usage: 15, newClauses: 2 },
          { date: '2024-01-02', usage: 18, newClauses: 1 },
          { date: '2024-01-03', usage: 22, newClauses: 3 },
          { date: '2024-01-04', usage: 19, newClauses: 0 },
          { date: '2024-01-05', usage: 25, newClauses: 2 }
        ],
        userStats: [
          {
            userId: '1',
            userName: 'Ahmet Yılmaz',
            clausesCreated: 12,
            clausesUsed: 45,
            lastActivity: '2024-01-15T10:30:00Z'
          },
          {
            userId: '2',
            userName: 'Ayşe Demir',
            clausesCreated: 8,
            clausesUsed: 32,
            lastActivity: '2024-01-14T15:45:00Z'
          },
          {
            userId: '3',
            userName: 'Mehmet Kaya',
            clausesCreated: 6,
            clausesUsed: 28,
            lastActivity: '2024-01-13T09:20:00Z'
          }
        ]
      };
      
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Analytics yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  // Export analytics
  const handleExport = () => {
    // Mock export functionality
    console.log('Exporting analytics...');
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-500 mt-4">Analytics yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6 max-w-6xl">
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Analytics verisi yüklenemedi</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Clause Analytics
            </h1>
            <p className="text-gray-600">
              Clause kullanım istatistikleri ve performans analizi
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 gün</SelectItem>
              <SelectItem value="30d">Son 30 gün</SelectItem>
              <SelectItem value="90d">Son 90 gün</SelectItem>
              <SelectItem value="1y">Son 1 yıl</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Dışa Aktar
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Clause</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClauses}</div>
            <p className="text-xs text-muted-foreground">
              Aktif clause sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Kullanım</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{analytics.totalUsage}</div>
            <p className="text-xs text-muted-foreground">
              Clause kullanım sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Kullanım</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{analytics.avgUsagePerClause}</div>
            <p className="text-xs text-muted-foreground">
              Clause başına kullanım
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Son Aktivite</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{analytics.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Son 24 saatte
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Clauses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              En Çok Kullanılan Clause'lar
            </CardTitle>
            <CardDescription>
              Kullanım sıklığına göre sıralanmış clause'lar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topClauses.map((clause, index) => (
                <div key={clause.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{clause.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {categoryLabels[clause.category]}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          Son kullanım: {new Date(clause.lastUsed).toLocaleDateString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">{clause.usageCount}</div>
                    <div className="text-xs text-gray-500">kullanım</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Kategori İstatistikleri
            </CardTitle>
            <CardDescription>
              Kategorilere göre clause dağılımı ve kullanımı
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.categoryStats.map((stat) => (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {categoryLabels[stat.category]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{stat.count} clause</span>
                      <span className="text-sm font-medium text-blue-600">{stat.usage} kullanım</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${stat.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    %{stat.percentage} kullanım oranı
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Kullanıcı İstatistikleri
          </CardTitle>
          <CardDescription>
            En aktif clause oluşturucu ve kullanıcıları
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.userStats.map((user) => (
              <div key={user.userId} className="p-4 border rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {user.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{user.userName}</h4>
                    <p className="text-xs text-gray-500">
                      Son aktivite: {new Date(user.lastActivity).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Oluşturulan:</span>
                    <span className="font-medium">{user.clausesCreated} clause</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Kullanılan:</span>
                    <span className="font-medium">{user.clausesUsed} kez</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClauseAnalyticsPage; 