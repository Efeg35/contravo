'use client';

import { useState, useEffect, useCallback } from 'react';
import { saveReportSchedule } from '../actions';

export interface ScheduleFormData {
  frequency: 'daily' | 'weekly' | 'monthly';
  dayOfWeek?: number; // 0-6 (Pazar-Cumartesi)
  dayOfMonth?: number; // 1-31
  hour: number;
  minute: number;
  recipients: string[];
  status: 'ACTIVE' | 'PAUSED';
}

interface ScheduleLog {
  id: string;
  status: string;
  details: string | null;
  executedAt: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  reportId: string;
  reportName: string;
  currentSchedule?: {
    id: string;
    cron: string;
    recipients: string[];
    status: string;
  } | null;
  onSave?: () => void;
}

// Cron expression'ı form data'ya çevir
function cronToFormData(cron: string): ScheduleFormData {
  const parts = cron.split(' ');
  if (parts.length !== 5) {
    return {
      frequency: 'daily',
      hour: 9,
      minute: 0,
      recipients: [],
      status: 'ACTIVE'
    };
  }

  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;
  
  // Günlük: * * * * *
  if (dayOfWeek === '*' && dayOfMonth === '*') {
    return {
      frequency: 'daily',
      hour: parseInt(hour),
      minute: parseInt(minute),
      recipients: [],
      status: 'ACTIVE'
    };
  }
  
  // Haftalık: * * * * 1
  if (dayOfWeek !== '*' && dayOfMonth === '*') {
    return {
      frequency: 'weekly',
      dayOfWeek: parseInt(dayOfWeek),
      hour: parseInt(hour),
      minute: parseInt(minute),
      recipients: [],
      status: 'ACTIVE'
    };
  }
  
  // Aylık: * * 1 * *
  return {
    frequency: 'monthly',
    dayOfMonth: parseInt(dayOfMonth),
    hour: parseInt(hour),
    minute: parseInt(minute),
    recipients: [],
    status: 'ACTIVE'
  };
}

// Form data'yı cron expression'a çevir
function formDataToCron(data: ScheduleFormData): string {
  const { frequency, hour, minute, dayOfWeek, dayOfMonth } = data;
  
  switch (frequency) {
    case 'daily':
      return `${minute} ${hour} * * *`;
    case 'weekly':
      return `${minute} ${hour} * * ${dayOfWeek || 1}`;
    case 'monthly':
      return `${minute} ${hour} ${dayOfMonth || 1} * *`;
    default:
      return `${minute} ${hour} * * *`;
  }
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Pazar' },
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
];

