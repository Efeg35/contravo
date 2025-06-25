'use client';

import React from 'react';
import type { ContractStatus } from '@/app/types';

interface StageStepperProps {
  status: ContractStatus;
  className?: string;
}

// Sadece 4 ana aşama: DRAFT, REVIEW, SIGNING, ARCHIVED
const WORKFLOW_STAGES = [
  { key: 'DRAFT', label: 'Taslak', icon: '📝' },
  { key: 'REVIEW', label: 'İnceleme', icon: '👀' },
  { key: 'SIGNING', label: 'İmza', icon: '✍️' },
  { key: 'ARCHIVED', label: 'Arşiv', icon: '📦' }
] as const;

export default function StageStepper({ status, className = '' }: StageStepperProps) {
  // Mevcut aşamanın indeksini bul
  const currentStageIndex = WORKFLOW_STAGES.findIndex(stage => stage.key === status);
  
  // Eğer status bulunamazsa fallback göster
  if (currentStageIndex === -1) {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center space-x-2 px-3 py-1 bg-gray-50 border border-gray-200 rounded-full">
          <span className="text-gray-600 text-sm">❓</span>
          <span className="text-gray-700 text-sm font-medium">{status}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-1 ${className}`} title={`Mevcut aşama: ${WORKFLOW_STAGES[currentStageIndex]?.label || status}`}>
      {WORKFLOW_STAGES.map((stage, index) => {
        const isCompleted = index < currentStageIndex;
        const isCurrent = index === currentStageIndex;

        return (
          <div key={stage.key} className="flex items-center">
            {/* Aşama Dairesi - Küçültülmüş */}
            <div
              className={`
                relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all duration-300
                ${isCompleted 
                  ? 'bg-green-100 border-green-500 text-green-700' 
                  : isCurrent 
                    ? 'bg-blue-100 border-blue-500 text-blue-700 ring-1 ring-blue-200' 
                    : 'bg-gray-50 border-gray-300 text-gray-400'
                }
              `}
            >
              {isCompleted ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <span className="text-[10px] font-bold">
                  {isCurrent ? stage.icon : index + 1}
                </span>
              )}
            </div>

            {/* Bağlantı Çizgisi - Sadece son olmayan elemanlarda */}
            {index < WORKFLOW_STAGES.length - 1 && (
              <div 
                className={`
                  w-6 h-0.5 transition-all duration-300 mx-1
                  ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
} 