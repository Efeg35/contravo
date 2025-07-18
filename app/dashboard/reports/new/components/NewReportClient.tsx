'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TableReport, BarChartReport, LineChartReport } from './visualizations';
import { saveReport } from '../actions';

// Veri kaynağı seçenekleri
const DATA_SOURCES = [
  { value: 'contracts', label: 'Sözleşmeler', description: 'Sözleşme verileri ve analizleri' },
  { value: 'users', label: 'Kullanıcılar', description: 'Kullanıcı aktiviteleri ve istatistikleri' },
  { value: 'teams', label: 'Takımlar', description: 'Takım performansı ve işbirliği metrikleri' }
];

// Field types ve operatörleri
const FIELD_TYPES = {
  text: 'text',
  number: 'number', 
  date: 'date',
  boolean: 'boolean',
  select: 'select'
};

const OPERATORS = {
  text: [
    { value: 'contains', label: 'İçerir' },
    { value: 'equals', label: 'Eşittir' },
    { value: 'startsWith', label: 'İle başlar' },
    { value: 'endsWith', label: 'İle biter' },
    { value: 'notEquals', label: 'Eşit değil' }
  ],
  number: [
    { value: 'equals', label: 'Eşittir' },
    { value: 'gt', label: 'Büyüktür' },
    { value: 'gte', label: 'Büyük eşittir' },
    { value: 'lt', label: 'Küçüktür' },
    { value: 'lte', label: 'Küçük eşittir' },
    { value: 'notEquals', label: 'Eşit değil' }
  ],
  date: [
    { value: 'equals', label: 'Eşittir' },
    { value: 'gt', label: 'Sonra' },
    { value: 'gte', label: 'Bu tarih ve sonrası' },
    { value: 'lt', label: 'Önce' },
    { value: 'lte', label: 'Bu tarih ve öncesi' }
  ],
  boolean: [
    { value: 'equals', label: 'Eşittir' }
  ],
  select: [
    { value: 'equals', label: 'Eşittir' },
    { value: 'notEquals', label: 'Eşit değil' }
  ]
};

// Alanların türlerini belirle
const FIELD_META = {
  contracts: {
    title: { type: 'text' },
    status: { type: 'select', options: ['DRAFT', 'PENDING', 'APPROVED', 'SIGNED', 'EXPIRED', 'CANCELLED'] },
    expirationDate: { type: 'date' },
    createdAt: { type: 'date' },
    author: { type: 'text' },
    company: { type: 'text' },
    value: { type: 'number' },
    category: { type: 'select', options: ['LEGAL', 'PROCUREMENT', 'HR', 'FINANCE', 'SALES', 'MARKETING'] }
  },
  users: {
    name: { type: 'text' },
    email: { type: 'text' },
    role: { type: 'select', options: ['ADMIN', 'EDITOR', 'VIEWER'] },
    createdAt: { type: 'date' },
    lastLogin: { type: 'date' },
    isActive: { type: 'boolean' }
  },
  teams: {
    name: { type: 'text' },
    memberCount: { type: 'number' },
    createdAt: { type: 'date' },
    lead: { type: 'text' },
    department: { type: 'select', options: ['LEGAL', 'PROCUREMENT', 'HR', 'FINANCE', 'SALES', 'MARKETING'] }
  }
};

// Filter interface
interface Filter {
  id: string;
  field: string;
  operator: string;
  value: string;
}

// Props interface
interface NewReportClientProps {
  initialDataSource: string;
  initialFields: string[];
  initialFilters: Filter[];
  initialVisualization?: string;
  reportData: any[];
  availableFields: any;
}

