import { 
  ValidationRule, 
  FieldCondition, 
  ConditionalRule, 
  FormValidationRule,
  FieldValidationState, 
  FormValidationState, 
  ValidationOperator,
  ValidationSeverity 
} from '../types/workflow';

export class FormValidationEngine {
  private static instance: FormValidationEngine;
  
  static getInstance(): FormValidationEngine {
    if (!this.instance) {
      this.instance = new FormValidationEngine();
    }
    return this.instance;
  }

  /**
   * Tek bir alan için validasyon çalıştırır
   */
  validateField(
    fieldValue: any, 
    fieldRules: ValidationRule[], 
    allFormData?: { [key: string]: any }
  ): FieldValidationState {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Öncelik sırasına göre kuralları sırala
    const sortedRules = fieldRules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const validationResult = this.executeValidationRule(fieldValue, rule, allFormData);
      
      if (!validationResult.isValid) {
        if (rule.severity === 'ERROR') {
          errors.push(validationResult.message);
        } else if (rule.severity === 'WARNING') {
          warnings.push(validationResult.message);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      isDirty: true,
      isTouched: true,
      errors,
      warnings,
      isValidating: false
    };
  }

  /**
   * Tek bir validasyon kuralını çalıştırır
   */
  private executeValidationRule(
    value: any, 
    rule: ValidationRule, 
    allFormData?: { [key: string]: any }
  ): { isValid: boolean; message: string } {
    switch (rule.type) {
      case 'REQUIRED':
        return {
          isValid: this.isNotEmpty(value),
          message: rule.message || 'Bu alan zorunludur'
        };

      case 'MIN_LENGTH':
        return {
          isValid: !value || String(value).length >= (rule.value || 0),
          message: rule.message || `En az ${rule.value} karakter olmalıdır`
        };

      case 'MAX_LENGTH':
        return {
          isValid: !value || String(value).length <= (rule.value || Infinity),
          message: rule.message || `En fazla ${rule.value} karakter olmalıdır`
        };

      case 'MIN_VALUE':
        return {
          isValid: !value || Number(value) >= (rule.value || -Infinity),
          message: rule.message || `En az ${rule.value} olmalıdır`
        };

      case 'MAX_VALUE':
        return {
          isValid: !value || Number(value) <= (rule.value || Infinity),
          message: rule.message || `En fazla ${rule.value} olmalıdır`
        };

      case 'PATTERN':
        const regex = new RegExp(rule.value);
        return {
          isValid: !value || regex.test(String(value)),
          message: rule.message || 'Geçersiz format'
        };

      case 'EMAIL':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: !value || emailRegex.test(String(value)),
          message: rule.message || 'Geçerli bir email adresi giriniz'
        };

      case 'URL':
        try {
          if (!value) return { isValid: true, message: '' };
          new URL(String(value));
          return { isValid: true, message: '' };
        } catch {
          return {
            isValid: false,
            message: rule.message || 'Geçerli bir URL giriniz'
          };
        }

      case 'PHONE':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return {
          isValid: !value || phoneRegex.test(String(value).replace(/\s/g, '')),
          message: rule.message || 'Geçerli bir telefon numarası giriniz'
        };

      case 'CUSTOM':
        // Custom validation logic burada implement edilebilir
        return { isValid: true, message: '' };

      default:
        return { isValid: true, message: '' };
    }
  }

  /**
   * Koşullu kuralları değerlendirir
   */
  evaluateConditionalRules(
    conditionalRules: ConditionalRule[],
    formData: { [key: string]: any }
  ): {
    fieldsToShow: string[];
    fieldsToHide: string[];
    fieldsToRequire: string[];
    fieldsToUnrequire: string[];
    valuesToSet: { [fieldId: string]: any };
    fieldsToValidate: string[];
  } {
    let fieldsToShow: string[] = [];
    let fieldsToHide: string[] = [];
    let fieldsToRequire: string[] = [];
    let fieldsToUnrequire: string[] = [];
    let valuesToSet: { [fieldId: string]: any } = {};
    let fieldsToValidate: string[] = [];

    // Öncelik sırasına göre kuralları sırala
    const sortedRules = conditionalRules
      .filter(rule => rule.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      const conditionsMatch = this.evaluateConditions(rule.conditions, formData);
      
      if (conditionsMatch) {
        if (rule.actions.show) fieldsToShow.push(...rule.actions.show);
        if (rule.actions.hide) fieldsToHide.push(...rule.actions.hide);
        if (rule.actions.require) fieldsToRequire.push(...rule.actions.require);
        if (rule.actions.unrequire) fieldsToUnrequire.push(...rule.actions.unrequire);
        if (rule.actions.setValues) valuesToSet = { ...valuesToSet, ...rule.actions.setValues };
        if (rule.actions.validateFields) fieldsToValidate.push(...rule.actions.validateFields);
      }
    }

    return {
      fieldsToShow: [...new Set(fieldsToShow)],
      fieldsToHide: [...new Set(fieldsToHide)],
      fieldsToRequire: [...new Set(fieldsToRequire)],
      fieldsToUnrequire: [...new Set(fieldsToUnrequire)],
      valuesToSet,
      fieldsToValidate: [...new Set(fieldsToValidate)]
    };
  }

