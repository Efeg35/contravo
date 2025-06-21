'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import ResponseTimeWidget from '../widgets/ResponseTimeWidget';
import PerformanceMetricsWidget from '../widgets/PerformanceMetricsWidget';

export default function PerformancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600"></div>
        <div className="absolute inset-0 bg-black/10"></div>
        
        <div className="relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Performans Metrikleri</h1>
                    <p className="text-white/70 text-sm">Süreç verimliliği ve tamamlanma analizi</p>
                  </div>
                </div>
              </div>

              {/* Right side - Export Actions */}
              <div className="flex items-center space-x-4">
                <button className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20 text-sm font-medium rounded-lg text-white transition-all duration-200">
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  PDF İndir
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0 space-y-12">
          
          {/* Hero Performans Kartları */}
          <section className="relative -mt-6 z-10">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Ana Performans KPI'ları
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Sistem genelindeki kritik performans göstergeleri
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              
              <Suspense fallback={<HeroCardsSkeleton />}>
                <PerformanceMetricsWidget />
              </Suspense>
            </div>
          </section>

          {/* Ana Widget'lar - İki Sütun Grid */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Yanıt Süresi Analizi */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Yanıt Süresi Analizi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Sözleşme tamamlanma süreleri ve dağılım
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <Suspense fallback={<WidgetSkeleton />}>
                    <ResponseTimeWidget />
                  </Suspense>
                </div>
              </div>

              {/* Verimlilik Analizi */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Verimlilik Analizi
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Süreç iyileştirme önerileri ve metrikler
                      </p>
                    </div>
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Verimlilik KPI'ları */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/30 rounded-xl">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">92%</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Otomatik Onay</div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/30 rounded-xl">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-1">7.2</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Ort. Gün</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Süreç Adımları</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Taslak → İnceleme</span>
                          <span className="text-gray-900 dark:text-white font-medium">1.2 gün</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">İnceleme → Onay</span>
                          <span className="text-gray-900 dark:text-white font-medium">3.1 gün</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Onay → İmza</span>
                          <span className="text-gray-900 dark:text-white font-medium">2.9 gün</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/30 rounded-xl border border-amber-200/50 dark:border-amber-700/30">
                      <div className="flex items-start">
                        <div className="w-6 h-6 bg-amber-500 rounded-lg flex items-center justify-center mr-3 mt-0.5">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Optimizasyon Önerisi</h5>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            İnceleme aşamasında otomatik ön onay sistemi ile %25 hızlanma sağlanabilir.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Öngörüler ve İyileştirme Önerileri */}
          <section>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      AI Destekli Öneriler
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Performans iyileştirme önerileri ve gelecek projeksiyonlar
                    </p>
                  </div>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* Footer */}
      <footer className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-t border-gray-200/50 dark:border-gray-700/50 mt-16">
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
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Hero Cards Loading Skeleton
function HeroCardsSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-600 dark:to-gray-700 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
}

// Widget Loading Skeleton
function WidgetSkeleton() {
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