// Field Selector Component
function FieldSelector({ 
  dataSource, 
  selectedFields, 
  onFieldsChange,
  availableFields
}: { 
  dataSource: string;
  selectedFields: string[];
  onFieldsChange: (fields: string[]) => void;
  availableFields: any;
}) {
  const fieldOptions = availableFields[dataSource] || [];

  const handleFieldToggle = (fieldKey: string) => {
    const updatedFields = selectedFields.includes(fieldKey)
      ? selectedFields.filter(f => f !== fieldKey)
      : [...selectedFields, fieldKey];
    
    onFieldsChange(updatedFields);
  };

  if (!dataSource) return null;

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-4">
        2. Rapor Sütunlarını Seçin
      </label>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {fieldOptions.map((field: any) => (
          <div 
            key={field.key}
            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
          >
            <div className="flex items-center h-5">
              <input
                id={`field-${field.key}`}
                type="checkbox"
                checked={selectedFields.includes(field.key)}
                onChange={() => handleFieldToggle(field.key)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>
            <div className="flex-1 min-w-0">
              <label 
                htmlFor={`field-${field.key}`}
                className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
              >
                {field.label}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {field.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {selectedFields.length > 0 && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/50 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            <span className="font-medium">{selectedFields.length}</span> sütun seçildi
          </p>
        </div>
      )}
    </div>
  );
}

// Filter Component
function FilterSelector({
  dataSource,
  filters,
  onFiltersChange,
  availableFields
}: {
  dataSource: string;
  filters: Filter[];
  onFiltersChange: (filters: Filter[]) => void;
  availableFields: any;
}) {
  const fieldOptions = availableFields[dataSource] || [];

  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: '',
      operator: '',
      value: ''
    };
    onFiltersChange([...filters, newFilter]);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    const updatedFilters = filters.map(filter => 
      filter.id === id ? { ...filter, ...updates } : filter
    );
    onFiltersChange(updatedFilters);
  };

  const removeFilter = (id: string) => {
    onFiltersChange(filters.filter(filter => filter.id !== id));
  };

  const getFieldType = (fieldKey: string) => {
    const source = FIELD_META[dataSource as keyof typeof FIELD_META];
    if (!source) return 'text';
    const field = source[fieldKey as keyof typeof source];
    return field?.type || 'text';
  };

  const getFieldOptions = (fieldKey: string) => {
    const source = FIELD_META[dataSource as keyof typeof FIELD_META];
    if (!source) return [];
    const field = source[fieldKey as keyof typeof source];
    return (field as any)?.options || [];
  };

  const getOperators = (fieldType: string) => {
    return OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.text;
  };

  if (!dataSource) return null;

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <label className="block text-sm font-medium text-gray-900 dark:text-white">
          3. Filtreler
        </label>
        <button
          onClick={addFilter}
          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
        >
          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Filtre Ekle
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filters.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <p className="text-sm">Henüz filtre eklenmemiş</p>
            <p className="text-xs mt-1">Filtreleme yapmak için "Filtre Ekle" butonuna tıklayın</p>
          </div>
        ) : (
          filters.map((filter, index) => (
            <div key={filter.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Filtre {index + 1}
                </span>
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {/* Field Selection */}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, { 
                    field: e.target.value, 
                    operator: '', 
                    value: '' 
                  })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Alan seçin...</option>
                  {fieldOptions.map((field: any) => (
                    <option key={field.key} value={field.key}>
                      {field.label}
                    </option>
                  ))}
                </select>

                {/* Operator Selection */}
                {filter.field && (
                  <select
                    value={filter.operator}
                    onChange={(e) => updateFilter(filter.id, { 
                      operator: e.target.value,
                      value: '' 
                    })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Operatör seçin...</option>
                    {getOperators(getFieldType(filter.field)).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Value Input */}
                {filter.field && filter.operator && (
                  <>
                    {getFieldType(filter.field) === 'select' ? (
                      <select
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Değer seçin...</option>
                        {getFieldOptions(filter.field).map((option: string) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : getFieldType(filter.field) === 'boolean' ? (
                      <select
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Değer seçin...</option>
                        <option value="true">Evet</option>
                        <option value="false">Hayır</option>
                      </select>
                    ) : (
                      <input
                        type={getFieldType(filter.field) === 'date' ? 'date' : getFieldType(filter.field) === 'number' ? 'number' : 'text'}
                        value={filter.value}
                        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                        placeholder="Değer girin..."
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {filters.length > 0 && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <span className="font-medium">{filters.filter(f => f.field && f.operator && f.value).length}</span> aktif filtre
          </p>
        </div>
      )}
    </div>
  );
}

// Visualization Selector Component
function VisualizationSelector({
  dataSource,
  selectedFields,
  selectedVisualization,
  onVisualizationChange,
  availableFields
}: {
  dataSource: string;
  selectedFields: string[];
  selectedVisualization: string;
  onVisualizationChange: (viz: string) => void;
  availableFields: any;
}) {
  const fieldOptions = availableFields[dataSource] || [];
  
  // Seçilen alanlarda sayısal veya tarihsel veri var mı kontrol et
  const hasNumericOrDateFields = selectedFields.some(fieldKey => {
    const fieldMeta = FIELD_META[dataSource as keyof typeof FIELD_META];
    const fieldType = fieldMeta?.[fieldKey as keyof typeof fieldMeta]?.type;
    return fieldType === 'number' || fieldType === 'date';
  });

  const visualizationOptions = [
    {
      key: 'table',
      label: 'Tablo',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h3M7 3v18M17 3v18m0 0h3a1 1 0 001-1V4a1 1 0 00-1-1h-3" />
        </svg>
      ),
      disabled: false,
      tooltip: 'Verileri tablo formatında göster'
    },
    {
      key: 'bar',
      label: 'Bar Grafik',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      disabled: !hasNumericOrDateFields,
      tooltip: hasNumericOrDateFields 
        ? 'Verileri bar grafik formatında göster'
        : 'Grafik oluşturmak için en az bir sayısal veya tarihsel alan seçmelisiniz'
    },
    {
      key: 'line',
      label: 'Çizgi Grafik',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      ),
      disabled: !hasNumericOrDateFields,
      tooltip: hasNumericOrDateFields 
        ? 'Verileri çizgi grafik formatında göster'
        : 'Grafik oluşturmak için en az bir sayısal veya tarihsel alan seçmelisiniz'
    }
  ];

  if (!dataSource) return null;

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <label className="block text-sm font-medium text-gray-900 dark:text-white mb-4">
        3. Görselleştirme Türü
      </label>
      
      <div className="grid grid-cols-3 gap-3">
        {visualizationOptions.map((option) => (
          <div key={option.key} className="relative group">
            <button
              type="button"
              disabled={option.disabled}
              onClick={() => !option.disabled && onVisualizationChange(option.key)}
              className={`
                w-full p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center space-y-2
                ${selectedVisualization === option.key
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                  : option.disabled
                    ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:hover:text-blue-300'
                }
              `}
            >
              <div className={`
                ${selectedVisualization === option.key
                  ? 'text-blue-600 dark:text-blue-400'
                  : option.disabled
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                }
              `}>
                {option.icon}
              </div>
              <span className="text-xs font-medium text-center">
                {option.label}
              </span>
              
              {/* Aktif işareti */}
              {selectedVisualization === option.key && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white dark:border-gray-800">
                  <div className="w-full h-full bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              )}
            </button>
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
              {option.tooltip}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedVisualization && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700/50 rounded-lg">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            <span className="font-medium">
              {visualizationOptions.find(v => v.key === selectedVisualization)?.label}
            </span> görselleştirme seçildi
          </p>
        </div>
      )}
    </div>
  );
}

// Export URL oluşturucu
function createExportUrl(format: string, dataSource: string, fields: string[], filters: Filter[]): string {
  const params = new URLSearchParams();
  params.set('dataSource', dataSource);
  params.set('fields', fields.join(','));
  
  // Sadece tamamlanmış filtreleri ekle
  const completeFilters = filters.filter(f => f.field && f.operator && f.value);
  if (completeFilters.length > 0) {
    const filtersString = JSON.stringify(completeFilters);
    params.set('filters', encodeURIComponent(filtersString));
  }
  
  return `/api/reports/export/${format}?${params.toString()}`;
}

// PDF indirme fonksiyonu
async function downloadPDF(dataSource: string, fields: string[], filters: Filter[]) {
  try {
    // Filtreleri API formatına çevir
    const apiFilters: any = {};
    
    // Basit filtre dönüşümü (daha karmaşık bir yapı gerekebilir)
    filters.forEach(filter => {
      if (filter.field && filter.value) {
        if (filter.field.includes('Date') || filter.field.includes('At')) {
          // Tarih filtreleri için date range yapısı
          if (!apiFilters.dateRange) {
            apiFilters.dateRange = {};
          }
          if (filter.operator === 'gte' || filter.operator === 'gt') {
            apiFilters.dateRange.from = filter.value;
          } else if (filter.operator === 'lte' || filter.operator === 'lt') {
            apiFilters.dateRange.to = filter.value;
          }
        } else if (filter.field === 'status') {
          // Durum filtreleri
          if (!apiFilters.status) {
            apiFilters.status = [];
          }
          apiFilters.status.push(filter.value);
        } else if (filter.field === 'company') {
          // Şirket filtreleri
          if (!apiFilters.companies) {
            apiFilters.companies = [];
          }
          apiFilters.companies.push(filter.value);
        }
      }
    });

    const requestBody = {
      title: `${dataSource === 'contracts' ? 'Sözleşme' : 'Madde'} Raporu`,
      dataSource: dataSource === 'contracts' ? 'contracts' : 'clauses',
      fields,
      filters: apiFilters,
      sortBy: {
        field: 'createdAt',
        direction: 'desc' as const
      }
    };

    const response = await fetch('/api/reports/download', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'PDF oluşturulurken bir hata oluştu');
    }

    // PDF'i blob olarak al
    const blob = await response.blob();
    
    // Dosya adını oluştur
    const sanitizedDataSource = dataSource === 'contracts' ? 'sozlesmeler' : 'maddeler';
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `${sanitizedDataSource}_raporu_${timestamp}.pdf`;
    
    // İndirme işlemi
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    // Başarı mesajı göster
    alert('PDF başarıyla indirildi!');
    
  } catch (error) {
    console.error('PDF indirme hatası:', error);
    alert(error instanceof Error ? error.message : 'PDF indirirken bir hata oluştu');
  }
}

// Veri tablosunu format et


export default function NewReportClient({ 
  initialDataSource, 
  initialFields, 
  initialFilters, 
  initialVisualization = 'table',
  reportData, 
  availableFields 
}: NewReportClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedDataSource, setSelectedDataSource] = useState<string>(initialDataSource);
  const [selectedFields, setSelectedFields] = useState<string[]>(initialFields);
  const [filters, setFilters] = useState<Filter[]>(initialFilters);
  const [selectedVisualization, setSelectedVisualization] = useState<string>(initialVisualization);
  
  // Modal state'leri
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Veri kaynağı değiştiğinde URL'yi güncelle ve alanları temizle
  const handleDataSourceChange = (dataSource: string) => {
    setSelectedDataSource(dataSource);
    setSelectedFields([]);
    setFilters([]);
    setSelectedVisualization('table');
    
    const params = new URLSearchParams(searchParams.toString());
    if (dataSource) {
      params.set('dataSource', dataSource);
      params.delete('fields'); // Yeni veri kaynağı seçildiğinde alanları temizle
      params.delete('filters'); // Filtreleri de temizle
    } else {
      params.delete('dataSource');
      params.delete('fields');
      params.delete('filters');
    }
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  // Seçili alanlar değiştiğinde URL'yi güncelle
  const handleFieldsChange = (fields: string[]) => {
    setSelectedFields(fields);
    
    const params = new URLSearchParams(searchParams.toString());
    if (fields.length > 0) {
      params.set('fields', fields.join(','));
    } else {
      params.delete('fields');
    }
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  // Filtreler değiştiğinde URL'yi güncelle
  const handleFiltersChange = (newFilters: Filter[]) => {
    setFilters(newFilters);
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Sadece tamamlanmış filtreleri URL'e ekle
    const completeFilters = newFilters.filter(f => f.field && f.operator && f.value);
    
    if (completeFilters.length > 0) {
      const filtersString = JSON.stringify(completeFilters);
      params.set('filters', encodeURIComponent(filtersString));
    } else {
      params.delete('filters');
    }
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  // Görselleştirme seçimi değiştiğinde URL'yi güncelle
  const handleVisualizationChange = (viz: string) => {
    setSelectedVisualization(viz);
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('visualization', viz);
    
    router.push(`/dashboard/reports/new?${params.toString()}`);
  };

  // Raporu kaydet
  const handleSaveReport = async () => {
    if (!reportName.trim()) return;
    
    setIsSaving(true);
    
    try {
      // URL'den tüm configuration'ı al
      const configuration = {
        dataSource: selectedDataSource,
        fields: selectedFields,
        filters: filters,
        visualization: selectedVisualization,
        // Zamanlama bilgisini de ekle
        savedAt: new Date().toISOString()
      };
      
      await saveReport(reportName.trim(), reportDescription.trim() || null, configuration);
      
      // Modal'ı kapat ve form'u temizle
      setShowSaveModal(false);
      setReportName('');
      setReportDescription('');
      
      // Başarı mesajı (toast olarak gösterilebilir)
      alert('Rapor başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving report:', error);
      alert('Rapor kaydedilirken bir hata oluştu.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 min-h-[calc(100vh-240px)]">
      
      {/* Sol Sütun - Kontrol Paneli (Dar) */}
      <div className="lg:col-span-1">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg sticky top-8">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Kontrol Paneli</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rapor ayarları</p>
              </div>
            </div>

            {/* Veri Kaynağı Seçimi */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
                  1. Rapor Verisini Seçin
                </label>
                <select
                  value={selectedDataSource}
                  onChange={(e) => handleDataSourceChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  <option value="">Veri kaynağı seçin...</option>
                  {DATA_SOURCES.map((source) => (
                    <option key={source.value} value={source.value}>
                      {source.label}
                    </option>
                  ))}
                </select>
                
                {/* Seçilen veri kaynağının açıklaması */}
                {selectedDataSource && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {DATA_SOURCES.find(s => s.value === selectedDataSource)?.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Field Selector */}
              <FieldSelector 
                dataSource={selectedDataSource}
                selectedFields={selectedFields}
                onFieldsChange={handleFieldsChange}
                availableFields={availableFields}
              />

              {/* Filter Selector */}
              <FilterSelector
                dataSource={selectedDataSource}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableFields={availableFields}
              />

              {/* Visualization Selector */}
              <VisualizationSelector
                dataSource={selectedDataSource}
                selectedFields={selectedFields}
                selectedVisualization={selectedVisualization}
                onVisualizationChange={handleVisualizationChange}
                availableFields={availableFields}
              />

              {/* Gelecek adımlar için placeholder */}
              {selectedDataSource && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-400 dark:text-gray-500">
                      <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3">
                        <span className="text-xs font-medium">4</span>
                      </div>
                      Sırala & Dışa Aktar
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sağ Sütun - Önizleme Alanı (Geniş) */}
      <div className="lg:col-span-3">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border border-slate-200/60 dark:border-gray-700/40 shadow-lg h-full min-h-[600px]">
          <div className="p-8 h-full flex flex-col">
            
            {/* Önizleme Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Canlı Önizleme</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Raporunuzun gerçek zamanlı görünümü</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                {selectedDataSource && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label}
                    </span>
                  </div>
                )}
                
                {/* Ana Rapor Oluştur Butonu */}
                {selectedDataSource && selectedFields.length > 0 && reportData.length > 0 && (
                  <div className="flex items-center space-x-3">
                    {/* Raporu Kaydet Butonu */}
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Raporu Kaydet
                    </button>
                    
                    {/* Ana Rapor Oluştur Butonu */}
                    <a
                      href={createExportUrl('csv', selectedDataSource, selectedFields, filters)}
                      download
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Raporu Oluştur (CSV)
                    </a>
                    
                    {/* Ek Export Seçenekleri */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadPDF(selectedDataSource, selectedFields, filters)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                        title="PDF olarak indir"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF Olarak İndir
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Önizleme İçeriği */}
            <div className="flex-1 flex items-center justify-center">
              {selectedDataSource ? (
                selectedFields.length > 0 ? (
                  // Seçilen görselleştirme türüne göre bileşen göster
                  <div className="w-full">
                    {(() => {
                      switch (selectedVisualization) {
                        case 'bar':
                          return <BarChartReport 
                            data={reportData} 
                            selectedFields={selectedFields}
                            availableFields={availableFields}
                            dataSource={selectedDataSource}
                          />;
                        case 'line':
                          return <LineChartReport 
                            data={reportData} 
                            selectedFields={selectedFields}
                            availableFields={availableFields}
                            dataSource={selectedDataSource}
                          />;
                        default:
                          return <TableReport 
                            data={reportData} 
                            selectedFields={selectedFields}
                            availableFields={availableFields}
                            dataSource={selectedDataSource}
                          />;
                      }
                    })()}
                  </div>
                ) : (
                  // Veri kaynağı seçildi ama sütunlar seçilmedi
                  <div className="text-center space-y-6">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
                      <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                        {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label} Raporu
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                        Lütfen raporda görmek istediğiniz sütunları soldaki menüden seçin
                      </p>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                      <div className="flex items-center justify-center space-x-2 text-gray-500 dark:text-gray-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="text-sm">Sütun seçimi bekleniyor...</span>
                      </div>
                    </div>
                  </div>
                )
              ) : (
                // Hiç veri kaynağı seçilmedi
                <div className="text-center space-y-6">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-medium text-gray-500 dark:text-gray-400 mb-2">
                      Rapor Önizlemesi
                    </h3>
                    <p className="text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                      Lütfen rapor oluşturmak için sol panelden bir veri kaynağı seçin
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 max-w-md mx-auto">
                    <div className="flex items-center justify-center space-x-2 text-gray-400 dark:text-gray-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm">Başlamak için veri kaynağı seçin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Save Report Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Raporu Kaydet
                </h3>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rapor Adı *
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    placeholder="Rapor için bir isim girin..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Açıklama (İsteğe bağlı)
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    placeholder="Rapor hakkında kısa bir açıklama..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                {/* Rapor Özeti */}
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rapor Özeti:
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p><strong>Veri Kaynağı:</strong> {DATA_SOURCES.find(s => s.value === selectedDataSource)?.label}</p>
                    <p><strong>Sütunlar:</strong> {selectedFields.length} adet</p>
                    <p><strong>Filtreler:</strong> {filters.filter(f => f.field && f.operator && f.value).length} adet</p>
                    <p><strong>Görselleştirme:</strong> {selectedVisualization === 'table' ? 'Tablo' : selectedVisualization === 'bar' ? 'Bar Chart' : 'Line Chart'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowSaveModal(false);
                    setReportName('');
                    setReportDescription('');
                  }}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveReport}
                  disabled={!reportName.trim() || isSaving}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-400 text-white rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Kaydediliyor...</span>
                    </div>
                  ) : (
                    'Kaydet'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 