  /**
   * Koşulları değerlendirir
   */
  private evaluateConditions(
    conditions: FieldCondition[],
    formData: { [key: string]: any }
  ): boolean {
    if (conditions.length === 0) return true;

    let result = this.evaluateCondition(conditions[0], formData);

    for (let i = 1; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionResult = this.evaluateCondition(condition, formData);
      
      if (condition.logicalOperator === 'OR') {
        result = result || conditionResult;
      } else {
        result = result && conditionResult;
      }
    }

    return result;
  }

  /**
   * Tek bir koşulu değerlendirir
   */
  private evaluateCondition(
    condition: FieldCondition,
    formData: { [key: string]: any }
  ): boolean {
    const fieldValue = formData[condition.field];
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === expectedValue;
      
      case 'not_equals':
        return fieldValue !== expectedValue;
      
      case 'contains':
        return String(fieldValue || '').includes(String(expectedValue));
      
      case 'not_contains':
        return !String(fieldValue || '').includes(String(expectedValue));
      
      case 'starts_with':
        return String(fieldValue || '').startsWith(String(expectedValue));
      
      case 'ends_with':
        return String(fieldValue || '').endsWith(String(expectedValue));
      
      case 'greater_than':
        return Number(fieldValue || 0) > Number(expectedValue);
      
      case 'greater_than_or_equal':
        return Number(fieldValue || 0) >= Number(expectedValue);
      
      case 'less_than':
        return Number(fieldValue || 0) < Number(expectedValue);
      
      case 'less_than_or_equal':
        return Number(fieldValue || 0) <= Number(expectedValue);
      
      case 'is_empty':
        return this.isEmpty(fieldValue);
      
      case 'is_not_empty':
        return this.isNotEmpty(fieldValue);
      
      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);
      
      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);
      
      case 'between':
        if (Array.isArray(expectedValue) && expectedValue.length === 2) {
          const numValue = Number(fieldValue || 0);
          return numValue >= expectedValue[0] && numValue <= expectedValue[1];
        }
        return false;
      
      case 'regex':
        try {
          const regex = new RegExp(String(expectedValue));
          return regex.test(String(fieldValue || ''));
        } catch {
          return false;
        }
      
      default:
        return false;
    }
  }

  /**
   * Form seviyesinde validation çalıştırır
   */
  validateForm(
    formData: { [key: string]: any },
    formRules: FormValidationRule[]
  ): FormValidationState {
    const fieldValidations: { [fieldId: string]: FieldValidationState } = {};
    const globalErrors: string[] = [];
    const globalWarnings: string[] = [];

    // Form seviyesinde kuralları çalıştır
    for (const rule of formRules.filter(r => r.isActive)) {
      const ruleResult = this.executeFormRule(rule, formData);
      
      if (!ruleResult.isValid) {
        if (rule.severity === 'ERROR') {
          globalErrors.push(ruleResult.message);
        } else if (rule.severity === 'WARNING') {
          globalWarnings.push(ruleResult.message);
        }
      }
    }

    const isValid = Object.values(fieldValidations).every(f => f.isValid) && globalErrors.length === 0;

    return {
      isValid,
      isDirty: true,
      isSubmitting: false,
      fields: fieldValidations,
      globalErrors,
      globalWarnings
    };
  }

  /**
   * Form kuralını çalıştırır
   */
  private executeFormRule(
    rule: FormValidationRule,
    formData: { [key: string]: any }
  ): { isValid: boolean; message: string } {
    // Basit implementasyon - geliştirilecek
    const conditionsMatch = this.evaluateConditions(rule.conditions, formData);
    
    if (conditionsMatch) {
      // Validation logic burada implement edilir
      // Şu anda her zaman true döner, gerçek mantık eklenecek
      return { isValid: true, message: '' };
    }

    return { isValid: true, message: '' };
  }

  /**
   * Yardımcı metodlar
   */
  private isEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (Array.isArray(value) && value.length === 0) ||
           (typeof value === 'object' && Object.keys(value).length === 0);
  }

  private isNotEmpty(value: any): boolean {
    return !this.isEmpty(value);
  }
}

// Singleton instance export
export const formValidationEngine = FormValidationEngine.getInstance(); 