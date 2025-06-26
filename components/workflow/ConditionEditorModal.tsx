"use client";

import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WorkflowCondition, WorkflowProperty, PropertyType } from '@/types/workflow';
import { v4 as uuidv4 } from 'uuid';

type Operator = WorkflowCondition['operator'];

interface ConditionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (condition: WorkflowCondition) => void;
  condition: WorkflowCondition | null;
  properties: WorkflowProperty[];
}

const OPERATORS: { [key in PropertyType]?: { value: Operator; label: string }[] } = {
  text: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
    { value: 'contains', label: 'contains' },
    { value: 'is_empty', label: 'is empty' },
    { value: 'is_not_empty', label: 'is not empty' },
  ],
  select: [
    { value: 'equals', label: 'is' },
    { value: 'not_equals', label: 'is not' },
  ],
  number: [
    { value: 'equals', label: '=' },
    { value: 'not_equals', label: '≠' },
    { value: 'greater_than', label: '>' },
    { value: 'less_than', label: '<' },
  ],
  boolean: [
    { value: 'equals', label: 'is' },
  ],
  date: [
    { value: 'equals', label: 'is on' },
    { value: 'not_equals', label: 'is not on' },
    { value: 'greater_than', label: 'is after' },
    { value: 'less_than', label: 'is before' },
  ],
};


export const ConditionEditorModal = ({ isOpen, onClose, onSave, condition, properties }: ConditionEditorModalProps) => {
  const [formData, setFormData] = useState<Partial<WorkflowCondition>>({});
  const [selectedProperty, setSelectedProperty] = useState<WorkflowProperty | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (condition) {
        setFormData(condition);
        const prop = properties.find(p => p.id === condition.property);
        setSelectedProperty(prop || null);
      } else {
        const defaultProp = properties.length > 0 ? properties[0] : null;
        setFormData({
          id: uuidv4(),
          name: '',
          property: defaultProp?.id || '',
          operator: defaultProp ? (OPERATORS[defaultProp.type]?.[0]?.value) : 'equals',
          value: '',
        });
        setSelectedProperty(defaultProp);
      }
    }
  }, [condition, isOpen, properties]);

  const availableOperators = useMemo(() => {
    if (!selectedProperty) return [];
    return OPERATORS[selectedProperty.type] || OPERATORS.text!;
  }, [selectedProperty]);

  const handlePropertyChange = (propertyId: string) => {
    const prop = properties.find(p => p.id === propertyId);
    if (prop) {
        setSelectedProperty(prop);
        const newOperator = OPERATORS[prop.type]?.[0]?.value || 'equals';
        setFormData(prev => ({
            ...prev,
            property: propertyId,
            operator: newOperator,
            value: '', // Reset value when property changes
        }));
    }
  };
  
  const handleChange = (field: keyof Omit<WorkflowCondition, 'id'>, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.property || !formData.operator) {
        // Simple validation
        alert('Please fill all required fields.');
        return;
    }
     // For 'is_empty' or 'is_not_empty', value should be ignored
    const finalValue = ['is_empty', 'is_not_empty'].includes(formData.operator!) 
        ? null 
        : formData.value;

    onSave({ ...formData, value: finalValue } as WorkflowCondition);
  };

  const renderValueInput = () => {
    if (!selectedProperty || ['is_empty', 'is_not_empty'].includes(formData.operator!)) {
        return null; // No value needed for empty/not empty checks
    }

    switch(selectedProperty.type) {
        case 'select':
            return (
                <Select value={formData.value || ''} onValueChange={(val) => handleChange('value', val)}>
                    <SelectTrigger><SelectValue placeholder="Select a value" /></SelectTrigger>
                    <SelectContent>
                        {selectedProperty.options?.map(opt => (
                            <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        case 'boolean':
            return (
                 <Select value={formData.value || ''} onValueChange={(val) => handleChange('value', val)}>
                    <SelectTrigger><SelectValue placeholder="Select a value" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="true">True</SelectItem>
                        <SelectItem value="false">False</SelectItem>
                    </SelectContent>
                </Select>
            );
        case 'date':
             return <Input type="date" value={formData.value || ''} onChange={(e) => handleChange('value', e.target.value)} />;
        case 'number':
             return <Input type="number" value={formData.value || ''} onChange={(e) => handleChange('value', e.target.value)} />;
        default:
            return <Input value={formData.value || ''} onChange={(e) => handleChange('value', e.target.value)} placeholder="Enter a value" />;
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{condition ? 'Edit Condition' : 'New Condition'}</DialogTitle>
           <DialogDescription>
            Conditions control when certain steps or clauses are activated in a workflow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Condition Name</Label>
                <Input
                  id="name"
                  value={formData.name || ''}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="e.g. Renewal Type is Auto-Renew"
                />
            </div>
            
            <div className="p-4 border rounded-md bg-gray-50 space-y-3">
                <Label className="font-semibold">Rules</Label>
                 <div className="flex items-end gap-2">
                    <div className="flex-none text-sm font-medium pt-2">IF</div>
                    <div className="flex-grow space-y-1">
                        <Label className="text-xs text-gray-500">Select a property</Label>
                        <Select value={formData.property} onValueChange={handlePropertyChange}>
                            <SelectTrigger><SelectValue placeholder="Select a property..." /></SelectTrigger>
                            <SelectContent>
                                {properties.map(prop => (
                                    <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                 </div>
                 <div className="flex items-end gap-2 pl-6">
                    <div className="flex-grow space-y-1">
                         <Select value={formData.operator} onValueChange={(val: Operator) => handleChange('operator', val)} disabled={!selectedProperty}>
                            <SelectTrigger><SelectValue placeholder="Select operator..." /></SelectTrigger>
                            <SelectContent>
                                {availableOperators.map(op => (
                                    <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex-grow space-y-1">
                        {renderValueInput()}
                    </div>
                </div>
            </div>

        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save Condition</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 