'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import StatusDistributionWidget from './widgets/StatusDistributionWidget';
import MonthlyVolumeWidget from './widgets/MonthlyVolumeWidget';
import PerformanceMetricsWidget, { useGlobalStats } from './widgets/PerformanceMetricsWidget';
import RevenueTrendWidget from './widgets/RevenueTrendWidget';
import UserActivityWidget from './widgets/UserActivityWidget';
import ResponseTimeWidget from './widgets/ResponseTimeWidget';
import SavedReportsSection from './components/SavedReportsSection';

// Performans verileri için interface
interface PerformanceData {
  averageCompletionDays: number;
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  signedContracts: number;
}

// Sparkline veri yapısı
interface SparklineData {
  value: number;
}

// Quick Stats Component - Client component  
function QuickStatsBar() {
  const statsData = useGlobalStats();

  if (!statsData) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-white/20 dark:border-gray-700/50 shadow-xl p-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {statsData.totalContracts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Toplam Sözleşme
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {statsData.activeContracts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Aktif Süreçte
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {statsData.pendingContracts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Bekleyen Onay
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {statsData.signedContracts}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            İmzalanmış
          </div>
        </div>
      </div>
    </div>
  );
}

// Dropdown menu component
function MetricDropdown({ isOpen, onToggle }: { isOpen: boolean; onToggle: (e?: React.MouseEvent) => void }) {
  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-gray-700/50 transition-all duration-200 group"
      >
        <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
          <div className="py-2">
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Detayları Görüntüle
              </div>
            </button>
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Rapor Olarak Dışa Aktar
              </div>
            </button>
            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
            <button className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ayarlar
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sparkline component
function Sparkline({ data, color }: { data: SparklineData[]; color: string }) {
  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color} 
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Karşılaştırma metriği component
function ComparisonMetric({ value, isPositive }: { value: number; isPositive: boolean }) {
  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
      isPositive 
        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
    }`}>
      <svg 
        className={`w-4 h-4 mr-1 ${isPositive ? 'rotate-0' : 'rotate-180'}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
      {isPositive ? '+' : ''}{value}%
    </div>
  );
}

// Hero Kartları Component
function HeroMetricsCards() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);

  // Mock sparkline data - gerçek uygulamada API'den gelecek
  const mockSparklineData: SparklineData[] = [
    { value: 2.1 }, { value: 1.8 }, { value: 2.3 }, { value: 1.9 }, 
    { value: 1.6 }, { value: 1.4 }, { value: 1.2 }, { value: 0.9 },
    { value: 0.7 }, { value: 0.3 }
  ];

  const completionSparklineData: SparklineData[] = [
    { value: 65 }, { value: 68 }, { value: 72 }, { value: 70 }, 
    { value: 75 }, { value: 78 }, { value: 82 }, { value: 85 },
    { value: 88 }, { value: 92 }
  ];

  const activitySparklineData: SparklineData[] = [
    { value: 45 }, { value: 48 }, { value: 52 }, { value: 55 }, 
    { value: 58 }, { value: 62 }, { value: 65 }, { value: 68 },
    { value: 72 }, { value: 75 }
  ];

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/performance-metrics');
        if (!response.ok) throw new Error('Veri alınamadı');
        
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Performans metrikleri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Dropdown dışına tıklandığında kapatma
  useEffect(() => {
    function handleClickOutside() {
      setOpenDropdown(null);
    }
    
    if (openDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdown]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl"></div>
          <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl"></div>
          <div className="h-48 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>Performans verileri yüklenemedi</p>
        </div>
      </div>
    );
  }

  const completionRate = data.totalContracts > 0 ? (data.signedContracts / data.totalContracts) * 100 : 0;
  const activeRate = data.totalContracts > 0 ? (data.activeContracts / data.totalContracts) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Ortalama Tamamlanma Süresi - Hero Card */}
      <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 dark:from-blue-900/20 dark:via-blue-800/10 dark:to-indigo-900/30 rounded-3xl p-8 border border-blue-200/50 dark:border-blue-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <MetricDropdown 
            isOpen={openDropdown === 1} 
            onToggle={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              setOpenDropdown(openDropdown === 1 ? null : 1);
            }} 
          />
        </div>
        
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {data.averageCompletionDays}
          <span className="text-xl font-medium text-gray-500 dark:text-gray-400 ml-2">gün</span>
        </div>
        
        <div className="text-base text-gray-600 dark:text-gray-400 mb-4">
          Ortalama Tamamlanma Süresi
        </div>

        {/* Sparkline grafik */}
        <div className="mb-4">
          <Sparkline data={mockSparklineData} color="#3B82F6" />
        </div>

        {/* Karşılaştırma metriği */}
        <div className="flex items-center justify-between">
          <ComparisonMetric value={15.2} isPositive={false} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Önceki döneme göre
          </div>
        </div>
      </div>

      {/* Tamamlanma Oranı - Hero Card */}
      <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-100 dark:from-green-900/20 dark:via-green-800/10 dark:to-emerald-900/30 rounded-3xl p-8 border border-green-200/50 dark:border-green-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <MetricDropdown 
            isOpen={openDropdown === 2} 
            onToggle={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              setOpenDropdown(openDropdown === 2 ? null : 2);
            }} 
          />
        </div>
        
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {completionRate.toFixed(1)}
          <span className="text-xl font-medium text-gray-500 dark:text-gray-400 ml-2">%</span>
        </div>
        
        <div className="text-base text-gray-600 dark:text-gray-400 mb-4">
          Tamamlanma Oranı
        </div>

        {/* Sparkline grafik */}
        <div className="mb-4">
          <Sparkline data={completionSparklineData} color="#10B981" />
        </div>

        {/* Karşılaştırma metriği */}
        <div className="flex items-center justify-between">
          <ComparisonMetric value={8.5} isPositive={true} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Önceki döneme göre
          </div>
        </div>
      </div>

      {/* Aktivite Oranı - Hero Card */}
      <div className="bg-gradient-to-br from-amber-50 via-amber-50 to-orange-100 dark:from-amber-900/20 dark:via-amber-800/10 dark:to-orange-900/30 rounded-3xl p-8 border border-amber-200/50 dark:border-amber-700/30 shadow-xl hover:shadow-2xl transition-all duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <MetricDropdown 
            isOpen={openDropdown === 3} 
            onToggle={(e?: React.MouseEvent) => {
              e?.stopPropagation();
              setOpenDropdown(openDropdown === 3 ? null : 3);
            }} 
          />
        </div>
        
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {activeRate.toFixed(1)}
          <span className="text-xl font-medium text-gray-500 dark:text-gray-400 ml-2">%</span>
        </div>
        
        <div className="text-base text-gray-600 dark:text-gray-400 mb-4">
          Aktivite Oranı
        </div>

        {/* Sparkline grafik */}
        <div className="mb-4">
          <Sparkline data={activitySparklineData} color="#F59E0B" />
        </div>

        {/* Karşılaştırma metriği */}
        <div className="flex items-center justify-between">
          <ComparisonMetric value={12.3} isPositive={true} />
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Önceki döneme göre
          </div>
        </div>
      </div>
    </div>
  );
}

