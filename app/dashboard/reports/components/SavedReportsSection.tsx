'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getSavedReports, deleteSavedReport } from '../actions';
import ReportScheduleModal from './ReportScheduleModal';

interface SavedReport {
  id: string;
  name: string;
  description: string | null;
  configuration: any;
  createdAt: Date;
  updatedAt: Date;
  schedule?: {
    id: string;
    cron: string;
    recipients: any; // JsonValue olarak geliyor, type assertion ile çevireceğiz
    status: string;
  } | null;
}

interface ConfigData {
  dataSource?: string;
  fields?: string[];
  filters?: any[];
  visualization?: string;
}

const DATA_SOURCE_LABELS: Record<string, string> = {
  contracts: 'Sözleşmeler',
  companies: 'Şirketler',
  users: 'Kullanıcılar',
  teams: 'Takımlar',
};

function buildReportUrl(configuration: ConfigData): string {
  const params = new URLSearchParams();
  
  if (configuration.dataSource) {
    params.set('dataSource', configuration.dataSource);
  }
  
  if (configuration.fields && configuration.fields.length > 0) {
    params.set('fields', configuration.fields.join(','));
  }
  
  if (configuration.filters && configuration.filters.length > 0) {
    const filtersString = JSON.stringify(configuration.filters);
    params.set('filters', encodeURIComponent(filtersString));
  }
  
  if (configuration.visualization) {
    params.set('visualization', configuration.visualization);
  }
  
  return `/dashboard/reports/new?${params.toString()}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('tr-TR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export default function SavedReportsSection() {
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{ isOpen: boolean; reportId: string; reportName: string; currentSchedule?: any } | null>(null);

  useEffect(() => {
    async function fetchSavedReports() {
      try {
        const reports = await getSavedReports();
        setSavedReports(reports);
      } catch (error) {
        console.error('Error fetching saved reports:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSavedReports();
  }, []);

  const refreshReports = async () => {
    try {
      const reports = await getSavedReports();
      setSavedReports(reports);
    } catch (error) {
      console.error('Error refreshing saved reports:', error);
    }
  };

  const handleDeleteReport = async (reportId: string, reportName: string) => {
    if (!confirm(`"${reportName}" adlı raporu silmek istediğinizden emin misiniz?`)) {
      return;
    }

    setDeletingId(reportId);
    
    try {
      await deleteSavedReport(reportId);
      setSavedReports(prev => prev.filter(report => report.id !== reportId));
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Rapor silinirken bir hata oluştu.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg p-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700/50 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg">
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Kaydedilmiş Raporlarım
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Daha önce oluşturduğunuz raporlara hızlı erişim
              </p>
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {savedReports?.length || 0} rapor
          </div>
        </div>

        {!savedReports || savedReports.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Henüz kaydedilmiş rapor yok
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Özel raporlar oluşturup kaydederek daha sonra tekrar kullanabilirsiniz.
            </p>
            <Link
              href="/dashboard/reports/new"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              İlk Raporunu Oluştur
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {savedReports?.map((report) => {
              const config = report.configuration as ConfigData;
              const reportUrl = buildReportUrl(config);
              
              return (
                <div
                  key={report.id}
                  className="group relative bg-gray-50 dark:bg-gray-700/30 rounded-xl p-6 border border-gray-200/50 dark:border-gray-600/30 hover:border-purple-200 dark:hover:border-purple-600/50 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Link href={reportUrl} className="block">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {report.name}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {DATA_SOURCE_LABELS[config.dataSource || ''] || config.dataSource}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              {config.visualization === 'table' ? '📊 Tablo' : 
                               config.visualization === 'bar' ? '📈 Bar Chart' : 
                               config.visualization === 'line' ? '📉 Line Chart' : 
                               '📊 Tablo'}
                            </span>
                            {report.schedule && (
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                                report.schedule.status === 'ACTIVE' 
                                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' 
                                  : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                              }`}>
                                🕒 {report.schedule.status === 'ACTIVE' ? 'Zamanlanmış' : 'Duraklatılmış'}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {report.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {report.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            <strong>Sütunlar:</strong> {config.fields?.length || 0} adet
                          </span>
                          <span>
                            <strong>Filtreler:</strong> {config.filters?.length || 0} adet
                          </span>
                          <span>
                            <strong>Güncellenme:</strong> {formatDate(report.updatedAt)}
                          </span>
                        </div>
                      </Link>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Link
                        href={reportUrl}
                        className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                        title="Raporu aç"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                      
                      <button
                        onClick={() => setScheduleModal({
                          isOpen: true,
                          reportId: report.id,
                          reportName: report.name,
                          currentSchedule: report.schedule ? {
                            ...report.schedule,
                            recipients: Array.isArray(report.schedule.recipients) 
                              ? report.schedule.recipients 
                              : []
                          } : null
                        })}
                        className={`p-2 transition-colors ${
                          report.schedule?.status === 'ACTIVE' 
                            ? 'text-green-500 hover:text-green-600 dark:text-green-400 dark:hover:text-green-300' 
                            : 'text-gray-400 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                        title={report.schedule ? 'Zamanlamayı düzenle' : 'Raporu zamanla'}
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => handleDeleteReport(report.id, report.name)}
                        disabled={deletingId === report.id}
                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                        title="Raporu sil"
                      >
                        {deletingId === report.id ? (
                          <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Zamanlama Modal'ı */}
      {scheduleModal && (
        <ReportScheduleModal
          isOpen={scheduleModal.isOpen}
          onClose={() => setScheduleModal(null)}
          reportId={scheduleModal.reportId}
          reportName={scheduleModal.reportName}
          currentSchedule={scheduleModal.currentSchedule}
          onSave={refreshReports}
        />
      )}
    </div>
  );
} 