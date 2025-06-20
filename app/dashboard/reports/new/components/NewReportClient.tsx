'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// Veri kaynağı seçenekleri
const DATA_SOURCES = [
  { value: 'contracts', label: 'Sözleşmeler', description: 'Sözleşme verileri ve analizleri' },
  { value: 'users', label: 'Kullanıcılar', description: 'Kullanıcı aktiviteleri ve istatistikleri' },
  { value: 'teams', label: 'Takımlar', description: 'Takım performansı ve işbirliği metrikleri' }
];

// Props interface
interface NewReportClientProps {
  initialDataSource: string;
  initialFields: string[];
  reportData: any[];
  availableFields: any;
}

// Field Selector Component
function FieldSelector({ 
  dataSource, 
  selectedFields, 
  onFieldsChange,
  availableFields
}: { 
  dataSource: string;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  availableFields: any;
}) {
  const fieldOptions = availableFields[dataSource] || [];

  const handleFieldToggle = (fieldKey: string) => {
    const updatedFields = selectedFields.includes(fieldKey)
      ? selectedFields.filter(f => f !== fieldKey)
      : [...selectedFields, fieldKey];
    
    onFieldsChange(updatedFields);
  };

  if (!dataSource) return null;

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-4">
        2. Rapor Sütunlarını Seçin
      </label>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {fieldOptions.map((field: any) => (
          <div 
            key={field.key}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
          >
            <div className="flex items-center h-5">
              <input
                id={`field-${field.key}`}
                type="checkbox"
                checked={selectedFields.includes(field.key)}
                onChange={() => handleFieldToggle(field.key)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label 
                htmlFor={`field-${field.key}`}
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                {field.label}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedFields.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            <span className="font-medium">{selectedFields.length}</span> sütun seçildi
          </p>
        </div>
      )}
    </div>
  );
}

// Veri tablosunu format et
function formatCellData(data: any, fieldKey: string): string {
  if (!data) return '-';
  
  // Nested object handling (author, company, etc.)
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
}

export default function NewReportClient({ 
  initialDataSource, 
  initialFields, 
  reportData, 
  availableFields 
}: NewReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedDataSource, setSelectedDataSource] = useState<string>(initialDataSource);
  const [selectedFields, setSelectedFields] = useState<string[]>(initialFields);

  // Veri kaynağı değiştiğinde URL'yi güncelle ve alanları temizle
  const handleDataSourceChange = (dataSource: string) => {
    setSelectedDataSource(dataSource);
    setSelectedFields([]);
    
    const params = new URLSearchParams(searchParams.toString());
    if (dataSource) {
      params.set('dataSource', dataSource);
      params.delete('fields'); // Yeni veri kaynağı seçildiğinde alanları temizle
    } else {
      params.delete('dataSource');
      params.delete('fields');
    }
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  // Seçili alanlar değiştiğinde URL'yi güncelle
  const handleFieldsChange = (fields: string[]) => {
    setSelectedFields(fields);
    
    const params = new URLSearchParams(searchParams.toString());
    if (fields.length > 0) {
      params.set('fields', fields.join(','));
    } else {
      params.delete('fields');
    }
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-240px)]">
      
      {/* Sol Sütun - Kontrol Paneli (Dar) */}
      <div className="lg:col-span-1">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg sticky top-8">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kontrol Paneli</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rapor ayarları</p>
              </div>
            </div>

            {/* Veri Kaynağı Seçimi */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  1. Rapor Verisini Seçin
                </label>
                <select
                  value={selectedDataSource}
                  onChange={(e) => handleDataSourceChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Veri kaynağı seçin...</option>
                  {DATA_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
                
                {/* Seçilen veri kaynağının açıklaması */}
                {selectedDataSource && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {DATA_SOURCES.find(s => s.value === selectedDataSource)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Field Selector */}
              <FieldSelector 
                dataSource={selectedDataSource}
                selectedFields={selectedFields}
                onFieldsChange={handleFieldsChange}
                availableFields={availableFields}
              />

              {/* Gelecek adımlar için placeholder */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium">3</span>
                    </div>
                    Filtrele
                  </div>
                  <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                      <span className="text-xs font-medium">4</span>
                    </div>
                    Sırala
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Sütun - Önizleme Alanı (Geniş) */}
      <div className="lg:col-span-3">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg h-full min-h-[600px]">
          <div className="p-8 h-full flex flex-col">
            
            {/* Önizleme Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canlı Önizleme</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Raporunuzun gerçek zamanlı görünümü</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {selectedDataSource && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label}
                    </span>
                  </div>
                )}
                
                {/* Ana Rapor Oluştur Butonu */}
                {selectedDataSource && selectedFields.length > 0 && reportData.length > 0 && (
                  <div className="flex items-center space-x-3">
                    {/* Ana Rapor Oluştur Butonu */}
                    <a
                      href={`/api/reports/export/csv?dataSource=${selectedDataSource}&fields=${selectedFields.join(',')}`}
                      download
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Raporu Oluştur (CSV)
                    </a>
                    
                    {/* Ek Export Seçenekleri */}
                    <div className="flex items-center space-x-2">
                      <a
                        href={`/api/reports/export/pdf?dataSource=${selectedDataSource}&fields=${selectedFields.join(',')}`}
                        download
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                        title="PDF olarak indir"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Önizleme İçeriği */}
            <div className="flex-1 flex items-center justify-center">
              {selectedDataSource ? (
                selectedFields.length > 0 ? (
                  // Gerçek verilerle tablo göster
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
                      
                      {/* Gerçek Tablo */}
                      <div className="overflow-x-auto max-h-96 overflow-y-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                            <tr>
                              {selectedFields.map((fieldKey) => {
                                const field = availableFields[selectedDataSource]?.find((f: any) => f.key === fieldKey);
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
                            {reportData.length > 0 ? (
                              reportData.map((row, index) => (
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
                              ))
                            ) : (
                              <tr>
                                <td colSpan={selectedFields.length} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                  <div className="flex flex-col items-center space-y-3">
                                    <svg className="w-16 h-16 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 009.586 13H7" />
                                    </svg>
                                    <div className="text-center">
                                      <div className="font-medium text-gray-700 dark:text-gray-300 mb-1">Veri bulunamadı</div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                        Seçilen kriterlere uygun kayıt bulunmuyor
                                      </div>
                                      <div className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3 max-w-sm">
                                        <strong>Olası nedenler:</strong><br/>
                                        • Veritabanında henüz {selectedDataSource === 'contracts' ? 'sözleşme' : selectedDataSource === 'users' ? 'kullanıcı' : 'takım'} verisi yok<br/>
                                        • Seçilen alanlar için uygun veri mevcut değil<br/>
                                        • Veritabanı bağlantı sorunu olabilir
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <span>
                          <span className="font-medium">{selectedFields.length}</span> sütun • 
                          <span className="font-medium text-green-600 dark:text-green-400"> {reportData.length}</span> kayıt gösteriliyor
                        </span>
                        <span className="text-xs">
                          Son güncelleme: {new Date().toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Veri kaynağı seçildi ama sütunlar seçilmedi
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label} Raporu
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Lütfen raporda görmek istediğiniz sütunları soldaki menüden seçin
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                      <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm">Sütun seçimi bekleniyor...</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // Hiç veri kaynağı seçilmedi
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Rapor Önizlemesi
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                      Lütfen rapor oluşturmak için sol panelden bir veri kaynağı seçin
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center space-x-2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Başlamak için veri kaynağı seçin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 