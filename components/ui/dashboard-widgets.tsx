'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Widget {
  id: string;
  type: 'stats' | 'chart' | 'list' | 'progress' | 'calendar' | 'activity';
  title: string;
  size: 'small' | 'medium' | 'large' | 'full';
  position: { x: number; y: number };
  visible: boolean;
  data?: {
    value?: string | number;
    change?: string;
    trend?: 'up' | 'down';
    chartType?: string;
    items?: { title: string; status: string; date: string }[];
    targets?: { label: string; current: number; target: number; percentage: number }[];
    activities?: { user: string; action: string; target: string; time: string }[];
    [key: string]: any;
  };
}

interface DashboardWidgetsProps {
  isCustomizing: boolean;
  onCustomizationEnd: () => void;
}

const WIDGET_SIZES = {
  small: 'col-span-1 row-span-1',
  medium: 'col-span-2 row-span-1', 
  large: 'col-span-2 row-span-2',
  full: 'col-span-4 row-span-1'
};

export default function DashboardWidgets({ isCustomizing, onCustomizationEnd }: DashboardWidgetsProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [availableWidgets, setAvailableWidgets] = useState<Omit<Widget, 'position' | 'visible'>[]>([]);


  // Initialize widgets
  useEffect(() => {
    const defaultWidgets: Widget[] = [
      {
        id: 'stats-contracts',
        type: 'stats',
        title: 'Toplam Sözleşmeler',
        size: 'small',
        position: { x: 0, y: 0 },
        visible: true,
        data: { value: 156, change: '+12%', trend: 'up' }
      },
      {
        id: 'stats-revenue',
        type: 'stats',
        title: 'Toplam Gelir',
        size: 'small',
        position: { x: 1, y: 0 },
        visible: true,
        data: { value: '₺2.4M', change: '+8%', trend: 'up' }
      },
      {
        id: 'chart-monthly',
        type: 'chart',
        title: 'Aylık Analiz',
        size: 'large',
        position: { x: 2, y: 0 },
        visible: true,
        data: { chartType: 'line' }
      },
      {
        id: 'list-recent',
        type: 'list',
        title: 'Son Sözleşmeler',
        size: 'medium',
        position: { x: 0, y: 1 },
        visible: true,
        data: {
          items: [
            { title: 'ABC Ltd. Hizmet Sözleşmesi', status: 'signed', date: '2024-06-10' },
            { title: 'XYZ Corp. İşbirliği Anlaşması', status: 'pending', date: '2024-06-09' },
            { title: 'DEF Inc. Tedarikçi Sözleşmesi', status: 'draft', date: '2024-06-08' },
          ]
        }
      },
      {
        id: 'progress-quarterly',
        type: 'progress',
        title: 'Çeyrek Hedefler',
        size: 'medium',
        position: { x: 2, y: 1 },
        visible: true,
        data: {
          targets: [
            { label: 'Sözleşme Sayısı', current: 75, target: 100, percentage: 75 },
            { label: 'Gelir Hedefi', current: 1.8, target: 2.5, percentage: 72 },
          ]
        }
      },
      {
        id: 'activity-feed',
        type: 'activity',
        title: 'Son Aktiviteler',
        size: 'full',
        position: { x: 0, y: 2 },
        visible: true,
        data: {
          activities: [
            { user: 'Ahmet Yılmaz', action: 'sözleşme oluşturdu', target: 'ABC Ltd. Hizmet Sözleşmesi', time: '2 saat önce' },
            { user: 'Ayşe Demir', action: 'onayladı', target: 'XYZ Corp. Anlaşması', time: '3 saat önce' },
            { user: 'Mehmet Kaya', action: 'imzaladı', target: 'DEF Inc. Sözleşmesi', time: '1 gün önce' },
          ]
        }
      }
    ];

    const available: Omit<Widget, 'position' | 'visible'>[] = [
      {
        id: 'calendar-widget',
        type: 'calendar',
        title: 'Takvim',
        size: 'medium',
        data: {}
      },
      {
        id: 'stats-pending',
        type: 'stats',
        title: 'Bekleyen Onaylar',
        size: 'small',
        data: { value: 23, change: '+3', trend: 'up' }
      },
      {
        id: 'chart-pie',
        type: 'chart',
        title: 'Durum Dağılımı',
        size: 'medium',
        data: { chartType: 'pie' }
      }
    ];

    setWidgets(defaultWidgets);
    setAvailableWidgets(available);
  }, []);



  const addWidget = (widgetTemplate: Omit<Widget, 'position' | 'visible'>) => {
    const newWidget: Widget = {
      ...widgetTemplate,
      id: `${widgetTemplate.id}-${Date.now()}`,
      position: { x: 0, y: 0 },
      visible: true
    };

    setWidgets(prev => [...prev, newWidget]);
  };

  const removeWidget = (widgetId: string) => {
    setWidgets(prev => prev.filter(w => w.id !== widgetId));
  };

  const changeWidgetSize = (widgetId: string, newSize: Widget['size']) => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      )
    );
  };

  const renderWidget = (widget: Widget) => {
    const baseClasses = `bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${WIDGET_SIZES[widget.size]} transition-all duration-200`;
    const customizingClasses = isCustomizing ? 'cursor-move hover:shadow-lg border-2 border-dashed border-indigo-300' : '';

    switch (widget.type) {
      case 'stats':
        return (
          <motion.div
            key={widget.id}
            layout
            className={`${baseClasses} ${customizingClasses}`}
            whileHover={isCustomizing ? { scale: 1.02 } : {}}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => changeWidgetSize(widget.id, widget.size === 'small' ? 'medium' : 'small')}
                  className="p-1 text-gray-400 hover:text-indigo-600 bg-white rounded shadow-sm"
                  title="Boyut değiştir"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                  title="Kaldır"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-500">{widget.title}</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{widget.data?.value}</p>
              </div>
              {widget.data?.trend && (
                <div className={`flex items-center text-sm ${
                  widget.data.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  <span>{widget.data.change}</span>
                  <svg
                    className={`w-4 h-4 ml-1 ${widget.data.trend === 'down' ? 'rotate-180' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </motion.div>
        );

      case 'chart':
        return (
          <motion.div
            key={widget.id}
            layout
            className={`${baseClasses} ${customizingClasses}`}
            whileHover={isCustomizing ? { scale: 1.02 } : {}}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => changeWidgetSize(widget.id, widget.size === 'medium' ? 'large' : 'medium')}
                  className="p-1 text-gray-400 hover:text-indigo-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="h-48 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p>{widget.data?.chartType} Grafik</p>
              </div>
            </div>
          </motion.div>
        );

      case 'list':
        return (
          <motion.div
            key={widget.id}
            layout
            className={`${baseClasses} ${customizingClasses}`}
            whileHover={isCustomizing ? { scale: 1.02 } : {}}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => changeWidgetSize(widget.id, widget.size === 'medium' ? 'large' : 'medium')}
                  className="p-1 text-gray-400 hover:text-indigo-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="space-y-3">
              {widget.data?.items?.slice(0, 3).map((item: { title: string; status: string; date: string }, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.date}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    item.status === 'signed' ? 'bg-green-100 text-green-700' :
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status === 'signed' ? 'İmzalandı' :
                     item.status === 'pending' ? 'Bekliyor' : 'Taslak'}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'progress':
        return (
          <motion.div
            key={widget.id}
            layout
            className={`${baseClasses} ${customizingClasses}`}
            whileHover={isCustomizing ? { scale: 1.02 } : {}}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => changeWidgetSize(widget.id, widget.size === 'medium' ? 'large' : 'medium')}
                  className="p-1 text-gray-400 hover:text-indigo-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="space-y-4">
              {widget.data?.targets?.map((target: { label: string; current: number; target: number; percentage: number }, index: number) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{target.label}</span>
                    <span className="text-gray-900 font-medium">{target.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className="bg-indigo-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${target.percentage}%` }}
                      transition={{ duration: 1, delay: index * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      case 'activity':
        return (
          <motion.div
            key={widget.id}
            layout
            className={`${baseClasses} ${customizingClasses}`}
            whileHover={isCustomizing ? { scale: 1.01 } : {}}
          >
            {isCustomizing && (
              <div className="absolute top-2 right-2 flex space-x-1">
                <button
                  onClick={() => removeWidget(widget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 bg-white rounded shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
            
            <h3 className="text-lg font-semibold text-gray-900 mb-4">{widget.title}</h3>
            <div className="space-y-3">
              {widget.data?.activities?.map((activity: { user: string; action: string; target: string; time: string }, index: number) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 text-xs font-bold">
                      {activity.user.split(' ').map((n: string) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span> {activity.action}{' '}
                      <span className="font-medium">{activity.target}</span>
                    </p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Customization Controls */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-indigo-900">Dashboard Özelleştirme</h3>
                <p className="text-sm text-indigo-700">Widget'ları sürükle-bırak ile yeniden düzenleyin</p>
              </div>
              <button
                onClick={onCustomizationEnd}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Tamamla
              </button>
            </div>

            {/* Available Widgets */}
            <div>
              <h4 className="text-sm font-medium text-indigo-900 mb-2">Eklenebilir Widget'lar</h4>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {availableWidgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => addWidget(widget)}
                    className="flex-shrink-0 px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm text-indigo-700 hover:bg-indigo-50 transition-colors"
                  >
                    + {widget.title}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Grid */}
      <div className="grid grid-cols-4 gap-6 auto-rows-fr">
        {widgets
          .filter(widget => widget.visible)
          .map(widget => renderWidget(widget))}
      </div>
    </div>
  );
}

// Customization Toggle Button
export function CustomizationToggle({ isCustomizing, onToggle }: { isCustomizing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        isCustomizing
          ? 'bg-red-100 text-red-700 hover:bg-red-200'
          : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
      }`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
          d={isCustomizing 
            ? "M6 18L18 6M6 6l12 12" 
            : "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m0 4v2m0-6V4"
          } 
        />
      </svg>
      <span>{isCustomizing ? 'Özelleştirmeyi Bitir' : 'Dashboard Özelleştir'}</span>
    </button>
  );
}