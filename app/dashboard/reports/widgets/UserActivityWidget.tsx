'use client';

import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ActivityData {
  date: string;
  displayDate: string;
  contractsCreated: number;
  approvalsCompleted: number;
  signaturesCompleted: number;
  totalActivity: number;
}

export default function UserActivityWidget() {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchActivityData() {
      try {
        setLoading(true);
        const response = await fetch('/api/reports/user-activity');
        
        if (!response.ok) {
          throw new Error('Aktivite verileri alınamadı');
        }
        
        const result = await response.json();
        setData(result.data || []);
      } catch (err) {
        console.error('User activity fetch error:', err);
        setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
        
        // Mock data fallback
        const mockData: ActivityData[] = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          
          const contractsCreated = Math.floor(Math.random() * 8) + 1;
          const approvalsCompleted = Math.floor(Math.random() * 12) + 2;
          const signaturesCompleted = Math.floor(Math.random() * 6) + 1;
          
          mockData.push({
            date: date.toISOString().split('T')[0],
            displayDate: date.toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' }),
            contractsCreated,
            approvalsCompleted,
            signaturesCompleted,
            totalActivity: contractsCreated + approvalsCompleted + signaturesCompleted
          });
        }
        setData(mockData);
      } finally {
        setLoading(false);
      }
    }

    fetchActivityData();
  }, []);

  // İstatistikler hesaplama
  const totalDailyActivity = data.reduce((sum, item) => sum + item.totalActivity, 0);
  const avgDailyActivity = data.length > 0 ? Math.round(totalDailyActivity / data.length) : 0;
  const maxDailyActivity = Math.max(...data.map(item => item.totalActivity));
  
  // Bu hafta vs geçen hafta karşılaştırması
  const thisWeek = data.slice(-7);
  const lastWeek = data.slice(-14, -7);
  const thisWeekTotal = thisWeek.reduce((sum, item) => sum + item.totalActivity, 0);
  const lastWeekTotal = lastWeek.reduce((sum, item) => sum + item.totalActivity, 0);
  const weeklyChange = lastWeekTotal > 0 
    ? Math.round(((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100)
    : 0;

  // Tooltip formatter
  const formatTooltip = (value: number, name: string) => {
    const labels: Record<string, string> = {
      contractsCreated: 'Yeni Sözleşme',
      approvalsCompleted: 'Tamamlanan Onay',
      signaturesCompleted: 'Tamamlanan İmza',
      totalActivity: 'Toplam Aktivite'
    };
    return [value, labels[name] || name];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36 animate-pulse"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse"></div>
          </div>
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
        </div>
        
        {/* Chart Skeleton */}
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
        
        {/* Stats Skeleton */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-18 animate-pulse"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
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
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">Aktivite verileri yüklenemedi</p>
        <p className="text-gray-400 dark:text-gray-500 text-xs">Örnek veriler gösteriliyor</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Key Metrics */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Günlük Ortalama</h4>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {avgDailyActivity} işlem
          </p>
        </div>
        <div className="text-right">
          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            weeklyChange >= 0 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            <svg 
              className={`w-3 h-3 mr-1 ${weeklyChange >= 0 ? 'rotate-0' : 'rotate-180'}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {weeklyChange >= 0 ? '+' : ''}{weeklyChange}% haftalık
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="displayDate" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
              interval="preserveStartEnd"
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'currentColor' }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(8px)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={formatTooltip}
              labelStyle={{ color: '#374151', fontWeight: 600 }}
            />
            <Bar 
              dataKey="contractsCreated" 
              stackId="a" 
              fill="#3B82F6"
              className="opacity-90"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="approvalsCompleted" 
              stackId="a" 
              fill="#10B981"
              className="opacity-90"
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="signaturesCompleted" 
              stackId="a" 
              fill="#F59E0B"
              className="opacity-90"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend and Stats */}
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Yeni Sözleşme</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Onaylar</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">İmzalar</span>
          </div>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-3 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Toplam</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {totalDailyActivity}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">En Yüksek</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {maxDailyActivity}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bu Hafta</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-white">
              {thisWeekTotal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 