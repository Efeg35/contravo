-- AlterTable
ALTER TABLE "Contract" ADD COLUMN "content" TEXT;

-- CreateTable
CREATE TABLE "Clause" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'COMPANY',
    "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdById" TEXT NOT NULL,
    "companyId" TEXT,
    "parentClauseId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Clause_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Clause_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Clause_parentClauseId_fkey" FOREIGN KEY ("parentClauseId") REFERENCES "Clause" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClauseVariable" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STRING',
    "defaultValue" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "validation" JSONB,
    "clauseId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClauseVariable_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClauseUsage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clauseId" TEXT NOT NULL,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contractType" TEXT,
    "position" INTEGER,
    "usedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClauseUsage_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseUsage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClauseApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "comments" TEXT,
    "clauseId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ClauseApproval_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Clause_category_idx" ON "Clause"("category");

-- CreateIndex
CREATE INDEX "Clause_visibility_idx" ON "Clause"("visibility");

-- CreateIndex
CREATE INDEX "Clause_companyId_idx" ON "Clause"("companyId");

-- CreateIndex
CREATE INDEX "Clause_createdById_idx" ON "Clause"("createdById");

-- CreateIndex
CREATE INDEX "Clause_approvalStatus_idx" ON "Clause"("approvalStatus");

-- CreateIndex
CREATE INDEX "Clause_isActive_idx" ON "Clause"("isActive");

-- CreateIndex
CREATE INDEX "ClauseVariable_clauseId_idx" ON "ClauseVariable"("clauseId");

-- CreateIndex
CREATE INDEX "ClauseVariable_name_idx" ON "ClauseVariable"("name");

-- CreateIndex
CREATE INDEX "ClauseUsage_clauseId_idx" ON "ClauseUsage"("clauseId");

-- CreateIndex
CREATE INDEX "ClauseUsage_contractId_idx" ON "ClauseUsage"("contractId");

-- CreateIndex
CREATE INDEX "ClauseUsage_userId_idx" ON "ClauseUsage"("userId");

-- CreateIndex
CREATE INDEX "ClauseUsage_usedAt_idx" ON "ClauseUsage"("usedAt");

-- CreateIndex
CREATE INDEX "ClauseApproval_clauseId_idx" ON "ClauseApproval"("clauseId");

-- CreateIndex
CREATE INDEX "ClauseApproval_approverId_idx" ON "ClauseApproval"("approverId");

-- CreateIndex
CREATE INDEX "ClauseApproval_status_idx" ON "ClauseApproval"("status");
