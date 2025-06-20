'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Ay isimlerini Türkçe'ye çevirmek için
const monthNames = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

interface MonthlyData {
  month: string;
  count: number;
  fullDate: string;
}

export default function MonthlyVolumeWidget() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/monthly-volume');
        if (!response.ok) throw new Error('Veri alınamadı');
        
        const result = await response.json();
        setData(result.data);
      } catch (error) {
        console.error('Aylık hacim verileri alınamadı:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Özel tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-medium text-gray-900 dark:text-white">{label}</p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {data.value} yeni sözleşme
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Son 6 ay
        </div>
      </div>

      <div className="h-80">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E5E7EB" 
                className="dark:stroke-gray-600"
                horizontal={true}
                vertical={true}
              />
              <XAxis 
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="text-gray-500 dark:text-gray-400"
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: '#6B7280' }}
                className="text-gray-500 dark:text-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="count"
                stroke="#3B82F6"
                strokeWidth={3}
                fill="url(#colorGradient)"
                dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: '#3B82F6', strokeWidth: 3, fill: '#FFFFFF' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            Gösterilecek veri bulunamadı
          </div>
        )}
      </div>
    </>
  );
} 