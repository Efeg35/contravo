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

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      current: pathname === '/dashboard',
    },
    {
      name: 'Depo',
      icon: DocumentTextIcon,
      children: [
        {
          name: 'Sözleşmeler',
          href: '/dashboard/contracts',
          icon: DocumentTextIcon,
          current: pathname.startsWith('/dashboard/contracts'),
        },
        {
          name: 'Şirketler',
          href: '/dashboard/companies',
          icon: BuildingOfficeIcon,
          current: pathname.startsWith('/dashboard/companies'),
        },
        {
          name: 'Şablonlar',
          href: '/dashboard/templates',
          icon: DocumentDuplicateIcon,
          current: pathname.startsWith('/dashboard/templates'),
        },
      ],
    },
    {
      name: 'Raporlar',
      href: '/dashboard/reports',
      icon: ChartBarIcon,
      current: pathname.startsWith('/dashboard/reports'),
    },
    {
      name: 'Yönetici',
      icon: Cog6ToothIcon,
      requiresAdmin: true,
      children: [
        {
          name: 'Kullanıcı Yönetimi',
          href: '/dashboard/admin/users',
          icon: UsersIcon,
          current: pathname.startsWith('/dashboard/admin/users'),
        },
        {
          name: 'Takım Yönetimi',
          href: '/dashboard/admin/teams',
          icon: UsersIcon,
          current: pathname.startsWith('/dashboard/admin/teams'),
        },
        {
          name: 'Madde Kütüphanesi',
          href: '/dashboard/clauses',
          icon: BookOpenIcon,
          current: pathname.startsWith('/dashboard/clauses'),
        },
      ],
    },
  ];

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
            {/* Logo and Main Navigation */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="w-5 h-5 text-white" />
                </div>
                <span className="ml-2 text-xl font-bold text-gray-900">Contravo</span>
              </Link>

              {/* Main Navigation Menu */}
              <div className="hidden md:flex items-center space-x-1">
                {navigation.map((item) => {
                  if (item.requiresAdmin && !isAdmin) return null;

                  if (item.children) {
                    const isOpen = openDropdowns.includes(item.name);
                    const hasActivChild = item.children.some(child => child.current);
                    
                    return (
                      <div key={item.name} className="relative">
                        <button
                          onClick={() => toggleDropdown(item.name)}
                          className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            hasActivChild || isOpen
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                          }`}
                        >
                          <item.icon className="w-4 h-4 mr-2" />
                          {item.name}
                          <ChevronDownIcon 
                            className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
                          />
                        </button>

                        {/* Dropdown Menu */}
                        {isOpen && (
                          <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                            {item.children.map((child) => (
                              <Link
                                key={child.name}
                                href={child.href!}
                                className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                  child.current
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setOpenDropdowns([])}
                              >
                                <child.icon className="w-4 h-4 mr-3" />
                                {child.name}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.name}
                      href={item.href!}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        item.current
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      <item.icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Side - Notifications and User Menu */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Link
                href="/dashboard/notifications"
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
              >
                <BellIcon className="w-5 h-5" />
              </Link>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('user')}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                >
                  <UserCircleIcon className="w-6 h-6" />
                  <span className="hidden sm:block text-sm font-medium">
                    {session.user?.name || session.user?.email}
                  </span>
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
                      Profil
                    </Link>
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

        {/* Click outside to close dropdowns */}
        {openDropdowns.length > 0 && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpenDropdowns([])}
          />
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 