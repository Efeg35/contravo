'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  TrendingUp, 
  FileText,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface ContractAlert {
  id: string;
  title: string;
  endDate: string;
  type: string;
  otherPartyName?: string;
  value?: number;
  daysRemaining?: number;
  daysOverdue?: number;
  urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'EXPIRED';
  actionRequired: string;
}

interface ExpiringContractsData {
  criticalActions: {
    expiring7Days: ContractAlert[];
    overdue: ContractAlert[];
  };
  upcomingActions: {
    expiring30Days: ContractAlert[];
    renewalsDue: any[];
  };
  planningData: {
    expiring60Days: number;
    expiring90Days: number;
    totalActiveContracts: number;
    totalActiveValue: number;
    riskScore: string;
  };
  actionSummary: {
    immediateAction: number;
    planningRequired: number;
    monitoring: number;
    healthScore: number;
  };
}

// 🚀 PROAKTIF SÖZLEŞME TAKİP WIDGET'I - "Kör Depolama" Probleminin Çözümü
export default function ProactiveContractWidget() {
  const [data, setData] = useState<ExpiringContractsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExpiringContracts();
    // Her 30 dakikada bir güncelle
    const interval = setInterval(fetchExpiringContracts, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchExpiringContracts = async () => {
    try {
      const response = await fetch('/api/dashboard/expiring-contracts');
      if (!response.ok) throw new Error('Failed to fetch');
      const result = await response.json();
      setData(result.data);
      setError(null);
    } catch (err) {
      setError('Veriler yüklenemedi');
      console.error('Error fetching expiring contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 animate-pulse" />
            Sözleşme Takip Sistemi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" />
            Sözleşme Takip Sistemi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error || 'Veri yüklenemedi'}</p>
          <Button 
            variant="outline" 
            onClick={fetchExpiringContracts}
            className="mt-2"
          >
            Tekrar Dene
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { criticalActions, upcomingActions, planningData, actionSummary } = data;

  return (
    <div className="space-y-6">
      {/* 🎯 GENEL DURUM ÖZETİ */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Sözleşme Sağlık Durumu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`text-2xl font-bold ${getHealthScoreColor(actionSummary.healthScore)}`}>
                {actionSummary.healthScore}%
              </div>
              <p className="text-sm text-gray-600">Sağlık Skoru</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {actionSummary.immediateAction}
              </div>
              <p className="text-sm text-gray-600">Acil Aksyon</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {actionSummary.planningRequired}
              </div>
              <p className="text-sm text-gray-600">Planlama</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {actionSummary.monitoring}
              </div>
              <p className="text-sm text-gray-600">İzleme</p>
            </div>
          </div>
          
          <div className="mt-4 flex items-center justify-between">
            <Badge variant={getRiskBadgeVariant(planningData.riskScore)}>
              Risk Seviyesi: {getRiskText(planningData.riskScore)}
            </Badge>
            <span className="text-sm text-gray-500">
              Toplam Aktif: {planningData.totalActiveContracts} sözleşme
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 🚨 KRİTİK DURUMLAR */}
      {(criticalActions.expiring7Days.length > 0 || criticalActions.overdue.length > 0) && (
        <Card className="w-full border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              🚨 ACİL AKSYON GEREKTİREN ({criticalActions.expiring7Days.length + criticalActions.overdue.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Süresi Dolmuş */}
            {criticalActions.overdue.map(contract => (
              <div key={contract.id} className="flex items-center justify-between p-4 bg-red-100 rounded-lg border border-red-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-semibold text-red-900">{contract.title}</h4>
                    <Badge variant="destructive">
                      {contract.daysOverdue} gün geçikme
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{contract.actionRequired}</p>
                  <p className="text-xs text-red-600">{contract.otherPartyName} • {contract.type}</p>
                </div>
                <Link 
                  href={`/dashboard/contracts/${contract.id}`}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  DERHAL İNCELE
                </Link>
              </div>
            ))}

            {/* 7 Gün İçinde Bitenler */}
            {criticalActions.expiring7Days.map(contract => (
              <div key={contract.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-orange-600" />
                    <h4 className="font-semibold text-orange-900">{contract.title}</h4>
                    <Badge variant="outline" className="border-orange-500 text-orange-700">
                      {contract.daysRemaining} gün kaldı
                    </Badge>
                  </div>
                  <p className="text-sm text-orange-700 mt-1">{contract.actionRequired}</p>
                  <p className="text-xs text-orange-600">{contract.otherPartyName} • {contract.type}</p>
                </div>
                <Link 
                  href={`/dashboard/contracts/${contract.id}`}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                >
                  ACİL KARAR
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ⚠️ YAKLAŞAN TARİHLER */}
      {upcomingActions.expiring30Days.length > 0 && (
        <Card className="w-full border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Calendar className="h-5 w-5" />
              📅 YAKLAŞAN TARİHLER (30 Gün İçinde)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingActions.expiring30Days.map(contract => (
              <div key={contract.id} className="flex items-center justify-between p-3 bg-yellow-100 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">{contract.title}</h4>
                    <Badge variant="outline" className="border-yellow-500 text-yellow-700">
                      {contract.daysRemaining} gün
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-700 mt-1">{contract.actionRequired}</p>
                </div>
                <Link 
                  href={`/dashboard/contracts/${contract.id}`}
                  className="text-yellow-700 hover:text-yellow-900 font-medium"
                >
                  İncele →
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 📊 PLANLAMA VE İSTATİSTİKLER */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            📊 Planlama ve İstatistikler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">{planningData.expiring60Days}</div>
              <p className="text-sm text-blue-700">60 gün içinde</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <div className="text-xl font-bold text-indigo-600">{planningData.expiring90Days}</div>
              <p className="text-sm text-indigo-700">90 gün içinde</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-xl font-bold text-green-600">
                {formatCurrency(planningData.totalActiveValue)}
              </div>
              <p className="text-sm text-green-700">Toplam değer</p>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <Link href="/dashboard/contracts" className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
              <FileText className="h-4 w-4" />
              Tüm Sözleşmeleri Görüntüle
            </Link>
            <Button variant="outline" onClick={fetchExpiringContracts}>
              🔄 Yenile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// 🎨 Yardımcı Fonksiyonlar
function getHealthScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  if (score >= 40) return 'text-orange-600';
  return 'text-red-600';
}

function getRiskBadgeVariant(riskScore: string): "default" | "secondary" | "destructive" | "outline" {
  switch (riskScore) {
    case 'VERY_HIGH': return 'destructive';
    case 'HIGH': return 'destructive';
    case 'MEDIUM': return 'outline';
    case 'LOW': return 'secondary';
    default: return 'default';
  }
}

function getRiskText(riskScore: string): string {
  switch (riskScore) {
    case 'VERY_HIGH': return 'Çok Yüksek';
    case 'HIGH': return 'Yüksek';
    case 'MEDIUM': return 'Orta';
    case 'LOW': return 'Düşük';
    case 'VERY_LOW': return 'Çok Düşük';
    default: return 'Bilinmiyor';
  }
}

function formatCurrency(amount: number): string {
  if (amount === 0) return '0 ₺';
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
} 