'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Durum çevirileri için mapping
const statusTranslations: { [key: string]: string } = {
  'DRAFT': 'Taslak',
  'REVIEW': 'İncelemede',
  'APPROVED': 'Onaylandı',
  'SIGNED': 'İmzalandı',
  'ACTIVE': 'Aktif',
  'EXPIRED': 'Süresi Dolmuş',
  'CANCELLED': 'İptal Edildi',
  'TERMINATED': 'Feshedildi'
};

// Her durum için renk paleti
const statusColors: { [key: string]: string } = {
  'DRAFT': '#94A3B8',      // Gri - Taslak
  'REVIEW': '#F59E0B',     // Turuncu - İncelemede
  'APPROVED': '#10B981',   // Yeşil - Onaylandı
  'SIGNED': '#3B82F6',     // Mavi - İmzalandı
  'ACTIVE': '#059669',     // Koyu yeşil - Aktif
  'EXPIRED': '#EF4444',    // Kırmızı - Süresi Dolmuş
  'CANCELLED': '#6B7280',  // Koyu gri - İptal Edildi
  'TERMINATED': '#DC2626'  // Koyu kırmızı - Feshedildi
};

interface StatusData {
  status: string;
  count: number;
  name: string;
}

// Premium özel tooltip component
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percentage = ((data.count / data.total) * 100);
    const totalContracts = data.total;
    
    return (
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm p-5 rounded-2xl shadow-2xl border border-gray-200/60 dark:border-gray-600/40 transform transition-all duration-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full shadow-sm border-2 border-white dark:border-gray-700" 
              style={{ backgroundColor: payload[0].color }}
            ></div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-base">
              {data.name}
            </h3>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
            #{data.status}
          </div>
        </div>
        
        {/* Ana Metrikler */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Sözleşme Sayısı</span>
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              {data.count.toLocaleString('tr-TR')}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Yüzde Oranı</span>
            <span className="text-lg font-bold" style={{ color: payload[0].color }}>
              {percentage.toFixed(1)}%
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-500 shadow-sm"
                style={{ 
                  width: `${percentage}%`, 
                  backgroundColor: payload[0].color,
                  boxShadow: `0 0 8px ${payload[0].color}40`
                }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0</span>
              <span>{totalContracts}</span>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-gray-200/50 dark:border-gray-600/30">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Toplam içindeki oran</span>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-green-600 dark:text-green-400 font-medium">Canlı Veri</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

// Özel legend component
function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-col space-y-2 mt-6">
      {payload.map((entry: any, index: number) => (
        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center space-x-3">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {entry.value}
            </span>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {entry.payload.count}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {((entry.payload.count / entry.payload.total) * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Merkez etiketi component
function CenterLabel({ data }: { data: StatusData[] }) {
  const totalContracts = data.reduce((sum, item) => sum + item.count, 0);
  const position = { x: '50%', y: '50%' };
  
  return (
    <g>
      <text 
        x={position.x} 
        y={position.y} 
        textAnchor="middle" 
        dominantBaseline="central"
        className="fill-gray-900 dark:fill-white font-bold text-2xl"
      >
        {totalContracts}
      </text>
      <text 
        x={position.x} 
        y={`calc(${position.y} + 20px)`} 
        textAnchor="middle" 
        dominantBaseline="central"
        className="fill-gray-500 dark:fill-gray-400 text-sm"
      >
        Toplam
      </text>
    </g>
  );
}

export default function StatusDistributionWidget() {
  const [data, setData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/status-distribution');
        if (!response.ok) throw new Error('Veri alınamadı');
        
        const result = await response.json();
        const processedData = result.data.map((item: any) => ({
          ...item,
          name: statusTranslations[item.status] || item.status,
          total: result.data.reduce((sum: number, d: any) => sum + d.count, 0)
        }));
        
        setData(processedData);
      } catch (error) {
        console.error('Durum dağılımı alınamadı:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-64 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>Durum dağılımı verisi bulunamadı</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ana Grafik */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={110}
              paddingAngle={2}
              dataKey="count"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={statusColors[entry.status] || '#94A3B8'}
                  stroke="rgba(255,255,255,0.8)"
                  strokeWidth={2}
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              ))}
            </Pie>
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ outline: 'none' }}
              cursor={{ fill: 'transparent' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Merkez Etiketi */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Toplam Sözleşme
            </div>
          </div>
        </div>
      </div>

      {/* Özel Legend */}
      <CustomLegend payload={data.map((item, index) => ({
        value: item.name,
        type: 'circle',
        color: statusColors[item.status] || '#94A3B8',
        payload: item
      }))} />

      {/* Özet İstatistikler */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-700/30 rounded-xl p-4 border border-gray-200/50 dark:border-gray-600/30">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Durum Özeti
        </h4>
        
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">En yaygın durum:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.sort((a, b) => b.count - a.count)[0]?.name || '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Farklı durum sayısı:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Dağılım çeşitliliği:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {data.length > 3 ? 'Yüksek' : data.length > 1 ? 'Orta' : 'Düşük'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Güncelleme:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                Canlı
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 