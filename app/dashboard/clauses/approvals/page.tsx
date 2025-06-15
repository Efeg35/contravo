'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCheck } from 'lucide-react';
import ClauseApprovalWorkflow from '@/components/ClauseApprovalWorkflow';

const ClauseApprovalsPage = () => {
  const router = useRouter();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="p-2"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CheckCheck className="h-6 w-6 text-blue-600" />
              Clause Onay İş Akışı
            </h1>
            <p className="text-gray-600">
              Clause onay süreçlerini takip edin ve yönetin
            </p>
          </div>
        </div>
      </div>

      {/* Approval Workflow */}
      <ClauseApprovalWorkflow />
    </div>
  );
};

export default ClauseApprovalsPage; 