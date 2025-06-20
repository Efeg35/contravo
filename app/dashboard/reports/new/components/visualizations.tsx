'use client';

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line,
  ResponsiveContainer,
  Cell
} from 'recharts';

// Kurumsal renk paleti
const COLORS = [
  '#6366f1', // Indigo-500
  '#8b5cf6', // Violet-500  
  '#06b6d4', // Cyan-500
  '#10b981', // Emerald-500
  '#f59e0b', // Amber-500
  '#ef4444', // Red-500
  '#84cc16', // Lime-500
  '#ec4899', // Pink-500
];

// Empty State Component
function EmptyState({ message }: { message: string }) {
  return (
    <div className="w-full h-96 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            Grafik Oluşturulamıyor
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Custom Tooltip Component
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.dataKey}: <span className="font-medium text-gray-900 dark:text-white">{entry.value}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

// Table Report Component
export function TableReport({ data, selectedFields, availableFields, dataSource }: {
  data: any[];
  selectedFields: string[];
  availableFields: any;
  dataSource: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyState message="Bu görselleştirme için yeterli veri bulunmuyor." />;
  }

  const formatCellData = (data: any, fieldKey: string): string => {
    if (!data) return '-';
    
    // Nested object handling
    if (typeof data === 'object' && data !== null) {
      if (data.name) return data.name;
      if (data.email) return data.email;
      return JSON.stringify(data);
    }
    
    // Date formatting
    if (fieldKey.includes('Date') || fieldKey.includes('At')) {
      try {
        return new Date(data).toLocaleDateString('tr-TR');
      } catch {
        return String(data);
      }
    }
    
    // Boolean values
    if (typeof data === 'boolean') {
      return data ? 'Evet' : 'Hayır';
    }
    
    return String(data);
  };

  return (
    <div className="w-full">
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Canlı Veri Tablosu
          </h3>
          <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Güncel Veriler</span>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                {selectedFields.map((fieldKey) => {
                  const field = availableFields[dataSource]?.find((f: any) => f.key === fieldKey);
                  return (
                    <th
                      key={fieldKey}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {field?.label || fieldKey}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.map((row, index) => (
                <tr key={row.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  {selectedFields.map((fieldKey) => (
                    <td
                      key={fieldKey}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                    >
                      {formatCellData(row[fieldKey], fieldKey)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-medium">{selectedFields.length}</span> sütun • 
            <span className="font-medium text-green-600 dark:text-green-400"> {data.length}</span> kayıt gösteriliyor
          </span>
          <span className="text-xs">
            Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
          </span>
        </div>
      </div>
    </div>
  );
}

// Bar Chart Report Component  
export function BarChartReport({ data, selectedFields, availableFields, dataSource }: {
  data: any[];
  selectedFields: string[];
  availableFields: any;
  dataSource: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyState message="Bu grafik için yeterli veri bulunmuyor." />;
  }

  // Sayısal alanları bul
  const numericFields = selectedFields.filter(field => {
    const fieldMeta = availableFields[dataSource]?.find((f: any) => f.key === field);
    return fieldMeta && (field === 'value' || field === 'memberCount' || field.includes('count') || field.includes('Count'));
  });

  if (numericFields.length === 0) {
    return <EmptyState message="Bar grafik oluşturmak için en az bir sayısal alan seçmelisiniz." />;
  }

  // Kategorik alan bul (label için)
  const categoricalFields = selectedFields.filter(field => 
    !numericFields.includes(field) && field !== 'id'
  );
  
  const labelField = categoricalFields[0] || 'id';

  // Verileri grafik formatına dönüştür
  const chartData = data.slice(0, 10).map((item, index) => {
    const chartItem: any = {};
    
    // Label alanını ayarla
    if (item[labelField]) {
      if (typeof item[labelField] === 'object' && item[labelField].name) {
        chartItem.name = item[labelField].name;
      } else {
        chartItem.name = String(item[labelField]).slice(0, 20);
      }
    } else {
      chartItem.name = `Kayıt ${index + 1}`;
    }
    
    // Sayısal alanları ekle
    numericFields.forEach(field => {
      chartItem[field] = Number(item[field]) || 0;
    });
    
    return chartItem;
  });

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Bar Grafik Analizi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {data.length} kayıttan ilk 10 tanesi gösteriliyor
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>İnteraktif Grafik</span>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {numericFields.map((field, index) => {
                const fieldLabel = availableFields[dataSource]?.find((f: any) => f.key === field)?.label || field;
                return (
                  <Bar 
                    key={field}
                    dataKey={field} 
                    name={fieldLabel}
                    fill={COLORS[index % COLORS.length]}
                    radius={[4, 4, 0, 0]}
                  />
                );
              })}
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-medium">{numericFields.length}</span> metrik • 
            <span className="font-medium text-blue-600 dark:text-blue-400">{chartData.length}</span> kategori
          </span>
          <span className="text-xs">
            Grafik: {new Date().toLocaleTimeString('tr-TR')}
          </span>
        </div>
      </div>
    </div>
  );
}

// Line Chart Report Component
export function LineChartReport({ data, selectedFields, availableFields, dataSource }: {
  data: any[];
  selectedFields: string[];
  availableFields: any;
  dataSource: string;
}) {
  if (!data || data.length === 0) {
    return <EmptyState message="Bu grafik için yeterli veri bulunmuyor." />;
  }

  // Tarih alanlarını bul
  const dateFields = selectedFields.filter(field => 
    field.includes('Date') || field.includes('At') || field === 'createdAt' || field === 'updatedAt'
  );

  // Sayısal alanları bul
  const numericFields = selectedFields.filter(field => {
    const fieldMeta = availableFields[dataSource]?.find((f: any) => f.key === field);
    return fieldMeta && (field === 'value' || field === 'memberCount' || field.includes('count') || field.includes('Count'));
  });

  if (dateFields.length === 0 && numericFields.length === 0) {
    return <EmptyState message="Çizgi grafik oluşturmak için en az bir tarih veya sayısal alan seçmelisiniz." />;
  }

  // Varsayılan olarak tarih alanı kullan, yoksa indeks
  const xAxisField = dateFields[0] || 'index';
  const yAxisField = numericFields[0] || selectedFields.find(f => f !== xAxisField) || selectedFields[0];

  // Verileri grafik formatına dönüştür
  const chartData = data.slice(0, 20).map((item, index) => {
    const chartItem: any = {};
    
    if (xAxisField === 'index') {
      chartItem.name = `${index + 1}`;
    } else if (dateFields.includes(xAxisField)) {
      chartItem.name = new Date(item[xAxisField]).toLocaleDateString('tr-TR');
    } else {
      chartItem.name = String(item[xAxisField] || `Kayıt ${index + 1}`).slice(0, 15);
    }
    
    // Sayısal değerleri ekle
    if (numericFields.length > 0) {
      numericFields.forEach(field => {
        chartItem[field] = Number(item[field]) || 0;
      });
    } else {
      // Sayısal alan yoksa, boolean/enum alanları sayısal değere çevir
      selectedFields.forEach(field => {
                 if (field !== xAxisField) {
           const value = item[field];
           if (typeof value === 'boolean') {
            chartItem[field] = value ? 1 : 0;
          } else if (typeof value === 'string') {
            chartItem[field] = value.length; // String uzunluğu
          } else {
            chartItem[field] = Number(value) || 0;
          }
        }
      });
    }
    
    return chartItem;
  }).sort((a, b) => {
    // Tarih alanı varsa tarihe göre sırala
    if (dateFields.includes(xAxisField)) {
      return a.name.localeCompare(b.name);
    }
    return 0;
  });

  const metricsToShow = numericFields.length > 0 ? numericFields : selectedFields.filter(f => f !== xAxisField);

  return (
    <div className="w-full">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Çizgi Grafik Analizi
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {data.length} kayıttan ilk 20 tanesi gösteriliyor
            </p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
            <span>Trend Analizi</span>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {metricsToShow.slice(0, 3).map((field, index) => {
                const fieldLabel = availableFields[dataSource]?.find((f: any) => f.key === field)?.label || field;
                return (
                  <Line 
                    key={field}
                    type="monotone" 
                    dataKey={field} 
                    name={fieldLabel}
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS[index % COLORS.length] }}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>
            <span className="font-medium">{metricsToShow.length}</span> metrik • 
            <span className="font-medium text-purple-600 dark:text-purple-400">{chartData.length}</span> veri noktası
          </span>
          <span className="text-xs">
            Trend: {new Date().toLocaleTimeString('tr-TR')}
          </span>
        </div>
      </div>
    </div>
  );
}
