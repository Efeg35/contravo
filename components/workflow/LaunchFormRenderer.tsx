"use client";

import React, { useState, useEffect, useCallback } from "react";
import { ConditionEditorModal } from './ConditionEditorModal';
import { addDisplayConditionToField } from '../../src/lib/actions/workflow-template-actions';
import { formValidationEngine } from '../../lib/form-validation';
import { 
  ValidationRule, 
  ConditionalRule, 
  FieldValidationState, 
  FormValidationState,
  FieldCondition,
  FormSection,
  SectionDisplayMode 
} from '../../types/workflow';

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
  
  // Sprint 2: Enhanced validation and rules
  isConditional?: boolean;
  validationRules?: ValidationRule[];
  defaultValue?: string;
  isReadOnly?: boolean;
  isHidden?: boolean;
  showWhen?: FieldCondition[];
  hideWhen?: FieldCondition[];
  validateWhen?: FieldCondition[];
  errorMessage?: string;
  warningMessage?: string;
  successMessage?: string;
  fieldGroup?: string; // DEPRECATED: Use sectionId instead
  priority?: number;
  realTimeValidation?: boolean;
  
  // Sprint 4: Section/Grup support
  sectionId?: string;
}

interface LaunchFormRendererProps {
  formFields: FormField[];
  layout: any;
  formData?: Record<string, any>;
  setFormData?: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  displayConditions?: Record<string, any>;
  conditionalRules?: ConditionalRule[];
  enableRealTimeValidation?: boolean;
  validationMode?: 'SUBMIT' | 'BLUR' | 'CHANGE' | 'REAL_TIME';
  showValidationSummary?: boolean;
  onValidationChange?: (validation: FormValidationState) => void;
  
  // Sprint 4: Section/Grup support
  sections?: FormSection[];
  sectionLayout?: {
    displayMode: 'SINGLE_COLUMN' | 'TWO_COLUMN' | 'THREE_COLUMN' | 'CUSTOM';
    enableSectionNavigation: boolean;
    enableProgressIndicator: boolean;
    allowSectionCollapse: boolean;
  };
}

const getSortedFields = (fields: FormField[], layout: any) => {
  if (!layout || !Array.isArray(layout.fieldOrder)) return fields.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0));
  // layout.fieldOrder: [fieldId1, fieldId2, ...]
  const orderMap = new Map(layout.fieldOrder.map((id: string, idx: number) => [id, idx]));
  return [...fields].sort((a, b) => Number(orderMap.get(a.id) ?? 999) - Number(orderMap.get(b.id) ?? 999));
};