export default function ReportScheduleModal({ isOpen, onClose, reportId, reportName, currentSchedule, onSave }: Props) {
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [formData, setFormData] = useState<ScheduleFormData>({
    frequency: 'weekly',
    dayOfWeek: 1, // Pazartesi
    hour: 9,
    minute: 0,
    recipients: [],
    status: 'ACTIVE'
  });
  
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [logs, setLogs] = useState<ScheduleLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // Modal açıldığında mevcut zamanlama verilerini yükle
  useEffect(() => {
    if (isOpen && currentSchedule) {
      const parsedData = cronToFormData(currentSchedule.cron);
      setFormData({
        ...parsedData,
        recipients: Array.isArray(currentSchedule.recipients) 
          ? currentSchedule.recipients 
          : [],
        status: currentSchedule.status as 'ACTIVE' | 'PAUSED'
      });
    } else if (isOpen && !currentSchedule) {
      // Yeni zamanlama için varsayılan değerler
      setFormData({
        frequency: 'weekly',
        dayOfWeek: 1,
        hour: 9,
        minute: 0,
        recipients: [],
        status: 'ACTIVE'
      });
    }
  }, [isOpen, currentSchedule]);

  // Logları yükle
  const fetchLogs = useCallback(async () => {
    if (!currentSchedule || !isOpen) return;
    
    setLogsLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/schedule-logs`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
      } else {
        console.error('Loglar yüklenemedi');
        setLogs([]);
      }
    } catch (error) {
      console.error('Log yükleme hatası:', error);
      setLogs([]);
    } finally {
      setLogsLoading(false);
    }
  }, [currentSchedule, isOpen, reportId]);

  // History sekmesine geçildiğinde logları yükle
  useEffect(() => {
    if (activeTab === 'history' && currentSchedule) {
      fetchLogs();
    }
  }, [activeTab, currentSchedule, fetchLogs]);

  // Modal açıldığında settings sekmesine dön
  useEffect(() => {
    if (isOpen) {
      setActiveTab('settings');
    }
  }, [isOpen]);

  const handleEmailAdd = () => {
    const email = emailInput.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email && emailRegex.test(email) && !formData.recipients.includes(email)) {
      setFormData(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
      setEmailInput('');
    }
  };

  const handleEmailRemove = (emailToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(email => email !== emailToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEmailAdd();
    }
  };

  const handleSave = async () => {
    if (formData.recipients.length === 0) {
      alert('En az bir alıcı e-posta adresi eklemelisiniz.');
      return;
    }

    setSaving(true);
    try {
      const cronExpression = formDataToCron(formData);
      
      await saveReportSchedule({
        savedReportId: reportId,
        cron: cronExpression,
        recipients: formData.recipients,
        status: formData.status
      });

      onClose();
      // Sayfa yenileme yerine callback çağır
      if (onSave) {
        onSave();
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Zamanlama kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Rapor Zamanlaması
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    "{reportName}" için otomatik gönderim ayarları
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setActiveTab('settings')}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === 'settings'
                        ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    Zamanlama Ayarları
                  </button>
                  {currentSchedule && (
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'history'
                          ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      Çalışma Geçmişi
                    </button>
                  )}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'settings' && (
                <div className="space-y-6">
                  {/* Frekans Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gönderim Sıklığı
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        frequency: e.target.value as 'daily' | 'weekly' | 'monthly'
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="daily">Günlük</option>
                      <option value="weekly">Haftalık</option>
                      <option value="monthly">Aylık</option>
                    </select>
                  </div>

                  {/* Koşullu Girdiler */}
                  {formData.frequency === 'weekly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Haftanın Günü
                      </label>
                      <select
                        value={formData.dayOfWeek || 1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dayOfWeek: parseInt(e.target.value)
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {DAYS_OF_WEEK.map(day => (
                          <option key={day.value} value={day.value}>{day.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.frequency === 'monthly' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Ayın Günü
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={formData.dayOfMonth || 1}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          dayOfMonth: parseInt(e.target.value) || 1
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  )}

                  {/* Saat Seçimi */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Gönderim Saati
                    </label>
                    <div className="flex space-x-2">
                      <select
                        value={formData.hour}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          hour: parseInt(e.target.value)
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="flex items-center text-gray-500">:</span>
                      <select
                        value={formData.minute}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          minute: parseInt(e.target.value)
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {[0, 15, 30, 45].map(minute => (
                          <option key={minute} value={minute}>{minute.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* E-posta Alıcıları */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Alıcı E-posta Adresleri
                    </label>
                    
                    {/* E-posta Ekleme */}
                    <div className="flex space-x-2 mb-3">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="ornek@email.com"
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                      />
                      <button
                        onClick={handleEmailAdd}
                        type="button"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Ekle
                      </button>
                    </div>

                    {/* E-posta Listesi */}
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {formData.recipients.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-lg">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{email}</span>
                          <button
                            onClick={() => handleEmailRemove(email)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      
                      {formData.recipients.length === 0 && (
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          Henüz alıcı eklenmedi
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Aktif/Pasif */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Zamanlama Durumu
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Aktif zamanlamalar otomatik çalışır
                      </p>
                    </div>
                    <button
                      onClick={() => setFormData(prev => ({ 
                        ...prev, 
                        status: prev.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
                      }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        formData.status === 'ACTIVE' 
                          ? 'bg-purple-600' 
                          : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.status === 'ACTIVE' ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {logsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-gray-500 dark:text-gray-400 mt-2">Geçmiş yükleniyor...</p>
                    </div>
                  ) : logs.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/50"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {log.status === 'SUCCESS' ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  BAŞARILI
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                  HATALI
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDateTime(log.executedAt)}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                              {log.details}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400">Henüz çalışma geçmişi bulunmuyor</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Zamanlama aktif olduktan sonra burada görünecektir
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Actions - Sadece Settings sekmesinde göster */}
              {activeTab === 'settings' && (
                <div className="flex space-x-3 mt-8">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || formData.recipients.length === 0}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 