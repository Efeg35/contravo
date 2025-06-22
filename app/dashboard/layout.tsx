'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  HomeIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  DocumentDuplicateIcon,
  ChartBarIcon,
  UsersIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  ChevronDownIcon,
  BellIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  FolderIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href?: string;
  icon: any;
  current?: boolean;
  children?: NavigationItem[];
  requiresAdmin?: boolean;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  const isAdmin = session?.user?.role === 'ADMIN';

  const toggleDropdown = (name: string) => {
    setOpenDropdowns(prev =>
      prev.includes(name)
        ? prev.filter(item => item !== name)
        : [...prev, name]
    );
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdowns([]);
    };

    if (openDropdowns.length > 0) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [openDropdowns]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left Side - Logo and Main Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Contravo</span>
              </Link>

              {/* Main Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1">
                {/* Dashboard Link */}
                <Link
                  href="/dashboard"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === '/dashboard'
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>

                {/* Repository Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('repository');
                    }}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith('/dashboard/contracts') || 
                      pathname.startsWith('/dashboard/companies') || 
                      pathname.startsWith('/dashboard/templates') ||
                      openDropdowns.includes('repository')
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <FolderIcon className="w-4 h-4 mr-2" />
                    Depo
                    <ChevronDownIcon 
                      className={`w-4 h-4 ml-1 transition-transform ${
                        openDropdowns.includes('repository') ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Repository Dropdown Menu */}
                  {openDropdowns.includes('repository') && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/dashboard/contracts"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/contracts')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <DocumentTextIcon className="w-4 h-4 mr-3" />
                        Sözleşmeler
                      </Link>
                      <Link
                        href="/dashboard/companies"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/companies')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                        Şirketler
                      </Link>
                      <Link
                        href="/dashboard/templates"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/templates')
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <DocumentDuplicateIcon className="w-4 h-4 mr-3" />
                        Şablonlar
                      </Link>
                    </div>
                  )}
                </div>

                {/* Insights/Reports Link */}
                <Link
                  href="/dashboard/reports"
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname.startsWith('/dashboard/reports')
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <ChartBarIcon className="w-4 h-4 mr-2" />
                  Raporlar
                </Link>
              </div>
            </div>

            {/* Right Side - Action Buttons and User Menu */}
            <div className="flex items-center space-x-3">
              
              {/* + New Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('new');
                  }}
                  className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="w-4 h-4 mr-1" />
                  Yeni
                </button>

                {/* New Dropdown Menu */}
                {openDropdowns.includes('new') && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/dashboard/contracts/new"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenDropdowns([])}
                    >
                      <DocumentTextIcon className="w-4 h-4 mr-3" />
                      Yeni Sözleşme
                    </Link>
                    <Link
                      href="/dashboard/companies/new"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenDropdowns([])}
                    >
                      <BuildingOfficeIcon className="w-4 h-4 mr-3" />
                      Yeni Şirket
                    </Link>
                    <Link
                      href="/dashboard/templates"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenDropdowns([])}
                    >
                      <DocumentDuplicateIcon className="w-4 h-4 mr-3" />
                      Yeni Şablon
                    </Link>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <button
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors relative"
                title="Bildirimler"
              >
                <BellIcon className="w-5 h-5" />
                {/* You can add notification badge here */}
                {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
              </button>

              {/* Admin Menu - Only visible to ADMIN users */}
              {isAdmin && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDropdown('admin');
                    }}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      pathname.startsWith('/dashboard/admin') ||
                      pathname.startsWith('/dashboard/clauses') ||
                      openDropdowns.includes('admin')
                        ? 'bg-orange-50 text-orange-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-1" />
                    Yönetici
                    <ChevronDownIcon 
                      className={`w-4 h-4 ml-1 transition-transform ${
                        openDropdowns.includes('admin') ? 'rotate-180' : ''
                      }`} 
                    />
                  </button>

                  {/* Admin Dropdown Menu */}
                  {openDropdowns.includes('admin') && (
                    <div className="absolute top-full right-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <Link
                        href="/dashboard/admin/users"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/admin/users')
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <UsersIcon className="w-4 h-4 mr-3" />
                        Kullanıcı Yönetimi
                      </Link>
                      <Link
                        href="/dashboard/admin/teams"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/admin/teams')
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <UsersIcon className="w-4 h-4 mr-3" />
                        Takım Yönetimi
                      </Link>
                      <Link
                        href="/dashboard/admin/clauses"
                        className={`flex items-center px-4 py-2 text-sm transition-colors ${
                          pathname.startsWith('/dashboard/admin/clauses')
                            ? 'bg-orange-50 text-orange-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        onClick={() => setOpenDropdowns([])}
                      >
                        <BookOpenIcon className="w-4 h-4 mr-3" />
                        Madde Kütüphanesi
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* User Profile Menu */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown('user');
                  }}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <UserCircleIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium text-gray-900">
                      {session.user?.name || 'Kullanıcı'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.user?.email}
                    </div>
                  </div>
                  <ChevronDownIcon className="w-4 h-4" />
                </button>

                {/* User Dropdown */}
                {openDropdowns.includes('user') && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenDropdowns([])}
                    >
                      <UserCircleIcon className="w-4 h-4 mr-3" />
                      Ayarlar
                    </Link>
                    <hr className="my-1 border-gray-200" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                      Çıkış Yap
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 