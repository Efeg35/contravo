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
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

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
  
  // Alan tipine özel özellikler
  accept?: string;
  maxFileSize?: string;
  multiple?: boolean;
  defaultChecked?: boolean;
  step?: string;
  minDate?: string;
  maxDate?: string;
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
  onDeleteField?: (fieldId: string) => void;
  onDeleteSection?: (sectionId: string) => void;
  onAddQuestionToSection?: (sectionId: string) => void;
  
  // Sprint 4: Section/Grup support
  sections?: FormSection[];
  sectionLayout?: {
    displayMode: 'SINGLE_COLUMN' | 'TWO_COLUMN' | 'THREE_COLUMN' | 'CUSTOM';
    enableSectionNavigation: boolean;
    enableProgressIndicator: boolean;
    allowSectionCollapse: boolean;
  };
  
  // Düzenleme modu için prop'lar
  editingFieldId?: string | null;
  onStartEditing?: (fieldId: string) => void;
  onSaveField?: (fieldId: string, updatedData: Partial<FormField>) => void;
  onCancelEditing?: () => void;
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
  onDeleteField,
  onDeleteSection,
  onAddQuestionToSection,
  
  // Sprint 4: Section/Grup support
  sections,
  sectionLayout,
  
  // Düzenleme modu için prop'lar
  editingFieldId,
  onStartEditing,
  onSaveField,
  onCancelEditing
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
  
  // Düzenleme modu için state
  const [editData, setEditData] = useState<{ [fieldId: string]: { 
    label: string; 
    helpText: string;
    placeholder?: string;
    options?: string[];
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    accept?: string;
    maxFileSize?: string;
    multiple?: boolean;
    defaultChecked?: boolean;
    step?: string;
    minDate?: string;
    maxDate?: string;
  } }>({});

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
  }, [formData, enableRealTimeValidation, validationMode, evaluateConditionalRules, onValidationChange]);

  // Düzenleme modu başladığında editData'yı initialize et
  useEffect(() => {
    if (editingFieldId) {
      const field = formFields.find(f => f.id === editingFieldId);
      if (field && !editData[editingFieldId]) {
        setEditData(prev => ({
          ...prev,
          [editingFieldId]: {
            label: field.label,
            helpText: field.helpText || ''
          }
        }));
      }
    }
  }, [editingFieldId, formFields, editData]);

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
    if (!visibleFields.has(field.id) || field.isHidden) {
      return null;
    }

    const value = formData?.[field.apiKey] ?? field.defaultValue ?? "";
    const isFieldRequired = requiredFields.has(field.id) || field.isRequired;
    const isFieldReadOnly = readOnlyFields.has(field.id) || field.isReadOnly;
    const validationClasses = getValidationClasses(field.id);
    const isEditing = editingFieldId === field.id;
    
    const dc = displayConditions && displayConditions[field.id];
    const conditionSummary = dc ? (
      <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
        Gösterim kuralı: {dc.field} {dc.operator} {dc.value}
      </span>
    ) : null;
    
    // Düzenleme modunda kaydetme
    const handleSave = () => {
      if (onSaveField) {
        const updatedData: any = {
          label: editData[field.id]?.label || field.label,
          helpText: editData[field.id]?.helpText || field.helpText || ''
        };

        // Alan tipine göre özel alanları ekle
        if (editData[field.id]?.placeholder !== undefined) {
          updatedData.placeholder = editData[field.id].placeholder;
        }
        if (editData[field.id]?.options !== undefined) {
          updatedData.options = editData[field.id].options;
        }
        if (editData[field.id]?.minValue !== undefined) {
          updatedData.minValue = editData[field.id].minValue;
        }
        if (editData[field.id]?.maxValue !== undefined) {
          updatedData.maxValue = editData[field.id].maxValue;
        }
        if (editData[field.id]?.minLength !== undefined) {
          updatedData.minLength = editData[field.id].minLength;
        }
        if (editData[field.id]?.maxLength !== undefined) {
          updatedData.maxLength = editData[field.id].maxLength;
        }
        if (editData[field.id]?.pattern !== undefined) {
          updatedData.pattern = editData[field.id].pattern;
        }
        if (editData[field.id]?.accept !== undefined) {
          updatedData.accept = editData[field.id].accept;
        }
        if (editData[field.id]?.maxFileSize !== undefined) {
          updatedData.maxFileSize = editData[field.id].maxFileSize;
        }
        if (editData[field.id]?.multiple !== undefined) {
          updatedData.multiple = editData[field.id].multiple;
        }
        if (editData[field.id]?.defaultChecked !== undefined) {
          updatedData.defaultChecked = editData[field.id].defaultChecked;
        }
        if (editData[field.id]?.step !== undefined) {
          updatedData.step = editData[field.id].step;
        }
        if (editData[field.id]?.minDate !== undefined) {
          updatedData.minDate = editData[field.id].minDate;
        }
        if (editData[field.id]?.maxDate !== undefined) {
          updatedData.maxDate = editData[field.id].maxDate;
        }

        onSaveField(field.id, updatedData);
      }
    };
    
    // Düzenleme modunda iptal
    const handleCancel = () => {
      setEditData(prev => ({
        ...prev,
        [field.id]: {
          label: field.label,
          helpText: field.helpText || '',
          placeholder: field.placeholder,
          options: Array.isArray(field.options) ? field.options : [],
          minValue: field.minValue,
          maxValue: field.maxValue,
          minLength: field.minLength,
          maxLength: field.maxLength,
          pattern: field.pattern,
          accept: field.accept,
          maxFileSize: field.maxFileSize,
          multiple: field.multiple,
          defaultChecked: field.defaultChecked,
          step: field.step,
          minDate: field.minDate,
          maxDate: field.maxDate
        }
      }));
      if (onCancelEditing) {
        onCancelEditing();
      }
    };
    
    // Küçük, kurumsal ve modern Card UI
    return (
      <Card
        key={field.id}
        className={`mb-2 border-gray-200 shadow-xs hover:shadow-sm transition-shadow group bg-white/95 rounded-lg ${
          isEditing ? 'ring-2 ring-blue-500' : 'cursor-pointer'
        }`}
        onClick={isEditing ? () => onCancelEditing?.() : (onStartEditing ? () => onStartEditing(field.id) : undefined)}
      >
        <CardHeader className="flex flex-row items-center justify-between p-2 pb-1 min-h-0">
          <div className="flex flex-col gap-0.5 flex-1">
            {isEditing ? (
              // Düzenleme modu
              <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editData[field.id]?.label || field.label}
                  onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], label: e.target.value } }))}
                  placeholder="Alan başlığı"
                  className="text-sm font-medium"
                />
                <Textarea
                  value={editData[field.id]?.helpText || field.helpText || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], helpText: e.target.value } }))}
                  placeholder="Alan açıklaması (opsiyonel)"
                  className="text-xs"
                  rows={2}
                />
                
                {/* Alan tipine göre özel düzenleme alanları */}
                {field.type === 'TEXT' || field.type === 'EMAIL' || field.type === 'TEXTAREA' ? (
                  <Input
                    value={editData[field.id]?.placeholder || field.placeholder || ''}
                    onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], placeholder: e.target.value } }))}
                    placeholder="Placeholder metni"
                    className="text-xs"
                  />
                ) : null}
                
                {field.type === 'NUMBER' && (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      value={editData[field.id]?.minValue || field.minValue || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], minValue: e.target.value ? Number(e.target.value) : undefined } }))}
                      placeholder="Min değer"
                      className="text-xs"
                    />
                    <Input
                      type="number"
                      value={editData[field.id]?.maxValue || field.maxValue || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], maxValue: e.target.value ? Number(e.target.value) : undefined } }))}
                      placeholder="Max değer"
                      className="text-xs"
                    />
                  </div>
                )}
                
                {(field.type === 'SINGLE_SELECT' || field.type === 'MULTI_SELECT') && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600">Seçenekler:</div>
                    {(editData[field.id]?.options || field.options || []).map((option: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...(editData[field.id]?.options || field.options || [])];
                            newOptions[index] = e.target.value;
                            setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], options: newOptions } }));
                          }}
                          placeholder={`Seçenek ${index + 1}`}
                          className="text-xs"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const newOptions = (editData[field.id]?.options || field.options || []).filter((_: string, i: number) => i !== index);
                            setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], options: newOptions } }));
                          }}
                          className="text-xs px-2 py-1"
                        >
                          Sil
                        </Button>
                      </div>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const newOptions = [...(editData[field.id]?.options || field.options || []), ''];
                        setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], options: newOptions } }));
                      }}
                      className="text-xs px-2 py-1"
                    >
                      + Seçenek Ekle
                    </Button>
                  </div>
                )}
                
                {field.type === 'FILE_UPLOAD' && (
                  <div className="space-y-2">
                    <Input
                      value={editData[field.id]?.accept || field.accept || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], accept: e.target.value } }))}
                      placeholder="Kabul edilen dosya türleri (örn: .pdf,.doc,.docx)"
                      className="text-xs"
                    />
                    <Input
                      value={editData[field.id]?.maxFileSize || field.maxFileSize || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], maxFileSize: e.target.value } }))}
                      placeholder="Maksimum dosya boyutu (örn: 5MB)"
                      className="text-xs"
                    />
                  </div>
                )}
                
                {field.type === 'DATE' && (
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={editData[field.id]?.minDate || field.minDate || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], minDate: e.target.value } }))}
                      placeholder="Min tarih"
                      className="text-xs"
                    />
                    <Input
                      type="date"
                      value={editData[field.id]?.maxDate || field.maxDate || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, [field.id]: { ...prev[field.id], maxDate: e.target.value } }))}
                      placeholder="Max tarih"
                      className="text-xs"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave();
                    }}
                    className="text-xs px-3 py-1"
                  >
                    Kaydet
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel();
                    }}
                    className="text-xs px-3 py-1"
                  >
                    İptal
                  </Button>
                </div>
              </div>
            ) : (
              // Görüntüleme modu
              <>
                <CardTitle className="text-sm font-medium text-gray-900 flex items-center gap-1 leading-tight">
                  {field.label}
                  {isFieldRequired && <span className="text-red-500">*</span>}
                </CardTitle>
                {field.helpText && (
                  <CardDescription className="text-xs text-gray-400 mt-0.5 leading-tight">
                    {field.helpText}
                  </CardDescription>
                )}
              </>
            )}
          </div>
          {!isEditing && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="text-blue-500 hover:text-blue-700 text-xs underline px-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddCondition(field);
                }}
              >
                Koşul
              </button>
              {onDeleteField && (
                <button
                  type="button"
                  className="text-gray-400 hover:text-red-600 text-base ml-1 p-0.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteField(field.id);
                  }}
                  title="Soruyu sil"
                >
                  <span className="sr-only">Sil</span>
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M6 6l12 12M6 18L18 6"/></svg>
                </button>
              )}
            </div>
          )}
        </CardHeader>
        {!isEditing && (
          <CardContent className="p-2 pt-0">
            {/* Alan tipi bazlı inputlar */}
            {(() => {
              switch (field.type) {
                case "TEXT":
                  return (
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm placeholder-gray-400 transition"
                      placeholder={field.placeholder || "Yanıtınızı girin"}
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                      pattern={field.pattern}
                    />
                  );
                case "EMAIL":
                  return (
                    <input
                      type="email"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm placeholder-gray-400 transition"
                      placeholder={field.placeholder || "ornek@email.com"}
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                      pattern={field.pattern}
                    />
                  );
                case "TEXTAREA":
                  return (
                    <textarea
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm placeholder-gray-400 transition"
                      placeholder={field.placeholder || "Yanıtınızı girin"}
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                      rows={3}
                      minLength={field.minLength}
                      maxLength={field.maxLength}
                    />
                  );
                case "NUMBER":
                  return (
                    <input
                      type="number"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm placeholder-gray-400 transition"
                      placeholder={field.placeholder || ""}
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value === "" ? "" : Number(e.target.value))}
                      onBlur={() => handleBlur(field.apiKey)}
                      min={field.minValue}
                      max={field.maxValue}
                    />
                  );
                case "DATE":
                  return (
                    <input
                      type="date"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm transition"
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                    />
                  );
                case "SINGLE_SELECT":
                  return (
                    <select
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm transition"
                      required={isFieldRequired}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                    >
                      <option value="">Seçiniz</option>
                      {(Array.isArray(field.options) ? field.options : [])
                        .map((opt: any, i: number) => (
                          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                        ))}
                    </select>
                  );
                case "MULTI_SELECT":
                  return (
                    <select
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm transition"
                      required={isFieldRequired}
                      multiple
                      value={Array.isArray(value) ? value : []}
                      onChange={e => {
                        const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        handleChange(field.apiKey, selected);
                      }}
                      onBlur={() => handleBlur(field.apiKey)}
                    >
                      {(Array.isArray(field.options) ? field.options : [])
                        .map((opt: any, i: number) => (
                          <option key={i} value={typeof opt === 'string' ? opt : opt.value}>{typeof opt === 'string' ? opt : opt.label}</option>
                        ))}
                    </select>
                  );
                case "CHECKBOX":
                  return (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300 focus:ring-blue-200"
                        required={isFieldRequired}
                        disabled={isFieldReadOnly}
                        checked={!!value}
                        onChange={e => handleChange(field.apiKey, e.target.checked)}
                        onBlur={() => handleBlur(field.apiKey)}
                      />
                      {field.label}
                    </label>
                  );
                case "FILE_UPLOAD":
                  return (
                    <input
                      type="file"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm transition"
                      required={isFieldRequired}
                      disabled={isFieldReadOnly}
                      onChange={e => handleChange(field.apiKey, e.target.files?.[0])}
                      onBlur={() => handleBlur(field.apiKey)}
                    />
                  );
                default:
                  return (
                    <input
                      type="text"
                      className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-200 focus:border-blue-500 text-sm placeholder-gray-400 transition"
                      placeholder={field.placeholder || "Yanıtınızı girin"}
                      required={isFieldRequired}
                      readOnly={isFieldReadOnly}
                      value={value}
                      onChange={e => handleChange(field.apiKey, e.target.value)}
                      onBlur={() => handleBlur(field.apiKey)}
                    />
                  );
              }
            })()}
            {renderValidationMessages(field.id)}
          </CardContent>
        )}
      </Card>
    );
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
        className={`mt-12 border rounded-2xl bg-gray-50 shadow-lg divide-y divide-gray-100 transition-all hover:shadow-2xl hover:-translate-y-1`}
        style={{
          borderColor: section.style?.borderColor,
          color: section.style?.textColor
        }}
      >
        {/* Section Header */}
        <div 
          className="px-4 py-2 border-b bg-white rounded-t-lg flex items-center gap-2 justify-between"
        >
          <div 
            className="flex items-center gap-2 cursor-pointer flex-1"
            onClick={section.isCollapsible ? () => toggleSection(section.id) : undefined}
          >
            {section.icon && (
              <span className="text-lg text-blue-500 mr-1">{section.icon}</span>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 tracking-tight">{section.name}</h3>
              {section.description && (
                <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
              )}
            </div>
          </div>
        </div>
        {/* Section Content */}
        {!isCollapsed && (
          <div className="p-8 divide-y divide-gray-100">
            <div className={`space-y-6 ${
              sectionLayout?.displayMode === 'TWO_COLUMN' ? 'grid grid-cols-2 gap-6' :
              sectionLayout?.displayMode === 'THREE_COLUMN' ? 'grid grid-cols-3 gap-6' : ''
            }`}>
              {sectionFields
                .filter((field: FormField) => visibleFields.has(field.id))
                .sort((a: FormField, b: FormField) => (a.priority || 0) - (b.priority || 0))
                .map((field) => (
                  <div key={field.id} className="transition hover:bg-blue-50 rounded-lg p-2">
                    {/* Zorunlu alanlar için label'da kırmızı yıldız ve tooltip */}
                    <label className="block text-base font-semibold mb-1 text-gray-900 flex items-center gap-1">
                      {field.label}
                      {field.isRequired && (
                        <span className="text-red-500 cursor-help" title="Bu alan zorunludur">*</span>
                      )}
                    </label>
                    {/* Alan açıklaması */}
                    {field.helpText && <p className="text-xs text-gray-400 mb-1">{field.helpText}</p>}
                    {/* Alanın kendisi (input/select/textarea vs.) burada render edilecek */}
                    {renderField(field)}
                  </div>
                ))}
            </div>
            {/* Section altındaki Add section to form butonu kaldırıldı */}
            <div className="flex gap-4 mt-6">
              {onAddQuestionToSection && (
                <button
                  type="button"
                  className="text-sm px-4 py-2 rounded border bg-gray-50 hover:bg-gray-100 text-gray-800 shadow-sm"
                  onClick={() => onAddQuestionToSection(section.id)}
                >
                  ➕ Add question to section
                </button>
              )}
              {onDeleteSection && (
                <button
                  type="button"
                  className="text-sm px-4 py-2 rounded border bg-red-50 hover:bg-red-100 text-red-600 shadow-sm"
                  onClick={() => onDeleteSection(section.id)}
                >
                  🗑️ Delete section
                </button>
              )}
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