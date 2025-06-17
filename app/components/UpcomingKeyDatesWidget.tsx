'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Contract interface
interface Contract {
  id: string;
  title: string;
  expirationDate: string;
  noticePeriodDays: number | null;
}

// Tarih formatı için yardımcı fonksiyon
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Kalan gün sayısını hesaplayan fonksiyon
function calculateDaysRemaining(expirationDate: string): number {
  const today = new Date();
  const expiration = new Date(expirationDate);
  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Kritiklik seviyesini belirleyen fonksiyon
function getCriticalityLevel(daysRemaining: number): {
  level: 'critical' | 'warning' | 'info';
  color: string;
  bgColor: string;
  borderColor: string;
  label: string;
} {
  if (daysRemaining <= 7) {
    return {
      level: 'critical',
      color: 'text-red-800',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      label: 'KRİTİK'
    };
  } else if (daysRemaining <= 30) {
    return {
      level: 'warning',
      color: 'text-yellow-800',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      label: 'DİKKAT'
    };
  } else {
    return {
      level: 'info',
      color: 'text-blue-800',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      label: 'PLANLAMA'
    };
  }
}

// Nokta rengini belirleyen fonksiyon
function getDotColor(level: 'critical' | 'warning' | 'info'): string {
  switch (level) {
    case 'critical':
      return 'bg-red-500';
    case 'warning':
      return 'bg-yellow-500';
    case 'info':
      return 'bg-blue-500';
    default:
      return 'bg-gray-500';
  }
}

export default function UpcomingKeyDatesWidget() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcomingContracts = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/dashboard/upcoming-contracts');
        
        if (!response.ok) {
          throw new Error('Failed to fetch upcoming contracts');
        }
        
        const data = await response.json();
        setContracts(data.contracts || []);
      } catch (err) {
        console.error('Error fetching upcoming contracts:', err);
        setError('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingContracts();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">📅 Yaklaşan Önemli Tarihler</h3>
              <p className="text-sm text-gray-600">Kritik sözleşme tarihlerini kaçırmayın</p>
            </div>
          </div>
          <Link 
            href="/dashboard/contracts"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            Tümünü Gör →
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">📅 Yaklaşan Önemli Tarihler</h3>
              <p className="text-sm text-gray-600">Kritik sözleşme tarihlerini kaçırmayın</p>
            </div>
          </div>
          <Link 
            href="/dashboard/contracts"
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
          >
            Tümünü Gör →
          </Link>
        </div>
        
        <div className="space-y-4">
          <div className="text-center py-8 text-red-500">
            <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">📅 Yaklaşan Önemli Tarihler</h3>
            <p className="text-sm text-gray-600">Kritik sözleşme tarihlerini kaçırmayın</p>
          </div>
        </div>
        <Link 
          href="/dashboard/contracts"
          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium transition-colors"
        >
          Tümünü Gör →
        </Link>
      </div>
      
      <div className="space-y-4">
        {contracts.length === 0 ? (
          // Boş durum mesajı
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm font-medium text-gray-900 mb-1">
              Takip edilecek önemli bir tarih bulunmuyor.
            </p>
            <p className="text-xs text-gray-500">
              Önümüzdeki 90 gün içinde sona erecek sözleşme bulunmamaktadır.
            </p>
          </div>
        ) : (
          // Sözleşme listesi
          contracts.map((contract) => {
            const daysRemaining = calculateDaysRemaining(contract.expirationDate);
            const criticality = getCriticalityLevel(daysRemaining);
            const dotColor = getDotColor(criticality.level);
            
            return (
              <Link
                key={contract.id}
                href={`/dashboard/contracts/${contract.id}`}
                className={`flex items-center justify-between p-4 ${criticality.bgColor} border ${criticality.borderColor} rounded-lg hover:shadow-sm transition-all duration-200 hover:scale-[1.02] cursor-pointer`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 ${dotColor} rounded-full`}></div>
                  <div>
                    <p className="font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                      {contract.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      Bitiş: {formatDate(contract.expirationDate)} 
                      <span className="font-medium ml-1">
                        ({daysRemaining > 0 ? `${daysRemaining} gün kaldı` : 'Bugün sona eriyor'})
                      </span>
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 ${
                  criticality.level === 'critical' ? 'bg-red-100 text-red-800' :
                  criticality.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                } text-xs font-medium rounded-full`}>
                  {criticality.label}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
} 