'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Import all components (keeping original imports)
import { AccessibilityProvider, SkipNavigation, LiveRegion, AccessibilitySettings } from '../../components/ui/accessibility';
import DashboardWidgets, { CustomizationToggle } from '../../components/ui/dashboard-widgets';
import RealtimeNotifications, { NotificationBell } from '../../components/ui/realtime-notifications';
import MobileNavigation, { MobileHeader, TouchButton } from '../../components/ui/mobile-navigation';
import AnalyticsCharts from '../../components/ui/analytics-charts';

interface Contract {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  otherPartyName?: string;
}

interface DashboardStats {
  totalContracts: number;
  draftContracts: number;
  reviewContracts: number;
  signedContracts: number;
  monthlyContracts: number;
  recentContracts: Contract[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications] = useState(3);
  const [currentView, setCurrentView] = useState<'overview' | 'analytics' | 'widgets'>('overview');
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          setLiveMessage(`Dashboard yüklendi. ${data.totalContracts} sözleşme bulunuyor.`);
        } else {
          console.error('Failed to fetch dashboard stats');
          setLiveMessage('Dashboard yüklenirken hata oluştu.');
        }
      } catch (_error) {
        console.error('Error fetching dashboard stats:');
        setLiveMessage('Dashboard yüklenirken hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchStats();
    }
  }, [session]);

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
  };

  const handleCustomizationToggle = () => {
    setIsCustomizing(!isCustomizing);
    setLiveMessage(isCustomizing ? 'Dashboard özelleştirme kapatıldı' : 'Dashboard özelleştirme açıldı');
  };

  const handleViewChange = (view: 'overview' | 'analytics' | 'widgets') => {
    setCurrentView(view);
    setLiveMessage(`${view === 'overview' ? 'Genel bakış' : view === 'analytics' ? 'Analitik' : 'Widget'} görünümü açıldı`);
  };

  if (status === 'loading' || loading) {
    return (
      <AccessibilityProvider>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4" 
                 role="status" aria-label="Yükleniyor"></div>
            <p className="text-lg text-gray-600 font-medium">Kontrol paneli yükleniyor...</p>
          </div>
        </div>
      </AccessibilityProvider>
    );
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SIGNED': return 'İmzalandı';
      case 'IN_REVIEW': return 'İncelemede';
      case 'APPROVED': return 'Onaylandı';
      case 'REJECTED': return 'Reddedildi';
      case 'DRAFT': return 'Taslak';
      case 'ARCHIVED': return 'Arşivlendi';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SIGNED':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
      case 'IN_REVIEW':
        return 'bg-amber-100 text-amber-800 border border-amber-200';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border border-gray-200';
      case 'ARCHIVED':
        return 'bg-purple-100 text-purple-800 border border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <SkipNavigation />
        <LiveRegion message={liveMessage} />

        {/* Mobile Header */}
        <MobileHeader 
          onMenuOpen={() => setMobileMenuOpen(true)}
          title="Dashboard"
        />

        {/* Mobile Navigation */}
        <MobileNavigation
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          user={{
            name: session?.user?.name || undefined,
            email: session?.user?.email || undefined,
            role: session?.user?.role || undefined
          }}
        />

        {/* Desktop Header */}
        <header className="hidden md:block bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">C</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Contravo
                  </h1>
                  <p className="text-sm text-gray-500">Sözleşme Yönetim Sistemi</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {/* Accessibility Settings */}
                <AccessibilitySettings />
                
                {/* Dashboard Customization */}
                <CustomizationToggle 
                  isCustomizing={isCustomizing}
                  onToggle={handleCustomizationToggle}
                />

                {/* Notifications */}
                <NotificationBell 
                  onClick={() => setNotificationsOpen(true)}
                  unreadCount={unreadNotifications}
                />

                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {session?.user?.name || session?.user?.email}
                  </p>
                  <p className="text-xs text-gray-500">
                    {session?.user?.role || 'Kullanıcı'} • Çevrimiçi
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link 
                    href="/dashboard/profile"
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Profil Ayarları"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    aria-label="Çıkış Yap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Desktop Navigation */}
        <nav className="hidden md:block bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 overflow-x-auto">
              <button
                onClick={() => handleViewChange('overview')}
                className={`group flex items-center space-x-2 text-white px-4 py-4 text-sm font-medium border-b-3 transition-all duration-200 ${
                  currentView === 'overview' ? 'border-white/60 bg-white/10' : 'border-transparent hover:bg-white/10'
                }`}
                aria-pressed={currentView === 'overview'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Genel Bakış</span>
              </button>
              
              <button
                onClick={() => handleViewChange('analytics')}
                className={`group flex items-center space-x-2 text-white px-4 py-4 text-sm font-medium border-b-3 transition-all duration-200 ${
                  currentView === 'analytics' ? 'border-white/60 bg-white/10' : 'border-transparent hover:bg-white/10'
                }`}
                aria-pressed={currentView === 'analytics'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Analitik Görünüm</span>
              </button>
              
              <button
                onClick={() => handleViewChange('widgets')}
                className={`group flex items-center space-x-2 text-white px-4 py-4 text-sm font-medium border-b-3 transition-all duration-200 ${
                  currentView === 'widgets' ? 'border-white/60 bg-white/10' : 'border-transparent hover:bg-white/10'
                }`}
                aria-pressed={currentView === 'widgets'}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                <span>Widget Görünümü</span>
              </button>

              <Link 
                href="/dashboard/contracts"
                className="group flex items-center space-x-2 text-white/80 hover:text-white px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Sözleşmeler</span>
              </Link>
              
              <Link 
                href="/dashboard/companies"
                className="group flex items-center space-x-2 text-white/80 hover:text-white px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span>Şirketler</span>
              </Link>
              
              <Link 
                href="/dashboard/templates"
                className="group flex items-center space-x-2 text-white/80 hover:text-white px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Şablonlar</span>
              </Link>
              
              <Link 
                href="/dashboard/clauses"
                className="group flex items-center space-x-2 text-white/80 hover:text-white px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span>Smart Clauses</span>
              </Link>
              
              <Link 
                href="/dashboard/reports"
                className="group flex items-center space-x-2 text-white/80 hover:text-white px-4 py-4 text-sm font-medium hover:bg-white/10 transition-all duration-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Raporlar</span>
              </Link>
            </div>
          </div>
        </nav>

        {/* Real-time Notifications */}
        <RealtimeNotifications
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />

        {/* Main Content */}
        <main id="main-content" className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          {/* Overview View */}
          {currentView === 'overview' && (
            <>
              {/* Welcome Section */}
              <div className="mb-8">
                <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white/10 rounded-full" aria-hidden="true"></div>
                  <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-white/5 rounded-full" aria-hidden="true"></div>
                  <div className="relative">
                    <h2 className="text-3xl font-bold mb-2">
                      Hoş geldiniz, {session?.user?.name?.split(' ')[0] || 'Kullanıcı'}! 👋
                    </h2>
                    <p className="text-indigo-100 text-lg">
                      Bugün {new Date().toLocaleDateString('tr-TR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <div className="mt-6 flex flex-wrap gap-4">
                      <TouchButton
                        onClick={() => router.push('/dashboard/contracts/new')}
                        variant="secondary"
                        className="bg-white/20 hover:bg-white/30 text-white border-0"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Yeni Sözleşme
                      </TouchButton>
                      
                      <TouchButton
                        onClick={() => router.push('/dashboard/templates')}
                        variant="secondary"
                        className="bg-white/10 hover:bg-white/20 text-white border-0"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Şablonları Keşfet
                      </TouchButton>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Toplam Sözleşme</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.totalContracts || 42}</p>
                      <p className="text-xs text-green-600 font-medium">↗ Bu ay +12%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Aktif Sözleşme</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.signedContracts || 38}</p>
                      <p className="text-xs text-green-600 font-medium">↗ Bu ay +8%</p>
                    </div>
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Bekleyen Onay</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.reviewContracts || 4}</p>
                      <p className="text-xs text-amber-600 font-medium">→ Değişim yok</p>
                    </div>
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Taslak</p>
                      <p className="text-3xl font-bold text-gray-900">{stats?.draftContracts || 8}</p>
                      <p className="text-xs text-gray-600 font-medium">↘ Bu ay -2</p>
                    </div>
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center" aria-hidden="true">
                      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">Hızlı İşlemler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Link
                    href="/dashboard/contracts/new"
                    className="group bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center" aria-hidden="true">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">Yeni Sözleşme</h4>
                        <p className="text-sm text-blue-100">Sıfırdan oluştur</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/templates"
                    className="group bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center" aria-hidden="true">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">Şablon Kullan</h4>
                        <p className="text-sm text-purple-100">Hazır şablonlardan</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/companies/new"
                    className="group bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-2xl hover:from-green-600 hover:to-green-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center" aria-hidden="true">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">Yeni Şirket</h4>
                        <p className="text-sm text-green-100">Firma ekle</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:shadow-lg hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center" aria-hidden="true">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold">Raporlar</h4>
                        <p className="text-sm text-orange-100">Analiz görüntüle</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Recent Contracts */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="px-6 py-5 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Son Sözleşmeler</h3>
                    <Link 
                      href="/dashboard/contracts"
                      className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded"
                    >
                      <span>Tümünü Görüntüle</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
                <div className="p-6">
                  {stats?.recentContracts && stats.recentContracts.length > 0 ? (
                    <div className="space-y-4">
                      {stats.recentContracts.slice(0, 5).map((contract) => (
                        <div key={contract.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all duration-200">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center" aria-hidden="true">
                              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{contract.title}</h4>
                              {contract.otherPartyName && (
                                <p className="text-sm text-gray-500">{contract.otherPartyName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(contract.status)}`}>
                              {getStatusText(contract.status)}
                            </span>
                            <span className="text-sm text-gray-500 font-medium">
                              {new Date(contract.createdAt).toLocaleDateString('tr-TR')}
                            </span>
                            <Link
                              href={`/dashboard/contracts/${contract.id}`}
                              className="text-gray-400 hover:text-indigo-600 transition-colors p-1 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              aria-label={`${contract.title} sözleşmesini görüntüle`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4" aria-hidden="true">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Henüz sözleşme bulunmuyor</h4>
                      <p className="text-gray-500 mb-6">İlk sözleşmenizi oluşturarak başlayın.</p>
                      <TouchButton
                        onClick={() => router.push('/dashboard/contracts/new')}
                        variant="primary"
                      >
                        İlk Sözleşmeni Oluştur
                      </TouchButton>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Analytics View */}
          {currentView === 'analytics' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Analitik Dashboard</h2>
                <p className="text-gray-600">Detaylı sözleşme analitiği ve performans metrikleri</p>
              </div>
              <AnalyticsCharts loading={loading} />
            </div>
          )}

          {/* Widget View */}
          {currentView === 'widgets' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Widget Dashboard</h2>
                <p className="text-gray-600">Özelleştirilebilir dashboard widget'ları</p>
              </div>
              <DashboardWidgets
                isCustomizing={isCustomizing}
                onCustomizationEnd={() => setIsCustomizing(false)}
              />
            </div>
          )}
        </main>
      </div>
    </AccessibilityProvider>
  );
} 