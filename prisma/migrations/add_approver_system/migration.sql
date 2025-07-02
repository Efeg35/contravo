-- Add new approver system tables
CREATE TABLE "WorkflowApprover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "whenToApprove" TEXT NOT NULL DEFAULT 'Always',
    "resetWhen" TEXT NOT NULL DEFAULT 'Always',
    "assignmentType" TEXT,
    "approverType" TEXT NOT NULL, -- 'USER', 'GROUP', 'ROLE'
    "approverId" TEXT, -- Actual user/group/role ID
    "approverName" TEXT, -- Display name
    "approverEmail" TEXT, -- For users
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Conditions for approvers
CREATE TABLE "ApproverCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approverId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- 'WHEN_TO_APPROVE', 'RESET_WHEN', 'ADVANCED'
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "logicalOperator" TEXT DEFAULT 'AND', -- 'AND', 'OR'
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("approverId") REFERENCES "WorkflowApprover" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Indexes for performance
CREATE UNIQUE INDEX "WorkflowApprover_templateId_order_key" ON "WorkflowApprover"("templateId", "order");
CREATE INDEX "WorkflowApprover_templateId_idx" ON "WorkflowApprover"("templateId");
CREATE INDEX "WorkflowApprover_order_idx" ON "WorkflowApprover"("order");
CREATE INDEX "WorkflowApprover_approverType_idx" ON "WorkflowApprover"("approverType");
CREATE INDEX "ApproverCondition_approverId_idx" ON "ApproverCondition"("approverId");
CREATE INDEX "ApproverCondition_type_idx" ON "ApproverCondition"("type"); 