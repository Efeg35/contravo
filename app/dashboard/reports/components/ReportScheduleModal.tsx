'use client';

import { useState, useEffect } from 'react';
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

  const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
  
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50">
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Raporu Zamanla
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

              {/* Form */}
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

              {/* Actions */}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 