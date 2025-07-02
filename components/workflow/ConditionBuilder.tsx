import React from 'react';

const DUMMY_FIELDS = [
  { key: 'renewalType', label: 'Renewal Type', type: 'select', options: ['Auto-Renew', 'Optional Extension', 'None', 'Evergreen', 'Other'] },
  { key: 'contractValue', label: 'Contract Value', type: 'number' },
  { key: 'counterparty', label: 'Counterparty', type: 'text' },
];
const DUMMY_OPERATORS = {
  select: ['is', 'is not'],
  number: ['=', '!=', '>', '<', '>=', '<='],
  text: ['contains', 'does not contain', 'is', 'is not'],
};

export interface Condition {
  field: string;
  operator: string;
  value: string;
  id: string;
}

interface ConditionBuilderProps {
  conditions: Condition[];
  onChange: (conds: Condition[]) => void;
  logic?: 'AND' | 'OR';
  onLogicChange?: (logic: 'AND' | 'OR') => void;
  className?: string;
}

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  logic = 'AND',
  onLogicChange,
  className = '',
}) => {
  // Koşul ekle
  const addCondition = () => {
    onChange([
      ...conditions,
      { field: DUMMY_FIELDS[0].key, operator: DUMMY_OPERATORS['select'][0], value: '', id: Math.random().toString(36).slice(2) },
    ]);
  };
  // Koşul sil
  const removeCondition = (id: string) => {
    onChange(conditions.filter(c => c.id !== id));
  };
  // Koşul güncelle
  const updateCondition = (id: string, field: Partial<Condition>) => {
    onChange(conditions.map(c => c.id === id ? { ...c, ...field } : c));
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {conditions.length > 1 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-500">Logic:</span>
          <button
            className={`px-2 py-1 rounded text-xs border ${logic === 'AND' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => onLogicChange && onLogicChange('AND')}
            type="button"
          >AND</button>
          <button
            className={`px-2 py-1 rounded text-xs border ${logic === 'OR' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
            onClick={() => onLogicChange && onLogicChange('OR')}
            type="button"
          >OR</button>
        </div>
      )}
      {conditions.map((cond, idx) => {
        const fieldMeta = DUMMY_FIELDS.find(f => f.key === cond.field) || DUMMY_FIELDS[0];
        const operators = DUMMY_OPERATORS[fieldMeta.type as keyof typeof DUMMY_OPERATORS] || [];
        return (
          <div key={cond.id} className="flex items-center gap-2 bg-gray-50 border rounded p-2">
            {/* Alan seçimi */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={cond.field}
              onChange={e => {
                const newField = e.target.value;
                const newMeta = DUMMY_FIELDS.find(f => f.key === newField) || DUMMY_FIELDS[0];
                updateCondition(cond.id, {
                  field: newField,
                  operator: DUMMY_OPERATORS[newMeta.type as keyof typeof DUMMY_OPERATORS][0],
                  value: '',
                });
              }}
            >
              {DUMMY_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
            </select>
            {/* Operatör seçimi */}
            <select
              className="border rounded px-2 py-1 text-sm"
              value={cond.operator}
              onChange={e => updateCondition(cond.id, { operator: e.target.value })}
            >
              {operators.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            {/* Değer girişi */}
            {fieldMeta.type === 'select' ? (
              <select
                className="border rounded px-2 py-1 text-sm"
                value={cond.value}
                onChange={e => updateCondition(cond.id, { value: e.target.value })}
              >
                <option value="">Select...</option>
                {fieldMeta.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : fieldMeta.type === 'number' ? (
              <input
                type="number"
                className="border rounded px-2 py-1 text-sm w-24"
                value={cond.value}
                onChange={e => updateCondition(cond.id, { value: e.target.value })}
                placeholder="Value"
              />
            ) : (
              <input
                type="text"
                className="border rounded px-2 py-1 text-sm w-32"
                value={cond.value}
                onChange={e => updateCondition(cond.id, { value: e.target.value })}
                placeholder="Value"
              />
            )}
            {/* Sil butonu */}
            <button
              className="ml-2 text-red-400 hover:text-red-600 text-lg"
              onClick={() => removeCondition(cond.id)}
              title="Sil"
              type="button"
            >🗑</button>
          </div>
        );
      })}
      <div className="flex items-center gap-2 mt-2">
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
          onClick={addCondition}
          type="button"
        >Add condition</button>
      </div>
    </div>
  );
}; 