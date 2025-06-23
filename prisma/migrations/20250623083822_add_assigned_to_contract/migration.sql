-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Contract" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL,
    "value" REAL,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "expirationDate" DATETIME,
    "noticePeriodDays" INTEGER,
    "renewalDate" DATETIME,
    "reminderDays" JSONB DEFAULT [90, 60, 30, 7],
    "autoRenewal" BOOLEAN NOT NULL DEFAULT false,
    "renewalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "lastReminderSent" DATETIME,
    "otherPartyName" TEXT,
    "otherPartyEmail" TEXT,
    "assignedToId" TEXT,
    "companyId" TEXT,
    "templateId" TEXT,
    "workflowTemplateId" TEXT,
    "parentContractId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("autoRenewal", "companyId", "content", "createdAt", "createdById", "description", "endDate", "expirationDate", "id", "lastReminderSent", "noticePeriodDays", "otherPartyEmail", "otherPartyName", "parentContractId", "reminderDays", "renewalDate", "renewalStatus", "startDate", "status", "templateId", "title", "type", "updatedAt", "updatedById", "value", "workflowTemplateId") SELECT "autoRenewal", "companyId", "content", "createdAt", "createdById", "description", "endDate", "expirationDate", "id", "lastReminderSent", "noticePeriodDays", "otherPartyEmail", "otherPartyName", "parentContractId", "reminderDays", "renewalDate", "renewalStatus", "startDate", "status", "templateId", "title", "type", "updatedAt", "updatedById", "value", "workflowTemplateId" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_type_idx" ON "Contract"("type");
CREATE INDEX "Contract_assignedToId_idx" ON "Contract"("assignedToId");
CREATE INDEX "Contract_companyId_idx" ON "Contract"("companyId");
CREATE INDEX "Contract_createdById_idx" ON "Contract"("createdById");
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");
CREATE INDEX "Contract_updatedAt_idx" ON "Contract"("updatedAt");
CREATE INDEX "Contract_startDate_idx" ON "Contract"("startDate");
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");
CREATE INDEX "Contract_expirationDate_idx" ON "Contract"("expirationDate");
CREATE INDEX "Contract_renewalDate_idx" ON "Contract"("renewalDate");
CREATE INDEX "Contract_renewalStatus_idx" ON "Contract"("renewalStatus");
CREATE INDEX "Contract_autoRenewal_idx" ON "Contract"("autoRenewal");
CREATE INDEX "Contract_status_companyId_idx" ON "Contract"("status", "companyId");
CREATE INDEX "Contract_type_status_idx" ON "Contract"("type", "status");
CREATE INDEX "Contract_createdById_status_idx" ON "Contract"("createdById", "status");
CREATE INDEX "Contract_assignedToId_status_idx" ON "Contract"("assignedToId", "status");
CREATE INDEX "Contract_endDate_renewalStatus_idx" ON "Contract"("endDate", "renewalStatus");
CREATE INDEX "Contract_expirationDate_status_idx" ON "Contract"("expirationDate", "status");
CREATE INDEX "Contract_renewalDate_renewalStatus_idx" ON "Contract"("renewalDate", "renewalStatus");
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");
CREATE INDEX "Contract_title_idx" ON "Contract"("title");
CREATE INDEX "Contract_otherPartyName_idx" ON "Contract"("otherPartyName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
