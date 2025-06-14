/*
  Warnings:

  - You are about to drop the column `allowDecline` on the `signature_packages` table. All the data in the column will be lost.
  - You are about to drop the column `sendReminders` on the `signature_packages` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_signature_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expiresAt" DATETIME,
    "completedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "signature_packages_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "signature_packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_signature_packages" ("completedAt", "contractId", "createdAt", "createdById", "description", "expiresAt", "id", "status", "title", "updatedAt") SELECT "completedAt", "contractId", "createdAt", "createdById", "description", "expiresAt", "id", "status", "title", "updatedAt" FROM "signature_packages";
DROP TABLE "signature_packages";
ALTER TABLE "new_signature_packages" RENAME TO "signature_packages";
CREATE UNIQUE INDEX "signature_packages_contractId_key" ON "signature_packages"("contractId");
CREATE INDEX "signature_packages_status_idx" ON "signature_packages"("status");
CREATE INDEX "signature_packages_createdById_idx" ON "signature_packages"("createdById");
CREATE INDEX "signature_packages_expiresAt_idx" ON "signature_packages"("expiresAt");
CREATE INDEX "signature_packages_completedAt_idx" ON "signature_packages"("completedAt");
CREATE INDEX "signature_packages_createdAt_idx" ON "signature_packages"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Company_createdById_idx" ON "Company"("createdById");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_createdAt_idx" ON "Company"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyInvite_email_idx" ON "CompanyInvite"("email");

-- CreateIndex
CREATE INDEX "CompanyInvite_status_idx" ON "CompanyInvite"("status");

-- CreateIndex
CREATE INDEX "CompanyInvite_createdAt_idx" ON "CompanyInvite"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");

-- CreateIndex
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");

-- CreateIndex
CREATE INDEX "CompanyUser_role_idx" ON "CompanyUser"("role");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_type_idx" ON "Contract"("type");

-- CreateIndex
CREATE INDEX "Contract_companyId_idx" ON "Contract"("companyId");

-- CreateIndex
CREATE INDEX "Contract_createdById_idx" ON "Contract"("createdById");

-- CreateIndex
CREATE INDEX "Contract_createdAt_idx" ON "Contract"("createdAt");

-- CreateIndex
CREATE INDEX "Contract_updatedAt_idx" ON "Contract"("updatedAt");

-- CreateIndex
CREATE INDEX "Contract_startDate_idx" ON "Contract"("startDate");

-- CreateIndex
CREATE INDEX "Contract_endDate_idx" ON "Contract"("endDate");

-- CreateIndex
CREATE INDEX "Contract_status_companyId_idx" ON "Contract"("status", "companyId");

-- CreateIndex
CREATE INDEX "Contract_type_status_idx" ON "Contract"("type", "status");

-- CreateIndex
CREATE INDEX "Contract_createdById_status_idx" ON "Contract"("createdById", "status");

-- CreateIndex
CREATE INDEX "Contract_title_idx" ON "Contract"("title");

-- CreateIndex
CREATE INDEX "Contract_otherPartyName_idx" ON "Contract"("otherPartyName");

-- CreateIndex
CREATE INDEX "ContractApproval_contractId_idx" ON "ContractApproval"("contractId");

-- CreateIndex
CREATE INDEX "ContractApproval_approverId_idx" ON "ContractApproval"("approverId");

-- CreateIndex
CREATE INDEX "ContractApproval_status_idx" ON "ContractApproval"("status");

-- CreateIndex
CREATE INDEX "ContractApproval_createdAt_idx" ON "ContractApproval"("createdAt");

-- CreateIndex
CREATE INDEX "ContractApproval_approvedAt_idx" ON "ContractApproval"("approvedAt");

-- CreateIndex
CREATE INDEX "ContractAttachment_contractId_idx" ON "ContractAttachment"("contractId");

-- CreateIndex
CREATE INDEX "ContractAttachment_uploadedById_idx" ON "ContractAttachment"("uploadedById");

-- CreateIndex
CREATE INDEX "ContractAttachment_createdAt_idx" ON "ContractAttachment"("createdAt");

-- CreateIndex
CREATE INDEX "ContractAttachment_mimeType_idx" ON "ContractAttachment"("mimeType");

-- CreateIndex
CREATE INDEX "ContractTemplate_category_idx" ON "ContractTemplate"("category");

-- CreateIndex
CREATE INDEX "ContractTemplate_isPublic_idx" ON "ContractTemplate"("isPublic");

-- CreateIndex
CREATE INDEX "ContractTemplate_isActive_idx" ON "ContractTemplate"("isActive");

-- CreateIndex
CREATE INDEX "ContractTemplate_createdById_idx" ON "ContractTemplate"("createdById");

-- CreateIndex
CREATE INDEX "ContractTemplate_companyId_idx" ON "ContractTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ContractTemplate_usageCount_idx" ON "ContractTemplate"("usageCount");

-- CreateIndex
CREATE INDEX "ContractTemplate_title_idx" ON "ContractTemplate"("title");

-- CreateIndex
CREATE INDEX "ContractTemplate_createdAt_idx" ON "ContractTemplate"("createdAt");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE INDEX "contract_versions_contractId_idx" ON "contract_versions"("contractId");

-- CreateIndex
CREATE INDEX "contract_versions_versionNumber_idx" ON "contract_versions"("versionNumber");

-- CreateIndex
CREATE INDEX "contract_versions_createdById_idx" ON "contract_versions"("createdById");

-- CreateIndex
CREATE INDEX "contract_versions_changeType_idx" ON "contract_versions"("changeType");

-- CreateIndex
CREATE INDEX "contract_versions_createdAt_idx" ON "contract_versions"("createdAt");

-- CreateIndex
CREATE INDEX "contract_versions_contractId_versionNumber_idx" ON "contract_versions"("contractId", "versionNumber");

-- CreateIndex
CREATE INDEX "digital_signatures_userId_idx" ON "digital_signatures"("userId");

-- CreateIndex
CREATE INDEX "digital_signatures_status_idx" ON "digital_signatures"("status");

-- CreateIndex
CREATE INDEX "digital_signatures_signedAt_idx" ON "digital_signatures"("signedAt");

-- CreateIndex
CREATE INDEX "digital_signatures_expiresAt_idx" ON "digital_signatures"("expiresAt");

-- CreateIndex
CREATE INDEX "digital_signatures_order_idx" ON "digital_signatures"("order");

-- CreateIndex
CREATE INDEX "digital_signatures_contractId_order_idx" ON "digital_signatures"("contractId", "order");

-- CreateIndex
CREATE INDEX "notifications_userId_idx" ON "notifications"("userId");

-- CreateIndex
CREATE INDEX "notifications_contractId_idx" ON "notifications"("contractId");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_isRead_idx" ON "notifications"("isRead");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_type_idx" ON "notifications"("userId", "type");
