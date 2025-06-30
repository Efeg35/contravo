/*
  Warnings:

  - You are about to drop the column `columnSpan` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `cssClass` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `gridPosition` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `isCollapsible` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `isExpanded` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `rowSpan` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `sectionOrder` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `sectionTitle` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `FormField` table. All the data in the column will be lost.
  - You are about to drop the column `columnSpan` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `cssClass` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `gridPosition` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `height` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `isCollapsible` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `isExpanded` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `rowSpan` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sectionOrder` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `sectionTitle` on the `WorkflowTemplate` table. All the data in the column will be lost.
  - You are about to drop the column `width` on the `WorkflowTemplate` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "FormSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "isCollapsible" BOOLEAN NOT NULL DEFAULT true,
    "isCollapsed" BOOLEAN NOT NULL DEFAULT false,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "showConditions" JSONB,
    "hideConditions" JSONB,
    "allowedRoles" JSONB,
    "readOnlyRoles" JSONB,
    "validationRules" JSONB,
    "dependsOn" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "helpText" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "FormSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_FormField" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "label" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "placeholder" TEXT,
    "options" JSONB,
    "order" INTEGER NOT NULL,
    "minLength" INTEGER,
    "maxLength" INTEGER,
    "minValue" REAL,
    "maxValue" REAL,
    "pattern" TEXT,
    "customError" TEXT,
    "dependsOn" TEXT,
    "dependsOnValue" TEXT,
    "helpText" TEXT,
    "isConditional" BOOLEAN NOT NULL DEFAULT false,
    "validationRules" JSONB,
    "defaultValue" TEXT,
    "isReadOnly" BOOLEAN NOT NULL DEFAULT false,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "showWhen" JSONB,
    "hideWhen" JSONB,
    "validateWhen" JSONB,
    "errorMessage" TEXT,
    "warningMessage" TEXT,
    "successMessage" TEXT,
    "fieldGroup" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "realTimeValidation" BOOLEAN NOT NULL DEFAULT false,
    "sectionId" TEXT,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "FormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FormField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormField" ("apiKey", "customError", "defaultValue", "dependsOn", "dependsOnValue", "errorMessage", "fieldGroup", "helpText", "hideWhen", "id", "isConditional", "isHidden", "isReadOnly", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "priority", "realTimeValidation", "showWhen", "successMessage", "templateId", "type", "validateWhen", "validationRules", "warningMessage") SELECT "apiKey", "customError", "defaultValue", "dependsOn", "dependsOnValue", "errorMessage", "fieldGroup", "helpText", "hideWhen", "id", "isConditional", "isHidden", "isReadOnly", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "priority", "realTimeValidation", "showWhen", "successMessage", "templateId", "type", "validateWhen", "validationRules", "warningMessage" FROM "FormField";
DROP TABLE "FormField";
ALTER TABLE "new_FormField" RENAME TO "FormField";
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
    "launchFormLayout" JSONB,
    "enableRealTimeValidation" BOOLEAN NOT NULL DEFAULT false,
    "validationMode" TEXT NOT NULL DEFAULT 'SUBMIT',
    "showValidationSummary" BOOLEAN NOT NULL DEFAULT true,
    "allowPartialSave" BOOLEAN NOT NULL DEFAULT false,
    "formRules" JSONB,
    CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowTemplate" ("allowPartialSave", "companyId", "createdAt", "createdById", "description", "documentName", "documentUrl", "enableRealTimeValidation", "formRules", "id", "launchFormLayout", "name", "showValidationSummary", "status", "templateFileUrl", "updatedAt", "validationMode") SELECT "allowPartialSave", "companyId", "createdAt", "createdById", "description", "documentName", "documentUrl", "enableRealTimeValidation", "formRules", "id", "launchFormLayout", "name", "showValidationSummary", "status", "templateFileUrl", "updatedAt", "validationMode" FROM "WorkflowTemplate";
DROP TABLE "WorkflowTemplate";
ALTER TABLE "new_WorkflowTemplate" RENAME TO "WorkflowTemplate";
CREATE UNIQUE INDEX "WorkflowTemplate_name_key" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_name_idx" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FormSection_templateId_idx" ON "FormSection"("templateId");

-- CreateIndex
CREATE INDEX "FormSection_order_idx" ON "FormSection"("order");

-- CreateIndex
CREATE INDEX "FormSection_isHidden_idx" ON "FormSection"("isHidden");

-- CreateIndex
CREATE INDEX "FormSection_isRequired_idx" ON "FormSection"("isRequired");
