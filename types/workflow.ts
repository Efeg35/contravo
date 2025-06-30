// Workflow Property Types
export type PropertyType = 'text' | 'email' | 'url' | 'phone' | 'date' | 'date_range' | 'duration' | 'number' | 'user' | 'select' | 'multi_select' | 'boolean' | 'checkbox' | 'file_upload' | 'textarea';

// Sprint 4: Section/Grup Types
export type SectionDisplayMode = 'EXPANDED' | 'COLLAPSED' | 'TABS' | 'ACCORDION';
export type SectionVisibilityCondition = 'ALWAYS' | 'CONDITIONAL' | 'NEVER';

export interface FormSection {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  displayMode: SectionDisplayMode;
  isCollapsible: boolean;
  isExpanded: boolean;
  visibilityCondition: SectionVisibilityCondition;
  showWhen?: FieldCondition[];
  hideWhen?: FieldCondition[];
  order: number;
  style?: {
    backgroundColor?: string;
    borderColor?: string;
    textColor?: string;
  };
  permissions?: {
    viewRoles?: string[];
    editRoles?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Sprint 2: Validation Rule Types
export type ValidationRuleType = 'REQUIRED' | 'MIN_LENGTH' | 'MAX_LENGTH' | 'MIN_VALUE' | 'MAX_VALUE' | 'PATTERN' | 'EMAIL' | 'URL' | 'PHONE' | 'CUSTOM' | 'CROSS_FIELD' | 'CONDITIONAL' | 'BUSINESS_RULE';

export type ValidationOperator = 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'greater_than_or_equal' | 'less_than' | 'less_than_or_equal' | 'is_empty' | 'is_not_empty' | 'in' | 'not_in' | 'between' | 'regex';

export type ValidationSeverity = 'ERROR' | 'WARNING' | 'INFO';

export type ValidationMode = 'SUBMIT' | 'BLUR' | 'CHANGE' | 'REAL_TIME';

export interface ValidationRule {
  id: string;
  type: ValidationRuleType;
  operator?: ValidationOperator;
  value?: any;
  message: string;
  severity: ValidationSeverity;
  priority: number;
  isActive: boolean;
}

export interface FieldCondition {
  field: string;
  operator: ValidationOperator;
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ConditionalRule {
  id: string;
  name: string;
  conditions: FieldCondition[];
  actions: {
    show?: string[];      // Alan ID'leri
    hide?: string[];      // Alan ID'leri
    require?: string[];   // Alan ID'leri
    unrequire?: string[]; // Alan ID'leri
    setValues?: { [fieldId: string]: any };
    validateFields?: string[];
  };
  priority: number;
  isActive: boolean;
}

export interface FormValidationRule {
  id: string;
  name: string;
  description?: string;
  ruleType: string;
  targetFields: string[];
  conditions: FieldCondition[];
  validationLogic: any;
  errorMessage: string;
  severity: ValidationSeverity;
  isActive: boolean;
  priority: number;
}

export interface WorkflowProperty {
  id: string;
  name: string;
  type: PropertyType;
  required: boolean;
  description?: string;
  options?: string[]; // For select type
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
  
  // Sprint 2: Enhanced validation and rules
  isConditional?: boolean;
  validationRules?: ValidationRule[];
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

export interface WorkflowCondition {
  id: string;
  name: string;
  property: string; // Property ID
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: any;
  description?: string;
}

export interface PropertyGroup {
  id: string;
  name: string;
  properties: WorkflowProperty[];
  order: number;
}

export interface WorkflowSchema {
  id: string;
  name: string;
  description: string;
  propertyGroups: PropertyGroup[]; // DEPRECATED: Use sections instead
  conditions: WorkflowCondition[];
  lifecyclePreset?: {
    enabled: boolean;
    questionsCount: number;
  };
  
  // Sprint 2: Form validation settings
  enableRealTimeValidation?: boolean;
  validationMode?: ValidationMode;
  showValidationSummary?: boolean;
  allowPartialSave?: boolean;
  formRules?: FormValidationRule[];
  conditionalRules?: ConditionalRule[];
  
  // Sprint 4: Section/Grup support
  sections?: FormSection[];
  sectionLayout?: {
    displayMode: 'SINGLE_COLUMN' | 'TWO_COLUMN' | 'THREE_COLUMN' | 'CUSTOM';
    enableSectionNavigation: boolean;
    enableProgressIndicator: boolean;
    allowSectionCollapse: boolean;
  };
}

// Validation State Types
export interface FieldValidationState {
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
  warnings: string[];
  isValidating: boolean;
}

export interface FormValidationState {
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  fields: { [fieldId: string]: FieldValidationState };
  globalErrors: string[];
  globalWarnings: string[];
}

// Property Icons
export const PROPERTY_ICONS: Record<PropertyType, string> = {
  text: 'T',
  email: '@',
  url: '🌐',
  phone: '📞',
  date: '📅',
  date_range: '📅',
  duration: '⏰',
  number: '📊',
  user: 'fx',
  select: '🔽',
  multi_select: '🔽',
  boolean: '✓',
  checkbox: '☑',
  file_upload: '📎',
  textarea: '📄'
};

// Property Colors
export const PROPERTY_COLORS: Record<PropertyType, string> = {
  text: 'bg-orange-100',
  email: 'bg-blue-100',
  url: 'bg-cyan-100',
  phone: 'bg-green-100',
  date: 'bg-teal-100',
  date_range: 'bg-teal-100',
  duration: 'bg-blue-100',
  number: 'bg-purple-100',
  user: 'bg-yellow-100',
  select: 'bg-green-100',
  multi_select: 'bg-green-100',
  boolean: 'bg-red-100',
  checkbox: 'bg-red-100',
  file_upload: 'bg-gray-100',
  textarea: 'bg-orange-100'
}; 