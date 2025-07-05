"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from '@/components/ui/textarea';
import { WorkflowProperty, PropertyType, PROPERTY_ICONS } from '@/types/workflow';
import { Plus, Trash2, Info } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';


interface PropertyEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (property: WorkflowProperty) => void;
  property: WorkflowProperty | null;
  preselectedType?: PropertyType; // Yeni: Önceden seçilmiş tip
  lockType?: boolean; // Yeni: Tipi kilitle
}

const PROPERTY_TYPES: PropertyType[] = ['text', 'textarea', 'email', 'url', 'phone', 'date', 'date_range', 'duration', 'number', 'user', 'select', 'multi_select', 'boolean', 'checkbox', 'file_upload'];

export const PropertyEditorModal = ({ isOpen, onClose, onSave, property, preselectedType, lockType = false }: PropertyEditorModalProps) => {
  const [formData, setFormData] = useState<Partial<WorkflowProperty>>({});

  useEffect(() => {
    if (property) {
      setFormData(property);
    } else {
      // Set defaults for a new property
      setFormData({
        id: uuidv4(),
        type: preselectedType || 'text',
        name: '',
        required: false,
        description: '',
        options: [],
      });
    }
  }, [property, isOpen, preselectedType]);

  const handleChange = (field: keyof WorkflowProperty, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    handleChange('options', newOptions);
  };
  
  const addOption = () => {
      const newOptions = [...(formData.options || []), ''];
      handleChange('options', newOptions);
  };

  const removeOption = (index: number) => {
      const newOptions = [...(formData.options || [])];
      newOptions.splice(index, 1);
      handleChange('options', newOptions);
  }

  const handleSave = () => {
    // Basic validation
    if (!formData.name || !formData.type) {
        alert('Property Name and Type are required.');
        return;
    }
    onSave(formData as WorkflowProperty);
  };

  // Prevent form submission on enter key press
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" onKeyDown={onKeyDown}>
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'New Property'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Counterparty Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: PropertyType) => handleChange('type', value)}
              disabled={lockType}
            >
              <SelectTrigger className={lockType ? 'bg-gray-100' : ''}>
                <SelectValue placeholder="Select a type" />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-xs font-medium`}>
                        {PROPERTY_ICONS[type]}
                      </span>
                      <span>{type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe how to use this property to avoid creating duplicates"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 