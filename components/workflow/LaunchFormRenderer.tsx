"use client";

import React, { useState } from "react";
import { ConditionEditorModal } from './ConditionEditorModal';
import { addDisplayConditionToField } from '../../src/lib/actions/workflow-template-actions';

interface FormField {
  id: string;
  label: string;
  apiKey: string;
  type: string;
  isRequired?: boolean;
  placeholder?: string;
  options?: any;
  order?: number;
  minLength?: number;
  maxLength?: number;
  minValue?: number;
  maxValue?: number;
  pattern?: string;
  customError?: string;
  dependsOn?: string;
  dependsOnValue?: string;
  helpText?: string;
}

interface LaunchFormRendererProps {
  formFields: FormField[];
  layout: any;
  formData?: Record<string, any>;
  setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  displayConditions?: Record<string, any>;
}

const getSortedFields = (fields: FormField[], layout: any) => {
  if (!layout || !Array.isArray(layout.fieldOrder)) return fields.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  // layout.fieldOrder: [fieldId1, fieldId2, ...]
  const orderMap = new Map(layout.fieldOrder.map((id: string, idx: number) => [id, idx]));
  return [...fields].sort((a, b) => Number(orderMap.get(a.id) ?? 999) - Number(orderMap.get(b.id) ?? 999));
};

