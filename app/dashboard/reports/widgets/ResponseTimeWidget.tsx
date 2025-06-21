'use client';

import { useState, useEffect } from 'react';

interface ResponseTimeData {
  averageResponseTime: number;
  medianResponseTime: number;
  fastestCompletion: number;
  slowestCompletion: number;
  totalCompletedContracts: number;
  improvementFromLastMonth: number;
  responseTimeDistribution: {
    fast: number; // 0-7 gün
    medium: number; // 8-30 gün  
    slow: number; // 31+ gün
  };
}

export default function ResponseTimeWidget() {
  const [data, setData] = useState<ResponseTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResponseTimeData() {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/response-time');
        
        if (!response.ok) {
          throw new Error('Yanıt süresi verileri alınamadı');
        }
        
        const result = await response.json();
        setData(result.data);
      } catch (err) {
        console.error('Response time fetch error:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        
        // Mock data fallback
        setData({
          averageResponseTime: 12.5,
          medianResponseTime: 8.5,
          fastestCompletion: 2.5,
          slowestCompletion: 45.5,
          totalCompletedContracts: 248,
          improvementFromLastMonth: -8.2,
          responseTimeDistribution: {
            fast: 156,
            medium: 72,
            slow: 20
          }
        });
      } finally {
        setLoading(false);
      }
    }

    fetchResponseTimeData();
  }, []);

  // Performance kategorisi belirle
  const getPerformanceCategory = (avgTime: number) => {
    if (avgTime <= 7) return { label: 'Mükemmel', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-100 dark:bg-green-900/30' };
    if (avgTime <= 15) return { label: 'İyi', color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    if (avgTime <= 30) return { label: 'Orta', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-100 dark:bg-amber-900/30' };
    return { label: 'Yavaş', color: 'text-red-600 dark:text-red-400', bgColor: 'bg-red-100 dark:bg-red-900/30' };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Main KPI Skeleton */}
        <div className="text-center space-y-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40 mx-auto animate-pulse"></div>
        </div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
        </div>
        
        {/* Distribution Skeleton */}
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Yanıt süresi verileri yüklenemedi</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Örnek veriler gösteriliyor</p>
      </div>
    );
  }

  const performance = getPerformanceCategory(data.averageResponseTime);
  const totalContracts = data.responseTimeDistribution.fast + data.responseTimeDistribution.medium + data.responseTimeDistribution.slow;

  return (
    <div className="space-y-8">
      {/* Main KPI Display */}
      <div className="text-center space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Ortalama Yanıt Süresi
          </h4>
          <div className="relative">
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              {data.averageResponseTime.toFixed(1)}
              <span className="text-xl font-normal text-gray-500 dark:text-gray-400 ml-2">gün</span>
            </p>
          </div>
        </div>
        
        {/* Performance Badge and Change */}
        <div className="flex items-center justify-center space-x-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${performance.bgColor} ${performance.color}`}>
            {performance.label} Performans
          </span>
          
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            data.improvementFromLastMonth <= 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <svg 
              className={`w-3 h-3 mr-1 ${data.improvementFromLastMonth <= 0 ? 'rotate-180' : 'rotate-0'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {Math.abs(data.improvementFromLastMonth).toFixed(1)}% geçen aydan
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 gap-6">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Medyan Süre</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.medianResponseTime.toFixed(1)} gün
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Tamamlanan</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {data.totalCompletedContracts}
          </p>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Süre Dağılımı
        </h5>
        
        <div className="space-y-3">
          {/* Fast (0-7 days) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Hızlı (0-7 gün)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${(data.responseTimeDistribution.fast / totalContracts) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                {data.responseTimeDistribution.fast}
              </span>
            </div>
          </div>

          {/* Medium (8-30 days) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-amber-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Orta (8-30 gün)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-amber-500 rounded-full" 
                  style={{ width: `${(data.responseTimeDistribution.medium / totalContracts) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                {data.responseTimeDistribution.medium}
              </span>
            </div>
          </div>

          {/* Slow (31+ days) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Yavaş (31+ gün)</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 bg-red-500 rounded-full" 
                  style={{ width: `${(data.responseTimeDistribution.slow / totalContracts) * 100}%` }}
                ></div>
              </div>
              <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
                {data.responseTimeDistribution.slow}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">En Hızlı</p>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {data.fastestCompletion.toFixed(1)} gün
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">En Yavaş</p>
            <p className="text-sm font-medium text-red-600 dark:text-red-400">
              {data.slowestCompletion.toFixed(1)} gün
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 