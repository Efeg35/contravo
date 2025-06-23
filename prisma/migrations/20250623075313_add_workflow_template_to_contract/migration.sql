/*
  Warnings:

  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UsersOnTeams" (
    "userId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("userId", "teamId"),
    CONSTRAINT "UsersOnTeams_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UsersOnTeams_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "saved_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "configuration" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "authorId" TEXT NOT NULL,
    CONSTRAINT "saved_reports_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report_schedules" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cron" TEXT NOT NULL,
    "recipients" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "savedReportId" TEXT NOT NULL,
    CONSTRAINT "report_schedules_savedReportId_fkey" FOREIGN KEY ("savedReportId") REFERENCES "saved_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "schedule_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "details" TEXT,
    "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduleId" TEXT NOT NULL,
    CONSTRAINT "schedule_logs_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "report_schedules" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClausesOnContracts" (
    "contractId" TEXT NOT NULL,
    "clauseId" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isModified" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("contractId", "clauseId"),
    CONSTRAINT "ClausesOnContracts_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClausesOnContracts_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkflowTemplateStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "templateId" TEXT NOT NULL,
    "teamId" TEXT,
    "approverRole" TEXT,
    CONSTRAINT "WorkflowTemplateStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplateStep_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Clause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'COMPANY',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "companyId" TEXT,
    "parentClauseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clause_parentClauseId_fkey" FOREIGN KEY ("parentClauseId") REFERENCES "Clause" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Clause_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Clause_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Clause" ("approvalStatus", "category", "companyId", "content", "createdAt", "createdById", "description", "id", "isActive", "parentClauseId", "title", "updatedAt", "version", "visibility") SELECT "approvalStatus", "category", "companyId", "content", "createdAt", "createdById", "description", "id", "isActive", "parentClauseId", "title", "updatedAt", "version", "visibility" FROM "Clause";
DROP TABLE "Clause";
ALTER TABLE "new_Clause" RENAME TO "Clause";
CREATE INDEX "Clause_category_idx" ON "Clause"("category");
CREATE INDEX "Clause_visibility_idx" ON "Clause"("visibility");
CREATE INDEX "Clause_companyId_idx" ON "Clause"("companyId");
CREATE INDEX "Clause_createdById_idx" ON "Clause"("createdById");
CREATE INDEX "Clause_approvalStatus_idx" ON "Clause"("approvalStatus");
CREATE INDEX "Clause_isActive_idx" ON "Clause"("isActive");
CREATE TABLE "new_CompanyInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    CONSTRAINT "CompanyInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyInvite_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompanyInvite" ("companyId", "createdAt", "email", "id", "invitedById", "role", "status", "updatedAt") SELECT "companyId", "createdAt", "email", "id", "invitedById", "role", "status", "updatedAt" FROM "CompanyInvite";
DROP TABLE "CompanyInvite";
ALTER TABLE "new_CompanyInvite" RENAME TO "CompanyInvite";
CREATE INDEX "CompanyInvite_email_idx" ON "CompanyInvite"("email");
CREATE INDEX "CompanyInvite_status_idx" ON "CompanyInvite"("status");
CREATE INDEX "CompanyInvite_createdAt_idx" ON "CompanyInvite"("createdAt");
CREATE UNIQUE INDEX "CompanyInvite_companyId_email_key" ON "CompanyInvite"("companyId", "email");
CREATE TABLE "new_CompanyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompanyUser" ("companyId", "createdAt", "id", "role", "updatedAt", "userId") SELECT "companyId", "createdAt", "id", "role", "updatedAt", "userId" FROM "CompanyUser";
DROP TABLE "CompanyUser";
ALTER TABLE "new_CompanyUser" RENAME TO "CompanyUser";
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");
CREATE INDEX "CompanyUser_role_idx" ON "CompanyUser"("role");
CREATE UNIQUE INDEX "CompanyUser_companyId_userId_key" ON "CompanyUser"("companyId", "userId");
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
    "companyId" TEXT,
    "templateId" TEXT,
    "workflowTemplateId" TEXT,
    "parentContractId" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Contract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Contract" ("companyId", "content", "createdAt", "createdById", "description", "endDate", "id", "otherPartyEmail", "otherPartyName", "startDate", "status", "templateId", "title", "type", "updatedAt", "updatedById", "value") SELECT "companyId", "content", "createdAt", "createdById", "description", "endDate", "id", "otherPartyEmail", "otherPartyName", "startDate", "status", "templateId", "title", "type", "updatedAt", "updatedById", "value" FROM "Contract";
DROP TABLE "Contract";
ALTER TABLE "new_Contract" RENAME TO "Contract";
CREATE INDEX "Contract_status_idx" ON "Contract"("status");
CREATE INDEX "Contract_type_idx" ON "Contract"("type");
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
CREATE INDEX "Contract_endDate_renewalStatus_idx" ON "Contract"("endDate", "renewalStatus");
CREATE INDEX "Contract_expirationDate_status_idx" ON "Contract"("expirationDate", "status");
CREATE INDEX "Contract_renewalDate_renewalStatus_idx" ON "Contract"("renewalDate", "renewalStatus");
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");
CREATE INDEX "Contract_title_idx" ON "Contract"("title");
CREATE INDEX "Contract_otherPartyName_idx" ON "Contract"("otherPartyName");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "passwordChangedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "department" TEXT,
    "departmentRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "emailVerified", "id", "image", "name", "password", "passwordChangedAt", "role", "updatedAt") SELECT "createdAt", "email", "emailVerified", "id", "image", "name", "password", "passwordChangedAt", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "saved_reports_authorId_idx" ON "saved_reports"("authorId");

-- CreateIndex
CREATE INDEX "saved_reports_createdAt_idx" ON "saved_reports"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "report_schedules_savedReportId_key" ON "report_schedules"("savedReportId");

-- CreateIndex
CREATE INDEX "report_schedules_status_idx" ON "report_schedules"("status");

-- CreateIndex
CREATE INDEX "report_schedules_createdAt_idx" ON "report_schedules"("createdAt");

-- CreateIndex
CREATE INDEX "schedule_logs_scheduleId_idx" ON "schedule_logs"("scheduleId");

-- CreateIndex
CREATE INDEX "schedule_logs_executedAt_idx" ON "schedule_logs"("executedAt");

-- CreateIndex
CREATE INDEX "schedule_logs_status_idx" ON "schedule_logs"("status");

-- CreateIndex
CREATE INDEX "ClausesOnContracts_contractId_idx" ON "ClausesOnContracts"("contractId");

-- CreateIndex
CREATE INDEX "ClausesOnContracts_clauseId_idx" ON "ClausesOnContracts"("clauseId");

-- CreateIndex
CREATE INDEX "ClausesOnContracts_addedAt_idx" ON "ClausesOnContracts"("addedAt");

-- CreateIndex
CREATE INDEX "ClausesOnContracts_isModified_idx" ON "ClausesOnContracts"("isModified");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplate_name_key" ON "WorkflowTemplate"("name");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_name_idx" ON "WorkflowTemplate"("name");

-- CreateIndex
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStep_templateId_idx" ON "WorkflowTemplateStep"("templateId");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStep_order_idx" ON "WorkflowTemplateStep"("order");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStep_teamId_idx" ON "WorkflowTemplateStep"("teamId");

-- CreateIndex
CREATE INDEX "WorkflowTemplateStep_approverRole_idx" ON "WorkflowTemplateStep"("approverRole");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowTemplateStep_templateId_order_key" ON "WorkflowTemplateStep"("templateId", "order");