// Rapor şablonları veri yapısı
const reportTemplates = [
  {
    id: 'overview',
    title: 'Sözleşmelere Genel Bakış',
    description: 'Sözleşme durumları ve aylık trend analizi',
    href: '/dashboard/reports/overview',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
      </svg>
    ),
    gradient: 'from-blue-500 to-indigo-600',
    stats: 'Durum dağılımı • Aylık trendler'
  },
  {
    id: 'performance',
    title: 'Performans Metrikleri',
    description: 'Süreç verimliliği ve tamamlanma analizi',
    href: '/dashboard/reports/performance',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    gradient: 'from-purple-500 to-violet-600',
    stats: 'Yanıt süreleri • KPI analizi'
  },
  {
    id: 'financials',
    title: 'Finansal Trendler',
    description: 'Gelir analizi ve mali performans',
    href: '/dashboard/reports/financials',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
      </svg>
    ),
    gradient: 'from-emerald-500 to-teal-600',
    stats: 'Gelir trendi • Mali analiz'
  },
  {
    id: 'activity',
    title: 'Kullanıcı Aktivitesi',
    description: 'Günlük işlem ve aktivite analizi',
    href: '/dashboard/reports/activity',
    icon: (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    gradient: 'from-amber-500 to-orange-600',
    stats: 'Günlük aktivite • Kullanıcı istatistikleri'
  }
];

export default function ReportsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Modern Header with Gradient */}
      <header className="relative">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Content */}
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-12">
              {/* Left side - Navigation & Title */}
              <div className="flex items-center space-x-6">
                <Link 
                  href="/dashboard"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Dashboard</span>
                </Link>
                
                <div className="w-px h-6 bg-white/30"></div>
                
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white">Rapor Merkezi</h1>
                    <p className="text-white/80 text-lg">Analitik raporları ve performans metrikleri</p>
                  </div>
                </div>
              </div>

              {/* Right side - Create Custom Report Button */}
              <div className="flex items-center space-x-4">
                <Link 
                  href="/dashboard/reports/new"
                  className="inline-flex items-center px-8 py-3 bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 text-lg font-medium rounded-xl text-white hover:text-white transition-all duration-200 group shadow-lg"
                >
                  <svg className="mr-3 h-6 w-6 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Özel Rapor Oluştur
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-12">
          
          {/* Kaydedilmiş Raporlarım Bölümü */}
          <section className="relative -mt-6 z-10">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Kaydedilmiş Raporlarım
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Daha önce oluşturduğunuz ve kaydettiğiniz raporlar
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
              </div>
              
              <Suspense fallback={<SavedReportsSkeleton />}>
                <SavedReportsSection />
              </Suspense>
            </div>
          </section>

          {/* Analiz Panelleri - Hazır Rapor Şablonları */}
          <section>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Analiz Panelleri
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Hazır analiz şablonları ile detaylı raporlara hızlıca erişin
              </p>
            </div>

            {/* Rapor Şablonları Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
              {reportTemplates.map((template) => (
                <Link
                  key={template.id}
                  href={template.href}
                  className="group block"
                >
                  <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1 h-full">
                    <div className="p-8">
                      {/* Icon */}
                      <div className={`w-16 h-16 bg-gradient-to-br ${template.gradient} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}>
                        {template.icon}
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                          {template.title}
                        </h3>
                        
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                          {template.description}
                        </p>

                        <div className="pt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                            {template.stats}
                          </span>
                        </div>
                      </div>

                      {/* Arrow Icon */}
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300">
                          Raporu Görüntüle
                        </span>
                        <svg 
                          className="w-5 h-5 text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform group-hover:translate-x-1 transition-all duration-200" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* İstatistikler Özeti */}
          <section>
            <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-2xl p-8 border border-slate-200/60 dark:border-gray-700/40">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    4
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Hazır Analiz Paneli
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                    24/7
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Gerçek Zamanlı Veri
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    ∞
                  </div>
                  <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Özel Rapor Oluşturma
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Son güncellenme: {new Date().toLocaleDateString('tr-TR', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Veriler güncel
              </span>
              <span>•</span>
              <span>Otomatik yenileme aktif</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Saved Reports Loading Skeleton
function SavedReportsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-shrink-0 w-80">
            <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
          </div>
        ))}
      </div>
    </div>
  );
} 