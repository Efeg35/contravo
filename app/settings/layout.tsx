'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  FolderIcon,
  ChartBarIcon,
  KeyIcon,
  BellIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  current?: boolean;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation: NavigationSection[] = [
    {
      title: 'COMPANY',
      items: [
        { name: 'Profile', href: '/settings/company/profile', icon: UserIcon },
        { name: 'Users', href: '/settings/company/users', icon: UsersIcon },
        { name: 'Groups', href: '/settings/company/groups', icon: UserGroupIcon },
        { name: 'Integrations', href: '/settings/company/integrations', icon: CogIcon },
        { name: 'Utilization', href: '/settings/company/utilization', icon: ChartBarIcon },
        { name: 'API', href: '/settings/company/api', icon: KeyIcon },
        { name: 'Settings', href: '/settings/company/settings', icon: CogIcon },
        { name: 'Errors', href: '/settings/company/errors', icon: ShieldCheckIcon },
      ],
    },
    {
      title: 'DATA',
      items: [
        { name: 'AI Clauses', href: '/settings/data/ai-clauses', icon: DocumentTextIcon },
        { name: 'Data Manager', href: '/settings/data/manager', icon: FolderIcon },
        { name: 'Clause Library', href: '/settings/data/clause-library', icon: DocumentTextIcon },
      ],
    },
    {
      title: 'PERSONAL',
      items: [
        { name: 'Profile', href: '/settings/personal/profile', icon: UserIcon },
        { name: 'Notifications', href: '/settings/personal/notifications', icon: BellIcon },
        { name: 'My Integrations', href: '/settings/personal/integrations', icon: CogIcon },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-6">
            {/* Back to Dashboard Button */}
            <Link 
              href="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Dashboard'a Dön</span>
            </Link>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>
            
            <nav className="space-y-8">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h2>
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.name}>
                          <Link
                            href={item.href}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <item.icon
                              className={`w-5 h-5 mr-3 ${
                                isActive ? 'text-gray-500' : 'text-gray-400'
                              }`}
                            />
                            {item.name}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <main className="p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
} 