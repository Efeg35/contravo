'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  BookOpen, 
  TrendingUp, 
  Users, 
  Building2,
  BarChart3,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  Copy,
  Star,
  Settings,
  CheckCheck,
  GitBranch,
  Heart,
  Tag,
  Workflow,
  Activity,
  Zap
} from 'lucide-react';
import ClauseLibrary from '@/components/ClauseLibrary';
import { cn } from '@/lib/utils';

interface ClauseStats {
  totalClauses: number;
  publicClauses: number;
  companyClauses: number;
  privateClauses: number;
  mostUsedCategory: string;
  totalUsage: number;
}

const ClausesPage = () => {
  const { data: session } = useSession();
  const [stats, setStats] = useState<ClauseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');

  // Fetch clause statistics
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/clauses/stats');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      }
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleClauseSelect = (clause: any) => {
    // Handle clause selection - could open a modal or navigate to detail
    console.log('Selected clause:', clause);
  };

  const handleClauseDrop = (clause: any) => {
    // Handle clause usage - could add to a contract or copy to clipboard
    navigator.clipboard.writeText(clause.content);
    // You could show a toast notification here
    console.log('Clause copied to clipboard:', clause.title);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Smart Clauses
          </h1>
          <p className="text-gray-600 mt-2">
            Akıllı sözleşme maddeleri kütüphanesi - Hazır clause'ları kullanın ve yönetin
          </p>
        </div>
        
        <Button 
          size="lg"
          onClick={() => window.location.href = '/dashboard/clauses/new'}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Yeni Clause Oluştur
        </Button>
      </div>

      {/* Statistics Cards */}
      {!loading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Clause</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalClauses}</div>
              <p className="text-xs text-muted-foreground">
                Aktif clause sayısı
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Herkese Açık</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.publicClauses}</div>
              <p className="text-xs text-muted-foreground">
                Public clause'lar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Şirket İçi</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.companyClauses}</div>
              <p className="text-xs text-muted-foreground">
                Company clause'lar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanım</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsage}</div>
              <p className="text-xs text-muted-foreground">
                Clause kullanım sayısı
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Clause Library */}
        <div className="lg:col-span-2">
          <Card className="h-[700px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Clause Kütüphanesi
              </CardTitle>
              <CardDescription>
                Mevcut clause'ları görüntüleyin, filtreleyin ve kullanın
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[600px] p-0">
              <ClauseLibrary
                companyId={selectedCompanyId}
                onClauseSelect={handleClauseSelect}
                onClauseDrop={handleClauseDrop}
                className="h-full p-6"
              />
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
                onClick={() => window.location.href = '/dashboard/clauses/new'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Yeni Clause Oluştur
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/variables'}
              >
                <Settings className="h-4 w-4 mr-2" />
                Değişken Yönetimi
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/approvals'}
              >
                <CheckCheck className="h-4 w-4 mr-2" />
                Onay İş Akışı
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/templates'}
              >
                <Copy className="h-4 w-4 mr-2" />
                Clause Şablonları
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/analytics'}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Kullanım Analitikleri
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/versions'}
              >
                <GitBranch className="h-4 w-4 mr-2" />
                Versiyon Geçmişi
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/favorites'}
              >
                <Heart className="h-4 w-4 mr-2" />
                Favori Clause'lar
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/tags'}
              >
                <Tag className="h-4 w-4 mr-2" />
                Etiket Yönetimi
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/workflows'}
              >
                <Workflow className="h-4 w-4 mr-2" />
                İş Akışı Tasarımı
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/tracking'}
              >
                <Activity className="h-4 w-4 mr-2" />
                İş Akışı Takibi
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/dashboard/clauses/automation'}
              >
                <Zap className="h-4 w-4 mr-2" />
                Otomasyon Kuralları
              </Button>
            </CardContent>
          </Card>

          {/* Popular Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Popüler Kategoriler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Gizlilik</Badge>
                  <span className="text-sm text-gray-500">12 clause</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Ödeme</Badge>
                  <span className="text-sm text-gray-500">8 clause</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Fesih</Badge>
                  <span className="text-sm text-gray-500">6 clause</span>
                </div>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">Sorumluluk</Badge>
                  <span className="text-sm text-gray-500">5 clause</span>
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
                  <span className="text-gray-600">Gizlilik maddesi oluşturuldu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Ödeme clause'u güncellendi</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Fesih maddesi kullanıldı</span>
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
              <p>• Clause'ları kategorilere ayırarak düzenleyin</p>
              <p>• Değişkenler kullanarak esnek maddeler oluşturun</p>
              <p>• Sık kullanılan clause'ları favorilerinize ekleyin</p>
              <p>• Şirket içi clause'ları ekibinizle paylaşın</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ClausesPage; 