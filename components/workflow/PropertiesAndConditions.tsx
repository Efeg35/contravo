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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { PropertyEditorModal } from './PropertyEditorModal';
import { ConditionEditorModal } from './ConditionEditorModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertiesAndConditionsProps {
  schema: WorkflowSchema;
  onSchemaChange: (schema: WorkflowSchema) => void;
  isEditable?: boolean;
  templateId: string;
  refreshForm?: () => void;
}

// Ironclad-style Property Selector Modal Component
const PropertySelectorModal = ({ 
  isOpen, 
  onClose, 
  onSelectExisting, 
  onCreateNew, 
  existingProperties,
  propertyGroups
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelectExisting: (property: WorkflowProperty) => void;
  onCreateNew: (groupId: string) => void;
  existingProperties: WorkflowProperty[];
  propertyGroups: Array<{id: string, name: string}>;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState('');
  
  const filteredProperties = existingProperties.filter(prop => 
    prop.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Özellik Ekle</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex flex-col h-full">
          {/* Search Existing Properties */}
          <div className="flex-shrink-0">
            <label className="block text-sm font-medium mb-2">
              Mevcut Özellikleri Ara
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Özellik adını yazın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Properties List - Always visible with scroll */}
          <div className="flex-1 min-h-0">
            <div className="h-64 overflow-y-auto border rounded-md bg-gray-50">
              {filteredProperties.length > 0 ? (
                filteredProperties.map(property => (
                  <div
                    key={property.id}
                    className="flex items-center justify-between p-3 hover:bg-white cursor-pointer border-b last:border-b-0 bg-white mx-1 my-1 rounded shadow-sm"
                    onClick={() => {
                      onSelectExisting(property);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                        property.type === 'text' ? 'bg-blue-100 text-blue-800' :
                        property.type === 'email' ? 'bg-green-100 text-green-800' :
                        property.type === 'date' ? 'bg-purple-100 text-purple-800' :
                        property.type === 'number' ? 'bg-orange-100 text-orange-800' :
                        property.type === 'select' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.type === 'text' ? 'T' :
                         property.type === 'email' ? '@' :
                         property.type === 'date' ? '📅' :
                         property.type === 'number' ? '#' :
                         property.type === 'select' ? '▼' :
                         property.type === 'user' ? '👤' :
                         property.type === 'boolean' ? '☑' :
                         'T'}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{property.name}</div>
                        {property.description && (
                          <div className="text-xs text-gray-500">{property.description}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 capitalize">{property.type}</div>
                  </div>
                ))
              ) : existingProperties.length === 0 ? (
                <div className="p-8 text-sm text-gray-500 text-center">
                  <div className="mb-2">🔍</div>
                  <div>Henüz hiç özellik yok</div>
                  <div className="text-xs">İlk özelliğinizi oluşturun</div>
                </div>
              ) : (
                <div className="p-8 text-sm text-gray-500 text-center">
                  <div className="mb-2">🔍</div>
                  <div>"{searchTerm}" için özellik bulunamadı</div>
                  <div className="text-xs">Yeni özellik oluşturabilirsiniz</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Create New Property */}
          <div className="flex-shrink-0 pt-4 border-t space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                Hangi gruba eklensin?
              </label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger>
                  <SelectValue placeholder="Grup seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {propertyGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              onClick={() => {
                if (selectedGroupId) {
                  onCreateNew(selectedGroupId);
                  onClose();
                }
              }}
              disabled={!selectedGroupId}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              <Plus className="h-4 w-4 mr-2" />
              Yeni Özellik Oluştur
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

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
  
  // Ironclad-style property selector state
  const [isPropertySelectorOpen, setIsPropertySelectorOpen] = useState(false);

  if (!schema) return null;

  const handlePropertyClick = (property: WorkflowProperty, groupId: string) => {
    setEditingProperty({ property, groupId });
    setIsModalOpen(true);
  };

  const handleConditionClick = (condition: WorkflowCondition) => {
    setEditingCondition(condition);
    setIsConditionModalOpen(true);
  };

  // Ironclad-style: Show property selector modal instead of directly opening editor
  const addNewProperty = () => {
    setIsPropertySelectorOpen(true);
  };

  // Handle selecting existing property from other groups
  const handleSelectExistingProperty = async (property: WorkflowProperty) => {
    try {
      // Önce modalı kapat
      setIsPropertySelectorOpen(false);
      // Sonra property'yi forma ekle
      await handleAddToForm(property);
    } catch (error) {
      console.error('Mevcut özellik eklenirken hata:', error);
    }
  };

  // Handle creating new property
  const handleCreateNewProperty = (groupId: string) => {
    setEditingProperty({ property: null, groupId });
    setIsModalOpen(true);
  };

  const addNewCondition = () => {
    setEditingCondition(null);
    setIsConditionModalOpen(true);
  };

  // Get all existing properties from all groups for search
  const getAllProperties = () => {
    return schema.propertyGroups.flatMap(group => group.properties);
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
      const response = await fetch(`/api/workflow-templates/${templateId}/form-fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addFromProperty',
          property: {
            id: property.id,
            name: property.name,
            type: property.type,
            required: property.required,
            description: property.description,
            options: property.options
          }
        })
      });
      
      const result = await response.json();
      console.log('Alan ekleme sonucu:', result);
      
      if (result && result.success) {
        if (refreshForm) {
          refreshForm();
        }
      } else {
        alert(result.message || 'Alan eklenirken bir hata oluştu.');
      }
    } catch (e) {
      console.error('Alan eklenirken hata:', e);
      alert('Sunucuya ulaşılamadı veya beklenmeyen bir hata oluştu.');
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
        {isEditable && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addNewProperty}
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
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
              <span>{group.name} ({group.properties.length})</span>
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
            <span>CONDITIONS ({schema.conditions.length})</span>
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

      <PropertySelectorModal
        isOpen={isPropertySelectorOpen}
        onClose={() => setIsPropertySelectorOpen(false)}
        onSelectExisting={handleSelectExistingProperty}
        onCreateNew={handleCreateNewProperty}
        existingProperties={getAllProperties()}
        propertyGroups={schema.propertyGroups.map(g => ({id: g.id, name: g.name}))}
      />
    </aside>
  );
}; 