const LaunchFormRenderer: React.FC<LaunchFormRendererProps> = ({ formFields, layout, formData, setFormData, displayConditions }) => {
  const sortedFields = getSortedFields(formFields, layout);

  const [selectedConditionField, setSelectedConditionField] = useState<FormField | null>(null);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);

  const handleChange = (apiKey: string, value: any) => {
    if (setFormData) {
      setFormData((prev) => ({ ...prev, [apiKey]: value }));
    }
  };

  const handleAddCondition = (field: FormField) => {
    setSelectedConditionField(field);
    setIsConditionModalOpen(true);
  };

  const handleConditionSave = async (condition: any) => {
    if (!selectedConditionField) return;
    // stepId ileride parent'tan alınacak, şimdilik boş string
    await addDisplayConditionToField({
      fieldId: selectedConditionField.id,
      field: condition.property,
      operator: condition.operator,
      value: condition.value ?? '',
      stepId: ''
    });
    setIsConditionModalOpen(false);
    setSelectedConditionField(null);
  };

  const handleConditionClose = () => {
    setIsConditionModalOpen(false);
    setSelectedConditionField(null);
  };

  // Section ve alanları render eden yardımcı fonksiyonlar
  const renderField = (field: FormField) => {
    const value = formData?.[field.apiKey] ?? "";
    const dc = displayConditions && displayConditions[field.id];
    const conditionSummary = dc ? (
      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        Gösterim kuralı: {dc.field} {dc.operator} {dc.value}
      </span>
    ) : null;
    const labelWithCondition = (
      <div className="flex items-center gap-2">
        <span>{field.label}{field.isRequired && <span className="text-red-500">*</span>}</span>
        <button type="button" className="text-blue-500 hover:text-blue-700 text-xs underline" onClick={() => handleAddCondition(field)}>
          Koşul Ekle
        </button>
        {conditionSummary}
      </div>
    );
    switch (field.type) {
      case "TEXT":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              minLength={field.minLength}
              maxLength={field.maxLength}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "EMAIL":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="email"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder || "ornek@email.com"}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "URL":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="url"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder || "https://example.com"}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "PHONE":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="tel"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder || "+90 555 123 45 67"}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "CHECKBOX":
        return (
          <div key={field.id}>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded"
                required={field.isRequired}
                checked={Boolean(value)}
                onChange={e => handleChange(field.apiKey, e.target.checked)}
              />
              <span className="text-sm font-medium">{field.label}{field.isRequired && <span className="text-red-500">*</span>}</span>
            </label>
            {field.helpText && <p className="text-xs text-gray-500 mt-1 ml-6">{field.helpText}</p>}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="file"
              className="w-full px-3 py-2 border rounded-md"
              required={field.isRequired}
              onChange={e => {
                const file = e.target.files?.[0];
                handleChange(field.apiKey, file);
              }}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "USER_PICKER":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
            >
              <option value="">Kullanıcı Seçiniz</option>
              {(Array.isArray(field.options) ? field.options : [])
                .map((user: any, i: number) => (
                  <option key={i} value={user.id || user.value}>{user.name || user.label}</option>
                ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "DATE_RANGE":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className="px-3 py-2 border rounded-md"
                placeholder="Başlangıç"
                required={field.isRequired}
                value={value?.start || ""}
                onChange={e => handleChange(field.apiKey, { ...value, start: e.target.value })}
              />
              <input
                type="date"
                className="px-3 py-2 border rounded-md"
                placeholder="Bitiş"
                required={field.isRequired}
                value={value?.end || ""}
                onChange={e => handleChange(field.apiKey, { ...value, end: e.target.value })}
              />
            </div>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "TEXTAREA":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <textarea
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              rows={4}
              minLength={field.minLength}
              maxLength={field.maxLength}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "NUMBER":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="number"
              className="w-full px-3 py-2 border rounded-md"
              placeholder={field.placeholder}
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value === "" ? "" : Number(e.target.value))}
              min={field.minValue}
              max={field.maxValue}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "DATE":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-md"
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "SINGLE_SELECT":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              required={field.isRequired}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
            >
              <option value="">Seçiniz</option>
              {(Array.isArray(field.options) ? field.options : [])
                .map((opt: any, i: number) => (
                  <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "MULTI_SELECT":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              required={field.isRequired}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={e => {
                const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                handleChange(field.apiKey, selected);
              }}
            >
              {(Array.isArray(field.options) ? field.options : [])
                .map((opt: any, i: number) => (
                  <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
          </div>
        );
      case "TABLE":
        return (
          <div key={field.id} className="border p-4 rounded bg-gray-50 text-gray-700">
            <div className="font-semibold mb-2 flex items-center gap-2">
              {labelWithCondition}
              <span className="text-xs text-gray-400 ml-2">(Table)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-sm">
                <thead>
                  <tr>
                    {(Array.isArray(field.options) ? field.options : []).map((col: any, i: number) => (
                      <th key={i} className="border px-3 py-1 bg-gray-100 text-gray-700 font-medium">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {(Array.isArray(field.options) ? field.options : []).map((col: any, i: number) => (
                      <td key={i} className="border px-3 py-1 text-gray-400">Örnek veri</td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {field.placeholder && <div className="text-xs text-gray-500 mt-2">{field.placeholder}</div>}
          </div>
        );
      default:
        return (
          <div key={field.id} className="text-red-500 text-xs">
            {labelWithCondition} (Bilinmeyen alan tipi: {field.type})
          </div>
        );
    }
  };

  // Section ve alanları modern şekilde render et
  const renderForm = () => {
    if (!layout || !Array.isArray(layout.fieldOrder)) {
      // Sadece alanları sırayla göster
      return getSortedFields(formFields, layout).map(renderField);
    }
    // Section ve alanları ayır
    const sectionFields: string[] = [];
    const sections = layout.fieldOrder.filter((item: any) => item.type === 'section');
    const sectionMap: Record<string, any> = {};
    sections.forEach((section: any) => {
      sectionMap[section.id] = section;
      (section.fields || []).forEach((fid: string) => sectionFields.push(fid));
    });
    // Section dışında kalan fieldId'ler
    const topLevelFields = layout.fieldOrder.filter((item: any) => typeof item === 'string' && !sectionFields.includes(item));
    return (
      <>
        {/* Section olmayan alanlar */}
        {topLevelFields.map((fid: string) => {
          const field = formFields.find(f => f.id === fid);
          return field ? renderField(field) : null;
        })}
        {/* Sectionlar */}
        {sections.map((section: any) => (
          <div key={section.id} className="mt-8 mb-6 border rounded-lg bg-gray-50 p-6">
            <div className="mb-2">
              <div className="text-lg font-bold text-gray-800">{section.name}</div>
              {section.description && <div className="text-gray-500 text-sm mt-1">{section.description}</div>}
            </div>
            <div className="space-y-4">
              {(section.fields || []).map((fid: string) => {
                const field = formFields.find(f => f.id === fid);
                return field ? renderField(field) : null;
              })}
            </div>
          </div>
        ))}
      </>
    );
  };

  if (!formFields || formFields.length === 0) {
    return <div className="text-gray-500 text-sm">Bu şablona ait özel bir başlatma formu yok.</div>;
  }

  return (
    <>
      <form className="space-y-4">
        {renderForm()}
        <div className="mt-4">
          <div className="text-xs text-gray-500 mb-1">Form verisi (JSON):</div>
          <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </form>
      <ConditionEditorModal
        isOpen={isConditionModalOpen}
        onClose={handleConditionClose}
        onSave={handleConditionSave}
        condition={null}
        properties={formFields.map(f => ({
          id: f.id,
          name: f.label,
          required: !!f.isRequired,
          type: f.type as import('@/types/workflow').PropertyType,
          options: f.options || [],
        }))}
      />
    </>
  );
};

export default LaunchFormRenderer; 