const LaunchFormRenderer: React.FC<LaunchFormRendererProps> = ({ 
  formFields, 
  layout, 
  formData = {}, 
  setFormData, 
  displayConditions,
  conditionalRules = [],
  enableRealTimeValidation = false,
  validationMode = 'SUBMIT',
  showValidationSummary = true,
  onValidationChange,
  
  // Sprint 4: Section/Grup support
  sections,
  sectionLayout
}) => {
  const sortedFields = getSortedFields(formFields, layout);

  const [selectedConditionField, setSelectedConditionField] = useState<FormField | null>(null);
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  
  // Sprint 2: Validation state
  const [fieldValidations, setFieldValidations] = useState<{ [fieldId: string]: FieldValidationState }>({});
  const [visibleFields, setVisibleFields] = useState<Set<string>>(new Set(formFields.map(f => f.id)));
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set(formFields.filter(f => f.isRequired).map(f => f.id)));
  const [readOnlyFields, setReadOnlyFields] = useState<Set<string>>(new Set(formFields.filter(f => f.isReadOnly).map(f => f.id)));

  // Sprint 4: Section state
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set(sections?.filter(s => !s.isExpanded).map(s => s.id) || [])
  );
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    sections && sections.length > 0 ? sections[0].id : null
  );

  // Sprint 2: Field validation hook
  const validateField = useCallback((field: FormField, value: any) => {
    if (!field.validationRules || field.validationRules.length === 0) {
      return {
        isValid: true,
        isDirty: false,
        isTouched: false,
        errors: [],
        warnings: [],
        isValidating: false
      };
    }

    return formValidationEngine.validateField(value, field.validationRules, formData);
  }, [formData]);

  // Sprint 2: Conditional rules evaluation
  const evaluateConditionalRules = useCallback(() => {
    if (conditionalRules.length === 0) return;

    const result = formValidationEngine.evaluateConditionalRules(conditionalRules, formData);
    
    // Update visible fields
    const newVisibleFields = new Set(visibleFields);
    result.fieldsToShow.forEach(fieldId => newVisibleFields.add(fieldId));
    result.fieldsToHide.forEach(fieldId => newVisibleFields.delete(fieldId));
    setVisibleFields(newVisibleFields);

    // Update required fields
    const newRequiredFields = new Set(requiredFields);
    result.fieldsToRequire.forEach(fieldId => newRequiredFields.add(fieldId));
    result.fieldsToUnrequire.forEach(fieldId => newRequiredFields.delete(fieldId));
    setRequiredFields(newRequiredFields);

    // Set field values
    if (Object.keys(result.valuesToSet).length > 0 && setFormData) {
      setFormData(prev => ({ ...prev, ...result.valuesToSet }));
    }

    // Validate specific fields
    if (result.fieldsToValidate.length > 0) {
      result.fieldsToValidate.forEach(fieldId => {
        const field = formFields.find(f => f.id === fieldId);
        if (field) {
          const validation = validateField(field, formData[field.apiKey]);
          setFieldValidations(prev => ({ ...prev, [fieldId]: validation }));
        }
      });
    }
  }, [conditionalRules, formData, visibleFields, requiredFields, formFields, validateField, setFormData]);

  // Sprint 2: Real-time validation effect
  useEffect(() => {
    if (enableRealTimeValidation || validationMode === 'REAL_TIME') {
      evaluateConditionalRules();
      
      // Validate all visible fields
      const newValidations: { [fieldId: string]: FieldValidationState } = {};
      formFields.forEach(field => {
        if (visibleFields.has(field.id)) {
          newValidations[field.id] = validateField(field, formData[field.apiKey]);
        }
      });
      setFieldValidations(newValidations);

      // Notify parent of validation changes
      if (onValidationChange) {
        const formValidation: FormValidationState = {
          isValid: Object.values(newValidations).every(v => v.isValid),
          isDirty: Object.values(newValidations).some(v => v.isDirty),
          isSubmitting: false,
          fields: newValidations,
          globalErrors: [],
          globalWarnings: []
        };
        onValidationChange(formValidation);
      }
    }
  }, [formData, enableRealTimeValidation, validationMode, visibleFields, formFields, validateField, evaluateConditionalRules, onValidationChange]);

  const handleChange = (apiKey: string, value: any) => {
    if (setFormData) {
      setFormData((prev) => ({ ...prev, [apiKey]: value }));
    }

    // Sprint 2: Trigger validation on change if needed
    if (validationMode === 'CHANGE' || enableRealTimeValidation) {
      const field = formFields.find(f => f.apiKey === apiKey);
      if (field) {
        const validation = validateField(field, value);
        setFieldValidations(prev => ({ ...prev, [field.id]: validation }));
      }
    }
  };

  const handleBlur = (apiKey: string) => {
    // Sprint 2: Trigger validation on blur if needed
    if (validationMode === 'BLUR') {
      const field = formFields.find(f => f.apiKey === apiKey);
      if (field) {
        const validation = validateField(field, formData[field.apiKey]);
        setFieldValidations(prev => ({ ...prev, [field.id]: validation }));
      }
    }
  };

  // Sprint 4: Section helper functions
  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getFieldsBySection = () => {
    if (!sections || sections.length === 0) {
      return { ungrouped: formFields };
    }

    const grouped: { [sectionId: string]: FormField[] } = {};
    const ungrouped: FormField[] = [];

    // Initialize sections
    sections.forEach(section => {
      grouped[section.id] = [];
    });

    // Group fields by section
    formFields.forEach(field => {
      if (field.sectionId && grouped[field.sectionId]) {
        grouped[field.sectionId].push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { ...grouped, ungrouped };
  };

  const isSectionVisible = (section: FormSection): boolean => {
    if (section.visibilityCondition === 'NEVER') return false;
    if (section.visibilityCondition === 'ALWAYS') return true;
    
    // Check conditional visibility
    if (section.showWhen && section.showWhen.length > 0) {
      return formValidationEngine.evaluateConditions(section.showWhen, formData);
    }
    if (section.hideWhen && section.hideWhen.length > 0) {
      return !formValidationEngine.evaluateConditions(section.hideWhen, formData);
    }
    
    return true;
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

  // Sprint 2: Get field validation state
  const getFieldValidation = (fieldId: string): FieldValidationState => {
    return fieldValidations[fieldId] || {
      isValid: true,
      isDirty: false,
      isTouched: false,
      errors: [],
      warnings: [],
      isValidating: false
    };
  };

  // Sprint 2: Get validation CSS classes
  const getValidationClasses = (fieldId: string): string => {
    const validation = getFieldValidation(fieldId);
    if (!validation.isDirty && !validation.isTouched) return "border-gray-300";
    if (validation.errors.length > 0) return "border-red-500 bg-red-50";
    if (validation.warnings.length > 0) return "border-yellow-500 bg-yellow-50";
    if (validation.isValid) return "border-green-500 bg-green-50";
    return "border-gray-300";
  };

  // Sprint 2: Render validation messages
  const renderValidationMessages = (fieldId: string) => {
    const validation = getFieldValidation(fieldId);
    if (!validation.isDirty && !validation.isTouched) return null;

    return (
      <div className="mt-1">
        {validation.errors.map((error, index) => (
          <p key={`error-${index}`} className="text-xs text-red-600">{error}</p>
        ))}
        {validation.warnings.map((warning, index) => (
          <p key={`warning-${index}`} className="text-xs text-yellow-600">{warning}</p>
        ))}
      </div>
    );
  };

  // Section ve alanları render eden yardımcı fonksiyonlar
  const renderField = (field: FormField) => {
    // Sprint 2: Check if field should be visible
    if (!visibleFields.has(field.id) || field.isHidden) {
      return null;
    }

    const value = formData?.[field.apiKey] ?? field.defaultValue ?? "";
    const isFieldRequired = requiredFields.has(field.id) || field.isRequired;
    const isFieldReadOnly = readOnlyFields.has(field.id) || field.isReadOnly;
    const validationClasses = getValidationClasses(field.id);
    
    const dc = displayConditions && displayConditions[field.id];
    const conditionSummary = dc ? (
      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        Gösterim kuralı: {dc.field} {dc.operator} {dc.value}
      </span>
    ) : null;
    
    const labelWithCondition = (
      <div className="flex items-center gap-2">
        <span>{field.label}{isFieldRequired && <span className="text-red-500">*</span>}</span>
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
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
              minLength={field.minLength}
              maxLength={field.maxLength}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "EMAIL":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="email"
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder || "ornek@email.com"}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "URL":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="url"
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder || "https://example.com"}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "PHONE":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="tel"
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder || "+90 555 123 45 67"}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
              pattern={field.pattern}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "CHECKBOX":
        return (
          <div key={field.id}>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="rounded"
                required={isFieldRequired}
                disabled={isFieldReadOnly}
                checked={Boolean(value)}
                onChange={e => handleChange(field.apiKey, e.target.checked)}
                onBlur={() => handleBlur(field.apiKey)}
              />
              <span className="text-sm font-medium">{field.label}{isFieldRequired && <span className="text-red-500">*</span>}</span>
            </label>
            {field.helpText && <p className="text-xs text-gray-500 mt-1 ml-6">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "FILE_UPLOAD":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="file"
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              required={isFieldRequired}
              disabled={isFieldReadOnly}
              onChange={e => {
                const file = e.target.files?.[0];
                handleChange(field.apiKey, file);
              }}
              onBlur={() => handleBlur(field.apiKey)}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "USER_PICKER":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <select
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              required={isFieldRequired}
              disabled={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
            >
              <option value="">Kullanıcı Seçiniz</option>
              {(Array.isArray(field.options) ? field.options : [])
                .map((user: any, i: number) => (
                  <option key={i} value={user.id || user.value}>{user.name || user.label}</option>
                ))}
            </select>
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "DATE_RANGE":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                className={`px-3 py-2 border rounded-md ${validationClasses}`}
                placeholder="Başlangıç"
                required={isFieldRequired}
                disabled={isFieldReadOnly}
                value={value?.start || ""}
                onChange={e => handleChange(field.apiKey, { ...value, start: e.target.value })}
                onBlur={() => handleBlur(field.apiKey)}
              />
              <input
                type="date"
                className={`px-3 py-2 border rounded-md ${validationClasses}`}
                placeholder="Bitiş"
                required={isFieldRequired}
                disabled={isFieldReadOnly}
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
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value)}
              onBlur={() => handleBlur(field.apiKey)}
              rows={4}
              minLength={field.minLength}
              maxLength={field.maxLength}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
          </div>
        );
      case "NUMBER":
        return (
          <div key={field.id}>
            <label className="block text-sm font-medium mb-1">{labelWithCondition}</label>
            <input
              type="number"
              className={`w-full px-3 py-2 border rounded-md ${validationClasses}`}
              placeholder={field.placeholder}
              required={isFieldRequired}
              readOnly={isFieldReadOnly}
              value={value}
              onChange={e => handleChange(field.apiKey, e.target.value === "" ? "" : Number(e.target.value))}
              onBlur={() => handleBlur(field.apiKey)}
              min={field.minValue}
              max={field.maxValue}
            />
            {field.helpText && <p className="text-xs text-gray-500 mt-1">{field.helpText}</p>}
            {renderValidationMessages(field.id)}
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

  // Sprint 4: Modern section ve alanları render et
  const renderSection = (section: FormSection) => {
    if (!isSectionVisible(section)) return null;

    const isCollapsed = collapsedSections.has(section.id);
    const fieldsBySection = getFieldsBySection() as { [key: string]: FormField[] };
    const sectionFields = fieldsBySection[section.id] || [];

    return (
      <div 
        key={section.id} 
        className={`mt-6 border rounded-lg ${section.style?.backgroundColor || 'bg-white'} shadow-sm`}
        style={{
          borderColor: section.style?.borderColor,
          color: section.style?.textColor
        }}
      >
        {/* Section Header */}
        <div 
          className={`px-6 py-4 border-b ${section.isCollapsible ? 'cursor-pointer hover:bg-gray-50' : ''}`}
          onClick={section.isCollapsible ? () => toggleSection(section.id) : undefined}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {section.icon && (
                <span className="text-xl">{section.icon}</span>
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                {section.description && (
                  <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                )}
              </div>
            </div>
            {section.isCollapsible && (
              <div className="text-gray-400">
                {isCollapsed ? '▼' : '▲'}
              </div>
            )}
          </div>
        </div>

        {/* Section Content */}
        {!isCollapsed && (
          <div className="p-6">
            <div className={`space-y-4 ${
              sectionLayout?.displayMode === 'TWO_COLUMN' ? 'grid grid-cols-2 gap-4' :
              sectionLayout?.displayMode === 'THREE_COLUMN' ? 'grid grid-cols-3 gap-4' : ''
            }`}>
              {sectionFields
                .filter((field: FormField) => visibleFields.has(field.id))
                .sort((a: FormField, b: FormField) => (a.priority || 0) - (b.priority || 0))
                .map(renderField)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderForm = () => {
    const fieldsBySection = getFieldsBySection() as { [key: string]: FormField[] };
    
    // Eğer sections varsa, section-based rendering yap
    if (sections && sections.length > 0) {
      const sortedSections = [...sections].sort((a, b) => a.order - b.order);
      
      return (
        <div className="space-y-6">
          {/* Section Navigation (eğer enabled ise) */}
          {sectionLayout?.enableSectionNavigation && (
            <div className="flex space-x-4 border-b border-gray-200 pb-4">
              {sortedSections
                .filter(isSectionVisible)
                .map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSectionId(section.id)}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeSectionId === section.id
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {section.icon && <span className="mr-2">{section.icon}</span>}
                    {section.name}
                  </button>
                ))}
            </div>
          )}

          {/* Progress Indicator (eğer enabled ise) */}
          {sectionLayout?.enableProgressIndicator && (
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>İlerleme</span>
                <span>{Math.round((sortedSections.findIndex(s => s.id === activeSectionId) + 1) / sortedSections.length * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(sortedSections.findIndex(s => s.id === activeSectionId) + 1) / sortedSections.length * 100}%` 
                  }}
                />
              </div>
            </div>
          )}

          {/* Sections */}
          {sortedSections.map(renderSection)}

          {/* Ungrouped Fields */}
          {fieldsBySection.ungrouped && fieldsBySection.ungrouped.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Diğer Alanlar</h3>
              <div className="space-y-4">
                {fieldsBySection.ungrouped
                  .filter((field: FormField) => visibleFields.has(field.id))
                  .sort((a: FormField, b: FormField) => (a.priority || 0) - (b.priority || 0))
                  .map(renderField)}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Legacy rendering (sections yoksa)
    if (!layout || !Array.isArray(layout.fieldOrder)) {
      return (
        <div className="space-y-4">
          {getSortedFields(formFields, layout)
            .filter((field: FormField) => visibleFields.has(field.id))
            .map(renderField)}
        </div>
      );
    }

    // Legacy section rendering
    const legacySectionFields: string[] = [];
    const legacySections = layout.fieldOrder.filter((item: any) => item.type === 'section');
    const legacySectionMap: Record<string, any> = {};
    legacySections.forEach((section: any) => {
      legacySectionMap[section.id] = section;
      (section.fields || []).forEach((fid: string) => legacySectionFields.push(fid));
    });
    const topLevelFields = layout.fieldOrder.filter((item: any) => typeof item === 'string' && !legacySectionFields.includes(item));
    
    return (
      <div className="space-y-6">
        {/* Section olmayan alanlar */}
        {topLevelFields.length > 0 && (
          <div className="space-y-4">
            {topLevelFields.map((fid: string) => {
              const field = formFields.find(f => f.id === fid);
              return field && visibleFields.has(field.id) ? renderField(field) : null;
            })}
          </div>
        )}
        
        {/* Legacy Sections */}
        {legacySections.map((section: any) => (
          <div key={section.id} className="mt-8 mb-6 border rounded-lg bg-gray-50 p-6">
            <div className="mb-2">
              <div className="text-lg font-bold text-gray-800">{section.name}</div>
              {section.description && <div className="text-gray-500 text-sm mt-1">{section.description}</div>}
            </div>
            <div className="space-y-4">
              {(section.fields || []).map((fid: string) => {
                const field = formFields.find(f => f.id === fid);
                return field && visibleFields.has(field.id) ? renderField(field) : null;
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Sprint 2: Render validation summary
  const renderValidationSummary = () => {
    if (!showValidationSummary) return null;

    const allErrors = Object.values(fieldValidations).flatMap(v => v.errors);
    const allWarnings = Object.values(fieldValidations).flatMap(v => v.warnings);

    if (allErrors.length === 0 && allWarnings.length === 0) return null;

    return (
      <div className="mb-4 p-4 border rounded-lg bg-red-50 border-red-200">
        <h3 className="text-sm font-medium text-red-800 mb-2">Form Doğrulama Özeti</h3>
        {allErrors.length > 0 && (
          <div className="mb-2">
            <h4 className="text-xs font-medium text-red-700 mb-1">Hatalar:</h4>
            <ul className="text-xs text-red-600 space-y-1">
              {allErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
        {allWarnings.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-yellow-700 mb-1">Uyarılar:</h4>
            <ul className="text-xs text-yellow-600 space-y-1">
              {allWarnings.map((warning, index) => (
                <li key={index}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  if (!formFields || formFields.length === 0) {
    return <div className="text-gray-500 text-sm">Bu şablona ait özel bir başlatma formu yok.</div>;
  }

  return (
    <>
      {renderValidationSummary()}
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