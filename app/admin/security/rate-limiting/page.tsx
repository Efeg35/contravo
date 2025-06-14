'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ShieldAlert, 
  Activity, 
  Settings, 
  TrendingUp, 
  AlertTriangle,
  Users
} from 'lucide-react';

interface RateLimitStats {
  totalRequests: number;
  totalViolations: number;
  topViolators: Array<{ key: string; violations: number }>;
  suspiciousPatterns: Array<{
    key: string;
    requestCount: number;
    violationCount: number;
    suspiciousScore: number;
  }>;
}

interface RateLimitRule {
  id: string;
  name: string;
  strategy: string;
  windowSize: number;
  maxRequests: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function RateLimitingPage() {
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [rules, setRules] = useState<RateLimitRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [newRule, setNewRule] = useState({
    name: '',
    path: '',
    method: 'GET',
    limit: '',
    window: '',
    description: ''
  });

  useEffect(() => {
    loadData();
    
    // Set up real-time updates
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Load statistics
      const statsResponse = await fetch('/api/admin/rate-limit?action=stats');
      const statsData = await statsResponse.json();
      
      if (statsData.success) {
        setStats(statsData.data.statistics);
      }

      // Load rules
      const rulesResponse = await fetch('/api/admin/rate-limit?action=rules');
      const rulesData = await rulesResponse.json();
      
      if (rulesData.success) {
        setRules(rulesData.data.rules);
      }

    } catch (_) {
      console.error('Error loading rate limit data:');
      setMessage({ type: 'error', text: 'Failed to load rate limiting data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRule = async () => {
    try {
      const response = await fetch('/api/admin/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-rate-limit-rule',
          data: {
            name: newRule.name,
            path: newRule.path,
            method: newRule.method,
            limit: parseInt(newRule.limit),
            window: parseInt(newRule.window),
            description: newRule.description
          }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Rate limit rule created successfully' });
        setNewRule({ name: '', path: '', method: 'GET', limit: '', window: '', description: '' });
        loadData();
      }
    } catch (_) {
      console.error('Create rule error:');
      setMessage({ type: 'error', text: 'Failed to create rate limit rule' });
    }
  };

  const handleToggleRule = async (ruleId: string, enabled: boolean) => {
    try {
      const response = await fetch('/api/admin/rate-limit', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'toggle-rate-limit-rule',
          ruleId,
          data: { enabled }
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Rate limit rule ${enabled ? 'enabled' : 'disabled'} successfully` });
        loadData();
      }
    } catch (_) {
      console.error('Toggle rule error:');
      setMessage({ type: 'error', text: 'Failed to toggle rate limit rule' });
    }
  };

  const handleResetLimits = async () => {
    try {
      const response = await fetch('/api/admin/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-rate-limits',
          data: {}
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Rate limits reset successfully' });
        loadData();
      }
    } catch (_) {
      console.error('Reset limits error:');
      setMessage({ type: 'error', text: 'Failed to reset rate limits' });
    }
  };

  const clearViolations = async (key: string) => {
    try {
      const response = await fetch('/api/admin/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'clear_violations',
          key,
          timeRange: '24h'
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Violations cleared successfully' });
        loadData();
      }
    } catch (_) {
      console.error('Clear violations error:');
      setMessage({ type: 'error', text: 'Failed to clear violations' });
    }
  };

  const whitelistIP = async (ip: string) => {
    try {
      const response = await fetch('/api/admin/rate-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'whitelist_ip',
          ip,
          duration: 3600 // 1 hour
        })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'IP whitelisted successfully' });
        loadData();
      }
    } catch (_) {
      console.error('Whitelist IP error:');
      setMessage({ type: 'error', text: 'Failed to whitelist IP' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const violationRate = stats && stats.totalRequests > 0 
    ? ((stats.totalViolations / stats.totalRequests) * 100).toFixed(2)
    : '0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rate Limiting</h1>
          <p className="text-gray-600">
            Güvenlik ve performans için rate limiting kurallarını yönetin
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Settings className="mr-2 h-4 w-4" />
          Yeni Kural Ekle
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İstek</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRequests?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam İhlal</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats?.totalViolations?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              İhlal oranı: %{violationRate}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kurallar</CardTitle>
            <ShieldAlert className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {rules.filter(r => r.enabled).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Toplam {rules.length} kural
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Şüpheli Aktivite</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats?.suspiciousPatterns?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground">Analiz edilen pattern</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="rules">Kurallar</TabsTrigger>
          <TabsTrigger value="violations">İhlaller</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Violators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  En Çok İhlal Eden IP'ler
                </CardTitle>
                <CardDescription>
                  Son 24 saat içindeki en yüksek ihlal sayıları
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.topViolators?.slice(0, 5).map((violator, index) => (
                    <div key={violator.key} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-red-600 font-bold text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-medium">{violator.key}</p>
                          <p className="text-sm text-gray-500">{violator.violations} ihlal</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => whitelistIP(violator.key.replace(/^.*:/, ''))}
                        >
                          Whitelist
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => clearViolations(violator.key)}
                        >
                          Temizle
                        </Button>
                      </div>
                    </div>
                  )) || <p className="text-gray-500">Henüz ihlal bulunmuyor</p>}
                </div>
              </CardContent>
            </Card>

            {/* Suspicious Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Şüpheli Patterns
                </CardTitle>
                <CardDescription>
                  Anormal davranış gösteren pattern'ler
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.suspiciousPatterns?.slice(0, 5).map((pattern) => (
                    <div key={pattern.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{pattern.key}</p>
                        <p className="text-sm text-gray-500">
                          {pattern.requestCount} istek, {pattern.violationCount} ihlal
                        </p>
                      </div>
                      <Badge 
                        variant={pattern.suspiciousScore > 80 ? "destructive" : 
                                pattern.suspiciousScore > 50 ? "secondary" : "outline"}
                      >
                        Risk: {pattern.suspiciousScore}/100
                      </Badge>
                    </div>
                  )) || <p className="text-gray-500">Şüpheli pattern bulunamadı</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Kuralları</CardTitle>
              <CardDescription>
                Sistemdeki tüm rate limiting kurallarını görüntüleyin ve yönetin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${rule.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <h3 className="font-medium">{rule.name}</h3>
                        <Badge variant={
                          rule.priority === 'critical' ? 'destructive' :
                          rule.priority === 'high' ? 'secondary' :
                          rule.priority === 'medium' ? 'outline' : 'secondary'
                        }>
                          {rule.priority}
                        </Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>
                          <strong>Strateji:</strong> {rule.strategy} | 
                          <strong> Limit:</strong> {rule.maxRequests} istek / {rule.windowSize}s |
                          <strong> ID:</strong> {rule.id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={rule.enabled ? "destructive" : "default"}
                        onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                      >
                        {rule.enabled ? 'Devre Dışı' : 'Etkinleştir'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                                                        onClick={() => console.log('View rule:', rule.id)}
                      >
                        Düzenle
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="violations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>İhlal Geçmişi</CardTitle>
              <CardDescription>
                Rate limit ihlallerinin detaylı görünümü
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topViolators?.map((violator) => (
                  <div key={violator.key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div>
                        <p className="font-medium">{violator.key}</p>
                        <p className="text-sm text-gray-500">
                          {violator.violations} toplam ihlal
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        Detaylar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => clearViolations(violator.key)}
                      >
                        Temizle
                      </Button>
                    </div>
                  </div>
                )) || <p className="text-gray-500">Henüz ihlal kaydı bulunmuyor</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trafik Patterns</CardTitle>
              <CardDescription>
                Sistem tarafından tespit edilen trafik desenleri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.suspiciousPatterns?.map((pattern) => (
                  <div key={pattern.key} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">{pattern.key}</h3>
                      <Badge 
                        variant={pattern.suspiciousScore > 80 ? "destructive" : 
                                pattern.suspiciousScore > 50 ? "secondary" : "outline"}
                      >
                        Şüphe Skoru: {pattern.suspiciousScore}/100
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Toplam İstek</p>
                        <p className="font-medium">{pattern.requestCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">İhlal Sayısı</p>
                        <p className="font-medium text-red-600">{pattern.violationCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">İhlal Oranı</p>
                        <p className="font-medium">
                          %{pattern.requestCount > 0 ? 
                            ((pattern.violationCount / pattern.requestCount) * 100).toFixed(1) : 0}
                        </p>
                      </div>
                    </div>
                  </div>
                )) || <p className="text-gray-500">Henüz analiz edilmiş pattern bulunmuyor</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 