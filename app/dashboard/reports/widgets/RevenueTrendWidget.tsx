'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueData {
  month: string;
  revenue: number;
  contracts: number;
}

export default function RevenueTrendWidget() {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRevenueData() {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/revenue-trend');
        
        if (!response.ok) {
          throw new Error('Gelir verileri alınamadı');
        }
        
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('Revenue trend fetch error:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        
        // Mock data fallback
        setData([
          { month: 'Ağu 2024', revenue: 125000, contracts: 8 },
          { month: 'Eyl 2024', revenue: 145000, contracts: 12 },
          { month: 'Eki 2024', revenue: 162000, contracts: 15 },
          { month: 'Kas 2024', revenue: 198000, contracts: 18 },
          { month: 'Ara 2024', revenue: 175000, contracts: 14 },
          { month: 'Oca 2025', revenue: 220000, contracts: 22 }
        ]);
      } finally {
        setLoading(false);
      }
    }

    fetchRevenueData();
  }, []);

  // Toplam gelir hesaplama
  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const avgMonthlyRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
  
  // Önceki aya göre değişim hesaplama
  const currentMonth = data[data.length - 1];
  const previousMonth = data[data.length - 2];
  const monthlyChange = previousMonth && currentMonth 
    ? Math.round(((currentMonth.revenue - previousMonth.revenue) / previousMonth.revenue) * 100)
    : 0;

  // Formatları
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipCurrency = (value: number, name: string) => {
    if (name === 'revenue') {
      return [formatCurrency(value), 'Gelir'];
    }
    return [value, 'Sözleşme Sayısı'];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
        </div>
        
        {/* Chart Skeleton */}
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-80 text-center">
        <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Gelir verileri yüklenemedi</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Örnek veriler gösteriliyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Toplam Gelir</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            monthlyChange >= 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <svg 
              className={`w-3 h-3 mr-1 ${monthlyChange >= 0 ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {monthlyChange >= 0 ? '+' : ''}{monthlyChange}%
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => `₺${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={formatTooltipCurrency}
              labelStyle={{ color: '#374151', fontWeight: 600 }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 2, fill: '#FFFFFF' }}
              className="drop-shadow-sm"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Stats */}
      <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Ortalama Aylık</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(avgMonthlyRevenue)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bu Ay</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {currentMonth ? formatCurrency(currentMonth.revenue) : '-'}
          </p>
        </div>
      </div>
    </div>
  );
} 