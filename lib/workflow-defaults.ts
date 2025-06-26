import { WorkflowSchema, PropertyGroup, WorkflowProperty, WorkflowCondition } from '@/types/workflow';

// Default Properties based on Ironclad structure
export const DEFAULT_PROPERTY_GROUPS: PropertyGroup[] = [
  {
    id: 'basic-properties',
    name: 'PROPERTIES',
    order: 1,
    properties: [
      {
        id: 'counterparty-name',
        name: 'Counterparty Name',
        type: 'text',
        required: true,
        description: 'Name of the contracting party'
      }
    ]
  },
  {
    id: 'counterparty-signer',
    name: 'COUNTERPARTY SIGNER',
    order: 2,
    properties: [
      {
        id: 'counterparty-signer-email',
        name: 'Counterparty Signer Email',
        type: 'email',
        required: true,
        description: 'Email address of the person who will sign'
      },
      {
        id: 'counterparty-signer-name',
        name: 'Counterparty Signer Name',
        type: 'text',
        required: true,
        description: 'Full name of the signer'
      }
    ]
  },
  {
    id: 'contract-properties',
    name: 'PROPERTIES',
    order: 3,
    properties: [
      {
        id: 'contract-owner',
        name: 'Contract Owner',
        type: 'user',
        required: true,
        description: 'Person responsible for managing this contract'
      },
      {
        id: 'effective-date',
        name: 'Effective Date',
        type: 'date',
        required: true,
        description: 'When the contract becomes effective'
      },
      {
        id: 'expiration-date',
        name: 'Expiration Date',
        type: 'date',
        required: false,
        description: 'When the contract expires'
      },
      {
        id: 'initial-term-length',
        name: 'Initial Term Length',
        type: 'duration',
        required: false,
        description: 'Length of the initial contract term'
      },
      {
        id: 'other-renewal-type',
        name: 'Other Renewal Type',
        type: 'text',
        required: false,
        description: 'Custom renewal type description'
      },
      {
        id: 'renewal-opt-out-date',
        name: 'Renewal Opt Out Date',
        type: 'date',
        required: false,
        description: 'Deadline to opt out of renewal'
      },
      {
        id: 'renewal-opt-out-period',
        name: 'Renewal Opt Out Period',
        type: 'duration',
        required: false,
        description: 'Notice period for renewal opt-out'
      },
      {
        id: 'renewal-term-length',
        name: 'Renewal Term Length',
        type: 'duration',
        required: false,
        description: 'Length of renewal terms'
      },
      {
        id: 'renewal-type',
        name: 'Renewal Type',
        type: 'select',
        required: false,
        options: ['Auto-Renew', 'Optional Extension', 'None', 'Evergreen', 'Other'],
        description: 'How the contract renews'
      },
      {
        id: 'renewals-allowed',
        name: 'Renewals Allowed',
        type: 'number',
        required: false,
        description: 'Maximum number of renewals permitted'
      },
      {
        id: 'termination-notice-period',
        name: 'Termination Notice Period',
        type: 'duration',
        required: false,
        description: 'Required notice period for termination'
      }
    ]
  }
];

// Default Conditions based on Ironclad structure
export const DEFAULT_CONDITIONS: WorkflowCondition[] = [
  {
    id: 'renewal-auto-renew',
    name: 'Renewal Type is Auto-Renew',
    property: 'renewal-type',
    operator: 'equals',
    value: 'Auto-Renew',
    description: 'Triggers when renewal type is set to Auto-Renew'
  },
  {
    id: 'renewal-auto-or-optional',
    name: 'Renewal Type is Auto-Renew OR Optional Extension',
    property: 'renewal-type',
    operator: 'equals',
    value: ['Auto-Renew', 'Optional Extension'],
    description: 'Triggers when renewal type is Auto-Renew or Optional Extension'
  },
  {
    id: 'renewal-none',
    name: 'Renewal Type is None',
    property: 'renewal-type',
    operator: 'equals',
    value: 'None',
    description: 'Triggers when no renewal is set'
  },
  {
    id: 'renewal-not-evergreen',
    name: 'Renewal Type is not Evergreen',
    property: 'renewal-type',
    operator: 'not_equals',
    value: 'Evergreen',
    description: 'Triggers when renewal type is anything except Evergreen'
  },
  {
    id: 'renewal-optional',
    name: 'Renewal Type is Optional Extension',
    property: 'renewal-type',
    operator: 'equals',
    value: 'Optional Extension',
    description: 'Triggers when renewal type is Optional Extension'
  },
  {
    id: 'renewal-other',
    name: 'Renewal Type is Other',
    property: 'renewal-type',
    operator: 'equals',
    value: 'Other',
    description: 'Triggers when renewal type is set to Other'
  }
];

// Default Workflow Schema
export const DEFAULT_WORKFLOW_SCHEMA: WorkflowSchema = {
  id: 'default-contract-schema',
  name: 'Contract Lifecycle Management',
  description: 'Standard contract workflow with lifecycle preset',
  propertyGroups: DEFAULT_PROPERTY_GROUPS,
  conditions: DEFAULT_CONDITIONS,
  lifecyclePreset: {
    enabled: true,
    questionsCount: 10
  }
}; 