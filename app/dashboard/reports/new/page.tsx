'use client';

import { useState } from 'react';
import Link from 'next/link';

// Veri kaynağı seçenekleri
const DATA_SOURCES = [
  { value: 'contracts', label: 'Sözleşmeler', description: 'Sözleşme verileri ve analizleri' },
  { value: 'users', label: 'Kullanıcılar', description: 'Kullanıcı aktiviteleri ve istatistikleri' },
  { value: 'teams', label: 'Takımlar', description: 'Takım performansı ve işbirliği metrikleri' }
];

export default function NewReportPage() {
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between">
              {/* Left side - Navigation & Title */}
              <div className="flex items-center space-x-6">
                <Link
                  href="/dashboard/reports"
                  className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200 group"
                >
                  <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="font-medium">Raporlar</span>
                </Link>
                
                <div className="w-px h-6 bg-white/30"></div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Özel Rapor Oluşturucu</h1>
                    <p className="text-white/70 text-sm">Kişiselleştirilmiş analitik raporları oluşturun</p>
                  </div>
                </div>
              </div>

              {/* Right side - Actions */}
              <div className="flex items-center space-x-4">
                <button 
                  disabled
                  className="inline-flex items-center px-4 py-2 border border-white/20 backdrop-blur-sm text-sm font-medium rounded-lg text-white/50 bg-white/5 cursor-not-allowed transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Kaydet
                </button>
                
                <button 
                  disabled
                  className="inline-flex items-center px-6 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-sm font-medium rounded-lg text-white/50 cursor-not-allowed transition-all duration-200"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Raporu Oluştur
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Two Column Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
                      onChange={(e) => setSelectedDataSource(e.target.value)}
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

                  {/* Gelecek adımlar için placeholder */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                        <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                          <span className="text-xs font-medium">2</span>
                        </div>
                        Sütunları Seç
                      </div>
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
                  
                  {selectedDataSource && (
                    <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                        {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Önizleme İçeriği */}
                <div className="flex-1 flex items-center justify-center">
                  {selectedDataSource ? (
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
                          {DATA_SOURCES.find(s => s.value === selectedDataSource)?.description}
                        </p>
                      </div>
                      
                      {/* Gelecek adımlar için placeholder */}
                      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                        <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25"></circle>
                            <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm">Sütun seçimi bekleniyor...</span>
                        </div>
                      </div>
                    </div>
                  ) : (
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
      </main>
    </div>
  );
} 