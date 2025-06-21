'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import UserActivityWidget from '../widgets/UserActivityWidget';

export default function ActivityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/40 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600"></div>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-white">Kullanıcı Aktivitesi</h1>
                    <p className="text-white/70 text-sm">Günlük işlem ve aktivite analizi</p>
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
          
          {/* Ana Kullanıcı Aktivitesi Widget */}
          <section className="relative -mt-6 z-10">
            <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-3xl border border-white/20 dark:border-gray-700/50 shadow-2xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Kullanıcı Aktivite Analizi
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    Son 30 günlük kullanıcı işlem aktivitesi
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              
              <Suspense fallback={<WidgetSkeleton />}>
                <UserActivityWidget />
              </Suspense>
            </div>
          </section>

          {/* Aktivite Detay Metrikleri */}
          <section>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Aktif Kullanıcılar */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      847
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Aktif Kullanıcı
                    </div>
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      +12.3%
                    </div>
                  </div>
                </div>
              </div>

              {/* Günlük Işlemler */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      2,341
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Günlük İşlem
                    </div>
                    <div className="flex items-center text-xs text-green-600 dark:text-green-400">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      +8.7%
                    </div>
                  </div>
                </div>
              </div>

              {/* Ortalama Oturum */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                      24m
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Ortalama Oturum
                    </div>
                    <div className="flex items-center text-xs text-red-600 dark:text-red-400">
                      <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                      -2.1%
                    </div>
                  </div>
                </div>
              </div>

              {/* En Çok Kullanılan */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      Sözleşmeler
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      En Çok Kullanılan
                    </div>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                      %68 kullanım
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Aktivite Kategorileri */}
          <section>
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Aktivite Kategorileri
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Kullanıcıların en çok tercih ettiği işlem türleri
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">En Popüler İşlemler</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Sözleşme Görüntüleme</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">68%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Onay İşlemleri</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">İmza İşlemleri</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">32%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Zaman Dağılımı</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">09:00 - 12:00</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">%35</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">13:00 - 17:00</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">%42</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">17:00 - 19:00</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">%23</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Cihaz Kullanımı</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Masaüstü</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">72%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Mobil</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">28%</span>
                      </div>
                    </div>
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
