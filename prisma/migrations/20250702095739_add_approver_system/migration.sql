/*
  Warnings:

  - You are about to drop the column `reviewEmailTemplates` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `reviewSettings` on the `WorkflowTemplate` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ApproverCondition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "approverId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "logicalOperator" TEXT NOT NULL DEFAULT 'AND',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApproverCondition_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "WorkflowApprover" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ApproverCondition" ("approverId", "createdAt", "field", "id", "logicalOperator", "operator", "type", "value") SELECT "approverId", "createdAt", "field", "id", coalesce("logicalOperator", 'AND') AS "logicalOperator", "operator", "type", "value" FROM "ApproverCondition";
DROP TABLE "ApproverCondition";
ALTER TABLE "new_ApproverCondition" RENAME TO "ApproverCondition";
CREATE INDEX "ApproverCondition_approverId_idx" ON "ApproverCondition"("approverId");
CREATE INDEX "ApproverCondition_type_idx" ON "ApproverCondition"("type");
CREATE TABLE "new_WorkflowApprover" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "whenToApprove" TEXT NOT NULL DEFAULT 'Always',
    "resetWhen" TEXT NOT NULL DEFAULT 'Always',
    "assignmentType" TEXT,
    "approverType" TEXT NOT NULL,
    "approverId" TEXT,
    "approverName" TEXT,
    "approverEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkflowApprover_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowApprover" ("approverEmail", "approverId", "approverName", "approverType", "assignmentType", "createdAt", "id", "instructions", "order", "resetWhen", "templateId", "title", "updatedAt", "whenToApprove") SELECT "approverEmail", "approverId", "approverName", "approverType", "assignmentType", "createdAt", "id", "instructions", "order", "resetWhen", "templateId", "title", "updatedAt", "whenToApprove" FROM "WorkflowApprover";
DROP TABLE "WorkflowApprover";
ALTER TABLE "new_WorkflowApprover" RENAME TO "WorkflowApprover";
CREATE INDEX "WorkflowApprover_templateId_idx" ON "WorkflowApprover"("templateId");
CREATE INDEX "WorkflowApprover_order_idx" ON "WorkflowApprover"("order");
CREATE INDEX "WorkflowApprover_approverType_idx" ON "WorkflowApprover"("approverType");
CREATE UNIQUE INDEX "WorkflowApprover_templateId_order_key" ON "WorkflowApprover"("templateId", "order");
CREATE TABLE "new_WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPUBLISHED',
    "companyId" TEXT,
    "createdById" TEXT,
    "documentName" TEXT,
    "documentUrl" TEXT,
    "templateFileUrl" TEXT,
    "documentHtml" TEXT,
    "documentProperties" JSONB,
    "launchFormLayout" JSONB,
    "enableRealTimeValidation" BOOLEAN NOT NULL DEFAULT false,
    "validationMode" TEXT NOT NULL DEFAULT 'SUBMIT',
    "showValidationSummary" BOOLEAN NOT NULL DEFAULT true,
    "allowPartialSave" BOOLEAN NOT NULL DEFAULT false,
    "formRules" JSONB,
    CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowTemplate" ("allowPartialSave", "companyId", "createdAt", "createdById", "description", "documentHtml", "documentName", "documentProperties", "documentUrl", "enableRealTimeValidation", "formRules", "id", "launchFormLayout", "name", "showValidationSummary", "status", "templateFileUrl", "updatedAt", "validationMode") SELECT "allowPartialSave", "companyId", "createdAt", "createdById", "description", "documentHtml", "documentName", "documentProperties", "documentUrl", "enableRealTimeValidation", "formRules", "id", "launchFormLayout", "name", "showValidationSummary", "status", "templateFileUrl", "updatedAt", "validationMode" FROM "WorkflowTemplate";
DROP TABLE "WorkflowTemplate";
ALTER TABLE "new_WorkflowTemplate" RENAME TO "WorkflowTemplate";
CREATE UNIQUE INDEX "WorkflowTemplate_name_key" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_name_idx" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
