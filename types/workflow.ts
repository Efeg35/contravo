// Workflow Property Types
export type PropertyType = 'text' | 'email' | 'date' | 'duration' | 'number' | 'user' | 'select' | 'boolean';

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
  propertyGroups: PropertyGroup[];
  conditions: WorkflowCondition[];
  lifecyclePreset?: {
    enabled: boolean;
    questionsCount: number;
  };
}

// Property Icons
export const PROPERTY_ICONS: Record<PropertyType, string> = {
  text: 'T',
  email: '@',
  date: '📅',
  duration: '⏰',
  number: '📊',
  user: 'fx',
  select: '🔽',
  boolean: '✓'
};

// Property Colors
export const PROPERTY_COLORS: Record<PropertyType, string> = {
  text: 'bg-orange-100',
  email: 'bg-blue-100',
  date: 'bg-teal-100',
  duration: 'bg-blue-100',
  number: 'bg-purple-100',
  user: 'bg-yellow-100',
  select: 'bg-green-100',
  boolean: 'bg-red-100'
}; 