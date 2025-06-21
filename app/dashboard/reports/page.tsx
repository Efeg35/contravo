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
            <div className="flex justify-between items-center py-8">
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
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Analitik Raporları</h1>
                    <p className="text-white/70 text-sm">Sözleşme performansı ve istatistikleri</p>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-4">
                {/* Filter Button - Future feature */}
                <button 
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-white/20 backdrop-blur-sm text-sm font-medium rounded-lg text-white/50 bg-white/5 cursor-not-allowed transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
                  </svg>
                  Filtrele
                </button>
                
                {/* Export Button - Future feature */}
                <button 
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-white/20 backdrop-blur-sm text-sm font-medium rounded-lg text-white/50 bg-white/5 cursor-not-allowed transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Dışa Aktar
                </button>
                
                {/* Create Report Button */}
                <Link 
                  href="/dashboard/reports/new"
                  className="inline-flex items-center px-6 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-sm font-medium rounded-lg text-white hover:text-white transition-all duration-200 group"
                >
                  <svg className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Özel Rapor Oluştur
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Metrics Cards - Yeni Ana KPI Bölümü */}
      <div className="relative -mt-4 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
            <HeroMetricsCards />
          </div>
        </div>
      </div>

      {/* Main Content - Modern Grid Layout */}
      <main className="max-w-7xl mx-auto py-16 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-16">
          
          {/* Kaydedilmiş Raporlar Bölümü */}
          <section>
            <SavedReportsSection />
          </section>
          
          {/* Ana Analitik Widget'lar - Üç Sütun Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Sözleşme Durum Dağılımı */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Durum Dağılımı
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sözleşme durumlarının analizi
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<ModernWidgetSkeleton />}>
                    <StatusDistributionWidget />
                  </Suspense>
                </div>
              </div>

              {/* Aylık Sözleşme Hacmi */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Aylık Trend Analizi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Son 6 aydaki sözleşme hacmi
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<ModernWidgetSkeleton />}>
                    <MonthlyVolumeWidget />
                  </Suspense>
                </div>
              </div>

              {/* Sistem Yanıt Süresi - KPI Widget */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Yanıt Performansı
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Ortalama tamamlanma süreleri
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<ModernWidgetSkeleton />}>
                    <ResponseTimeWidget />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>

          {/* Gelişmiş Analitik Widget'lar - İki Sütun */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Gelir Trendi */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Gelir Trendi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Son 6 aydaki gelir analizi
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<ModernWidgetSkeleton />}>
                    <RevenueTrendWidget />
                  </Suspense>
                </div>
              </div>

              {/* Günlük Kullanıcı Aktivitesi */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Kullanıcı Aktivitesi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Son 30 günlük işlem analizi
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<ModernWidgetSkeleton />}>
                    <UserActivityWidget />
                  </Suspense>
                </div>
              </div>
            </div>
          </section>

          {/* Detaylı Analiz Bölümü */}
          <section>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Detaylı Analiz
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Süreç verimliliği ve tamamlanma metrikleri
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <Suspense fallback={<ModernWidgetSkeleton />}>
                  <PerformanceMetricsWidget />
                </Suspense>
              </div>
            </div>
          </section>

          {/* Öngörüler ve Öneriler Bölümü */}
          <section>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Öngörüler ve Öneriler
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      AI destekli analiz ve öneriler
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                
                {/* Placeholder İçerik */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl p-6 border border-blue-200/50 dark:border-blue-700/30">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Trend Analizi</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Son 3 ayda sözleşme onay süreleri %15 iyileşme gösteriyor.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 rounded-xl p-6 border border-green-200/50 dark:border-green-700/30">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Optimizasyon</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Süreç otomasyonu ile %25 daha hızlı onay süreci mümkün.
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 rounded-xl p-6 border border-amber-200/50 dark:border-amber-700/30">
                    <div className="flex items-center mb-4">
                      <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">Uyarı</h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      3 sözleşme için son onay tarihleri yaklaşıyor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Footer with additional info */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-24">
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

// Modern Widget Loading Skeleton
function ModernWidgetSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg w-3/4"></div>
      <div className="h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded"></div>
      </div>
    </div>
  );
} 