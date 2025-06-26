"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { WorkflowSchema, WorkflowProperty, WorkflowCondition } from '@/types/workflow';
import { PROPERTY_ICONS, PROPERTY_COLORS } from '@/types/workflow';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { PropertyEditorModal } from './PropertyEditorModal';
import { ConditionEditorModal } from './ConditionEditorModal';
import { addFieldToLaunchForm } from '../../src/lib/actions/workflow-template-actions';

interface PropertiesAndConditionsProps {
  schema: WorkflowSchema;
  onSchemaChange: (schema: WorkflowSchema) => void;
  isEditable?: boolean;
  templateId: string;
  refreshForm?: () => void;
}

export const PropertiesAndConditions: React.FC<PropertiesAndConditionsProps> = ({
  schema,
  onSchemaChange,
  isEditable = true,
  templateId,
  refreshForm
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<{ property: WorkflowProperty | null, groupId: string | null }>({ property: null, groupId: null });
  const [isConditionModalOpen, setIsConditionModalOpen] = useState(false);
  const [editingCondition, setEditingCondition] = useState<WorkflowCondition | null>(null);

  if (!schema) return null;

  const handlePropertyClick = (property: WorkflowProperty, groupId: string) => {
    setEditingProperty({ property, groupId });
    setIsModalOpen(true);
  };

  const handleConditionClick = (condition: WorkflowCondition) => {
    setEditingCondition(condition);
    setIsConditionModalOpen(true);
  };

  const addNewProperty = (groupId: string) => {
    setEditingProperty({ property: null, groupId });
    setIsModalOpen(true);
  };

  const addNewCondition = () => {
    setEditingCondition(null);
    setIsConditionModalOpen(true);
  };

  const handleSaveProperty = (savedProperty: WorkflowProperty) => {
    const newSchema = JSON.parse(JSON.stringify(schema)); // Deep copy to avoid mutation
    
    const groupIndex = newSchema.propertyGroups.findIndex((g:any) => g.id === editingProperty.groupId);
    if (groupIndex === -1) {
        console.error("Group not found!");
        return;
    }

    if (editingProperty.property) { // Editing existing
        const propIndex = newSchema.propertyGroups[groupIndex].properties.findIndex((p:any) => p.id === savedProperty.id);
        if (propIndex !== -1) {
            newSchema.propertyGroups[groupIndex].properties[propIndex] = savedProperty;
        }
    } else { // Adding new
        newSchema.propertyGroups[groupIndex].properties.push(savedProperty);
    }

    onSchemaChange(newSchema);
    setIsModalOpen(false);
  };

  const handleSaveCondition = (savedCondition: WorkflowCondition) => {
    const newSchema = JSON.parse(JSON.stringify(schema));
    const conditionIndex = newSchema.conditions.findIndex((c: WorkflowCondition) => c.id === savedCondition.id);

    if (conditionIndex !== -1) { // Editing existing
        newSchema.conditions[conditionIndex] = savedCondition;
    } else { // Adding new
        newSchema.conditions.push(savedCondition);
    }

    onSchemaChange(newSchema);
    setIsConditionModalOpen(false);
  };

  const handleDeleteCondition = (conditionId: string) => {
    if (window.confirm('Are you sure you want to delete this condition?')) {
        const newSchema = JSON.parse(JSON.stringify(schema));
        newSchema.conditions = newSchema.conditions.filter((c: WorkflowCondition) => c.id !== conditionId);
        onSchemaChange(newSchema);
    }
  };

  const handleAddToForm = async (property: WorkflowProperty) => {
    try {
      const result = await addFieldToLaunchForm({ 
        templateId, 
        property: {
          id: property.id,
          name: property.name,
          type: property.type,
          required: property.required,
          description: property.description,
          options: property.options
        }
      });
      console.log('Alan ekleme sonucu:', result);
      if (result && result.success && refreshForm) {
        refreshForm();
      }
    } catch (e) {
      console.error('Alan eklenirken hata:', e);
    }
  };

  const getPropertyIcon = (type: string) => {
    return PROPERTY_ICONS[type as keyof typeof PROPERTY_ICONS] || 'T';
  };

  const getPropertyColor = (type: string) => {
    return PROPERTY_COLORS[type as keyof typeof PROPERTY_COLORS] || 'bg-gray-100';
  };

  const renderProperty = (property: WorkflowProperty, groupId: string) => (
    <div 
      key={property.id}
      className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center justify-between group cursor-pointer"
      onClick={() => isEditable && handlePropertyClick(property, groupId)}
    >
      <div className="flex items-center gap-2">
        <span 
          className={`w-4 h-4 ${getPropertyColor(property.type)} rounded flex items-center justify-center text-xs font-medium`}
        >
          {getPropertyIcon(property.type)}
        </span>
        <span className="text-sm">{property.name}</span>
        {property.required && (
          <span className="text-red-500 text-xs ml-1">*</span>
        )}
      </div>
      {isEditable && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleAddToForm(property); }}>
            <Plus className="h-3 w-3" />
          </Button>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handlePropertyClick(property, groupId); }}>
              <Edit className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500">
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderCondition = (condition: WorkflowCondition) => (
    <div 
      key={condition.id}
      className="px-4 py-2 hover:bg-gray-100 rounded-md flex items-center justify-between group cursor-pointer"
      onClick={() => isEditable && handleConditionClick(condition)}
    >
      <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-purple-100 rounded flex items-center justify-center text-xs">
          ↪
        </span>
        <span className="text-sm">{condition.name}</span>
      </div>
      {isEditable && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleConditionClick(condition); }}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); handleDeleteCondition(condition.id); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <aside className="w-[380px] flex-shrink-0 bg-white border-r p-6 overflow-y-auto">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Properties and Conditions</h2>
      </div>

      {/* Lifecycle Preset */}
      {schema.lifecyclePreset?.enabled && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
          <h3 className="font-semibold text-gray-800">
            LIFECYCLE PRESET ({schema.lifecyclePreset.questionsCount})
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Monitor and edit any contract's renewals and expirations with an applied set of 
            properties, conditions, and date questions.
          </p>
          <a href="#" className="text-sm text-blue-600 mt-2 block">
            {schema.lifecyclePreset.questionsCount} questions added. Edit launch form
          </a>
        </div>
      )}

      {/* Dynamic Property Groups and Conditions */}
      <Accordion type="multiple" className="w-full mt-4" defaultValue={[...schema.propertyGroups.map(g => g.id), 'conditions']}>
        {/* Property Groups */}
        {schema.propertyGroups.map((group) => (
          <AccordionItem key={group.id} value={group.id}>
            <AccordionTrigger>
              <div className="flex w-full items-center justify-between">
                <span>{group.name} ({group.properties.length})</span>
                {isEditable && (
                  <div
                    role="button"
                    aria-label={`Add property to ${group.name}`}
                    className="p-1 rounded-full hover:bg-gray-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNewProperty(group.id);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </div>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1">
                {group.properties.map(p => renderProperty(p, group.id))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Conditions */}
        <AccordionItem value="conditions">
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between">
              <span>CONDITIONS ({schema.conditions.length})</span>
              {isEditable && (
                 <div
                  role="button"
                  aria-label="Add new condition"
                  className="p-1 rounded-full hover:bg-gray-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    addNewCondition();
                  }}
                >
                  <Plus className="h-4 w-4" />
                </div>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-1">
              {schema.conditions.map(renderCondition)}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <PropertyEditorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProperty}
        property={editingProperty.property}
      />

      <ConditionEditorModal
        isOpen={isConditionModalOpen}
        onClose={() => setIsConditionModalOpen(false)}
        onSave={handleSaveCondition}
        condition={editingCondition}
        properties={schema.propertyGroups.flatMap(g => g.properties)}
      />
    </aside>
  );
}; 