-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    CONSTRAINT "Condition_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowTemplateStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "image" TEXT,
    "password" TEXT,
    "passwordChangedAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isCLevel" BOOLEAN NOT NULL DEFAULT false,
    "department" TEXT,
    "departmentRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "managerId" TEXT,
    CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
INSERT INTO "new_User" ("createdAt", "department", "departmentRole", "email", "emailVerified", "id", "image", "name", "password", "passwordChangedAt", "role", "updatedAt") SELECT "createdAt", "department", "departmentRole", "email", "emailVerified", "id", "image", "name", "password", "passwordChangedAt", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_email_idx" ON "User"("email");
CREATE INDEX "User_role_idx" ON "User"("role");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
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
    CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowTemplate" ("createdAt", "description", "id", "name", "updatedAt") SELECT "createdAt", "description", "id", "name", "updatedAt" FROM "WorkflowTemplate";
DROP TABLE "WorkflowTemplate";
ALTER TABLE "new_WorkflowTemplate" RENAME TO "WorkflowTemplate";
CREATE UNIQUE INDEX "WorkflowTemplate_name_key" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_name_idx" ON "WorkflowTemplate"("name");
CREATE INDEX "WorkflowTemplate_createdAt_idx" ON "WorkflowTemplate"("createdAt");
CREATE TABLE "new_WorkflowTemplateStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "order" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDynamicApprover" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT NOT NULL,
    "teamId" TEXT,
    "approverRole" TEXT,
    CONSTRAINT "WorkflowTemplateStep_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplateStep_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WorkflowTemplateStep" ("approverRole", "createdAt", "id", "order", "teamId", "templateId", "updatedAt") SELECT "approverRole", "createdAt", "id", "order", "teamId", "templateId", "updatedAt" FROM "WorkflowTemplateStep";
DROP TABLE "WorkflowTemplateStep";
ALTER TABLE "new_WorkflowTemplateStep" RENAME TO "WorkflowTemplateStep";
CREATE INDEX "WorkflowTemplateStep_templateId_idx" ON "WorkflowTemplateStep"("templateId");
CREATE INDEX "WorkflowTemplateStep_order_idx" ON "WorkflowTemplateStep"("order");
CREATE INDEX "WorkflowTemplateStep_teamId_idx" ON "WorkflowTemplateStep"("teamId");
CREATE INDEX "WorkflowTemplateStep_approverRole_idx" ON "WorkflowTemplateStep"("approverRole");
CREATE UNIQUE INDEX "WorkflowTemplateStep_templateId_order_key" ON "WorkflowTemplateStep"("templateId", "order");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
