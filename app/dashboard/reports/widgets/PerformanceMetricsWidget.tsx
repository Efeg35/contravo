'use client';

import { useEffect, useState } from 'react';

interface PerformanceData {
  averageCompletionDays: number;
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  signedContracts: number;
}

// Global state için stats verilerini expose ediyoruz
export interface StatsData {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  signedContracts: number;
}

// Global state
let globalStatsData: StatsData | null = null;
const subscribers: ((data: StatsData | null) => void)[] = [];

export function useGlobalStats() {
  const [data, setData] = useState<StatsData | null>(globalStatsData);

  useEffect(() => {
    const callback = (newData: StatsData | null) => setData(newData);
    subscribers.push(callback);
    
    return () => {
      const index = subscribers.indexOf(callback);
      if (index > -1) subscribers.splice(index, 1);
    };
  }, []);

  return data;
}

function updateGlobalStats(data: StatsData | null) {
  globalStatsData = data;
  subscribers.forEach(callback => callback(data));
}

export default function PerformanceMetricsWidget() {
  const [data, setData] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/performance-metrics');
        if (!response.ok) throw new Error('Veri alınamadı');
        
        const result = await response.json();
        const perfData = result.data;
        setData(perfData);
        
        // Global stats'ı güncelle
        updateGlobalStats({
          totalContracts: perfData.totalContracts,
          activeContracts: perfData.activeContracts,
          pendingContracts: perfData.pendingContracts,
          signedContracts: perfData.signedContracts
        });
      } catch (error) {
        console.error('Performans metrikleri alınamadı:', error);
        updateGlobalStats(null);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
          <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
          <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-40 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
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
    <div className="space-y-8">

      {/* Detaylı İstatistikler */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 rounded-2xl p-6 border border-gray-200/50 dark:border-gray-600/30">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Detaylı Analiz
        </h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.totalContracts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Toplam Sözleşme
            </div>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.activeContracts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Aktif Süreçte
            </div>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {data.pendingContracts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Bekleyen Onay
            </div>
          </div>
          
          <div className="text-center p-4 bg-white dark:bg-gray-700/50 rounded-xl border border-gray-200/50 dark:border-gray-600/30">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.signedContracts}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              İmzalanmış
            </div>
          </div>
        </div>
      </div>

      {/* Öngörüler ve Öneriler */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-indigo-200/50 dark:border-indigo-700/30">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Öngörüler ve Öneriler
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-white/50 dark:border-gray-600/30">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">Performans Güçlü</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {completionRate > 70 ? 'Tamamlanma oranınız sektör ortalamasının üzerinde' : 'Tamamlanma oranınızı iyileştirme fırsatı mevcut'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white/50 dark:bg-gray-700/30 rounded-xl p-4 border border-white/50 dark:border-gray-600/30">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h5 className="font-medium text-gray-900 dark:text-white text-sm">Süreç Optimizasyonu</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {data.averageCompletionDays > 30 ? 'Süreç sürelerini kısaltmak için workflow optimizasyonu öneriyoruz' : 'Mevcut süreç süreleri optimal seviyede'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Altbilgi */}
      <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Performans metrikleri gerçek zamanlı veriler kullanılarak hesaplanmıştır. 
          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
        </p>
      </div>
    </div>
  );
} 