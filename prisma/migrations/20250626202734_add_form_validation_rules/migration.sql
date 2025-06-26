-- CreateTable
CREATE TABLE "FormValidationRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" TEXT NOT NULL,
    "targetFields" JSONB NOT NULL,
    "conditions" JSONB NOT NULL,
    "validationLogic" JSONB NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'ERROR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "templateId" TEXT NOT NULL,
    CONSTRAINT "FormValidationRule_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "templateId" TEXT NOT NULL,
    CONSTRAINT "FormField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormField" ("apiKey", "customError", "dependsOn", "dependsOnValue", "helpText", "id", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "templateId", "type") SELECT "apiKey", "customError", "dependsOn", "dependsOnValue", "helpText", "id", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "templateId", "type" FROM "FormField";
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
    "launchFormLayout" JSONB,
    "enableRealTimeValidation" BOOLEAN NOT NULL DEFAULT false,
    "validationMode" TEXT NOT NULL DEFAULT 'SUBMIT',
    "showValidationSummary" BOOLEAN NOT NULL DEFAULT true,
    "allowPartialSave" BOOLEAN NOT NULL DEFAULT false,
    "formRules" JSONB,
    CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowTemplate" ("companyId", "createdAt", "createdById", "description", "documentName", "documentUrl", "id", "launchFormLayout", "name", "status", "templateFileUrl", "updatedAt") SELECT "companyId", "createdAt", "createdById", "description", "documentName", "documentUrl", "id", "launchFormLayout", "name", "status", "templateFileUrl", "updatedAt" FROM "WorkflowTemplate";
DROP TABLE "WorkflowTemplate";
ALTER TABLE "new_WorkflowTemplate" RENAME TO "WorkflowTemplate";
CREATE UNIQUE INDEX "WorkflowTemplate_name_key" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_name_idx" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FormValidationRule_templateId_idx" ON "FormValidationRule"("templateId");

-- CreateIndex
CREATE INDEX "FormValidationRule_ruleType_idx" ON "FormValidationRule"("ruleType");

-- CreateIndex
CREATE INDEX "FormValidationRule_isActive_idx" ON "FormValidationRule"("isActive");

-- CreateIndex
CREATE INDEX "FormValidationRule_priority_idx" ON "FormValidationRule"("priority");
