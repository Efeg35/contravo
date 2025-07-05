"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { PropertyType, PROPERTY_ICONS, PROPERTY_COLORS } from '@/types/workflow';

interface QuestionType {
  type: PropertyType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

interface QuestionTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: PropertyType) => void;
}

const QUESTION_TYPES: QuestionType[] = [
  {
    type: 'text',
    label: 'Short Response',
    description: 'A single line of text',
    icon: PROPERTY_ICONS.text,
    color: PROPERTY_COLORS.text
  },
  {
    type: 'textarea',
    label: 'Long Response',
    description: 'Multiple lines of text',
    icon: PROPERTY_ICONS.textarea,
    color: PROPERTY_COLORS.textarea
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Email address field',
    icon: PROPERTY_ICONS.email,
    color: PROPERTY_COLORS.email
  },
  {
    type: 'phone',
    label: 'Phone Number',
    description: 'Phone number with formatting',
    icon: PROPERTY_ICONS.phone,
    color: PROPERTY_COLORS.phone
  },
  {
    type: 'url',
    label: 'Website URL',
    description: 'Web address or link',
    icon: PROPERTY_ICONS.url,
    color: PROPERTY_COLORS.url
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric value',
    icon: PROPERTY_ICONS.number,
    color: PROPERTY_COLORS.number
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Date picker',
    icon: PROPERTY_ICONS.date,
    color: PROPERTY_COLORS.date
  },
  {
    type: 'date_range',
    label: 'Date Range',
    description: 'Start and end date selection',
    icon: PROPERTY_ICONS.date_range,
    color: PROPERTY_COLORS.date_range
  },
  {
    type: 'duration',
    label: 'Duration',
    description: 'Time duration field',
    icon: PROPERTY_ICONS.duration,
    color: PROPERTY_COLORS.duration
  },
  {
    type: 'select',
    label: 'Single Choice',
    description: 'Choose one from multiple options',
    icon: PROPERTY_ICONS.select,
    color: PROPERTY_COLORS.select
  },
  {
    type: 'multi_select',
    label: 'Multiple Choice',
    description: 'Choose multiple from options',
    icon: PROPERTY_ICONS.multi_select,
    color: PROPERTY_COLORS.multi_select
  },
  {
    type: 'boolean',
    label: 'Yes/No',
    description: 'True or false selection',
    icon: PROPERTY_ICONS.boolean,
    color: PROPERTY_COLORS.boolean
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    description: 'Single checkbox option',
    icon: PROPERTY_ICONS.checkbox,
    color: PROPERTY_COLORS.checkbox
  },
  {
    type: 'user',
    label: 'User Picker',
    description: 'Select user from organization',
    icon: PROPERTY_ICONS.user,
    color: PROPERTY_COLORS.user
  },
  {
    type: 'file_upload',
    label: 'File Upload',
    description: 'Upload documents or files',
    icon: PROPERTY_ICONS.file_upload,
    color: PROPERTY_COLORS.file_upload
  }
];

export const QuestionTypeSelector: React.FC<QuestionTypeSelectorProps> = ({
  isOpen,
  onClose,
  onSelectType
}) => {
  const handleTypeSelect = (type: PropertyType) => {
    onSelectType(type);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add Question to Form</DialogTitle>
          <p className="text-sm text-gray-600 mt-2">
            Choose the type of question you want to add to your form.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          {QUESTION_TYPES.map((questionType) => (
            <button
              key={questionType.type}
              onClick={() => handleTypeSelect(questionType.type)}
              className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${questionType.color} text-sm font-bold flex-shrink-0 group-hover:scale-110 transition-transform`}>
                {questionType.icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                  {questionType.label}
                </h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                  {questionType.description}
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 