-- CreateTable
CREATE TABLE "User" (
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

-- CreateTable
CREATE TABLE "TokenBlacklist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenId" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT 'logout',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PasswordHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "failedAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" DATETIME,
    "lastAttemptIp" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "deviceInfo" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActivity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME NOT NULL,
    "invalidatedAt" DATETIME,
    "invalidationReason" TEXT,
    CONSTRAINT "UserSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SessionActivity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    CONSTRAINT "SessionActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "UserSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "Company_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyUser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "CompanyUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyUser_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyInvite" (
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

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "defaultContractType" TEXT,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "allowSelfApproval" BOOLEAN NOT NULL DEFAULT false,
    "notificationSettings" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Contract" (
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
    "metadata" JSONB,
    CONSTRAINT "Contract_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Contract_parentContractId_fkey" FOREIGN KEY ("parentContractId") REFERENCES "Contract" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
    CONSTRAINT "Contract_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ContractTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_workflowTemplateId_fkey" FOREIGN KEY ("workflowTemplateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Contract_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractAttachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContractAttachment_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "companyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ContractTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ContractApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "approverId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "approvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ContractApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ContractApproval_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "contract_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "value" REAL,
    "currency" TEXT,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "changeType" TEXT NOT NULL,
    "changeDescription" TEXT,
    "changeLog" JSONB,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "contract_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "contract_versions_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contractExpiring" BOOLEAN NOT NULL DEFAULT true,
    "contractExpired" BOOLEAN NOT NULL DEFAULT true,
    "contractReminder" BOOLEAN NOT NULL DEFAULT true,
    "approvalNeeded" BOOLEAN NOT NULL DEFAULT true,
    "approvalReceived" BOOLEAN NOT NULL DEFAULT true,
    "versionCreated" BOOLEAN NOT NULL DEFAULT true,
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "dashboardNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reminderFrequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "daysBeforeExpiration" INTEGER NOT NULL DEFAULT 30,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notification_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "contractId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "emailSent" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "signedAt" DATETIME,
    "expiresAt" DATETIME NOT NULL,
    "signatureData" TEXT,
    "certificateData" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "order" INTEGER NOT NULL DEFAULT 1,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "declineReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "digital_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "digital_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signature_packages" (
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
    CONSTRAINT "signature_packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "signature_packages_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "ClauseUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseUsage_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseUsage_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
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
    CONSTRAINT "ClauseApproval_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ClauseApproval_clauseId_fkey" FOREIGN KEY ("clauseId") REFERENCES "Clause" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    "reviewSettings" JSONB,
    "enableRealTimeValidation" BOOLEAN NOT NULL DEFAULT false,
    "validationMode" TEXT NOT NULL DEFAULT 'SUBMIT',
    "showValidationSummary" BOOLEAN NOT NULL DEFAULT true,
    "allowPartialSave" BOOLEAN NOT NULL DEFAULT false,
    "formRules" JSONB,
    CONSTRAINT "WorkflowTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkflowTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkflowTemplateStep" (
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

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "displayConditionForFieldId" TEXT,
    CONSTRAINT "Condition_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowTemplateStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Condition_displayConditionForFieldId_fkey" FOREIGN KEY ("displayConditionForFieldId") REFERENCES "FormField" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormField" (
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

-- CreateTable
CREATE TABLE "WorkflowApprover" (
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

-- CreateTable
CREATE TABLE "ApproverCondition" (
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBlacklist_tokenId_key" ON "TokenBlacklist"("tokenId");

-- CreateIndex
CREATE INDEX "TokenBlacklist_tokenId_idx" ON "TokenBlacklist"("tokenId");

-- CreateIndex
CREATE INDEX "TokenBlacklist_createdAt_idx" ON "TokenBlacklist"("createdAt");

-- CreateIndex
CREATE INDEX "PasswordHistory_userId_idx" ON "PasswordHistory"("userId");

-- CreateIndex
CREATE INDEX "PasswordHistory_createdAt_idx" ON "PasswordHistory"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginAttempt_identifier_key" ON "LoginAttempt"("identifier");

-- CreateIndex
CREATE INDEX "LoginAttempt_identifier_idx" ON "LoginAttempt"("identifier");

-- CreateIndex
CREATE INDEX "LoginAttempt_lockedUntil_idx" ON "LoginAttempt"("lockedUntil");

-- CreateIndex
CREATE INDEX "UserSession_userId_idx" ON "UserSession"("userId");

-- CreateIndex
CREATE INDEX "UserSession_isActive_idx" ON "UserSession"("isActive");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_lastActivity_idx" ON "UserSession"("lastActivity");

-- CreateIndex
CREATE INDEX "UserSession_createdAt_idx" ON "UserSession"("createdAt");

-- CreateIndex
CREATE INDEX "SessionActivity_sessionId_idx" ON "SessionActivity"("sessionId");

-- CreateIndex
CREATE INDEX "SessionActivity_action_idx" ON "SessionActivity"("action");

-- CreateIndex
CREATE INDEX "SessionActivity_timestamp_idx" ON "SessionActivity"("timestamp");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Session_expires_idx" ON "Session"("expires");

-- CreateIndex
CREATE INDEX "Company_createdById_idx" ON "Company"("createdById");

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Company_createdAt_idx" ON "Company"("createdAt");

-- CreateIndex
CREATE INDEX "CompanyUser_companyId_idx" ON "CompanyUser"("companyId");

-- CreateIndex
CREATE INDEX "CompanyUser_userId_idx" ON "CompanyUser"("userId");

-- CreateIndex
CREATE INDEX "CompanyUser_role_idx" ON "CompanyUser"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyUser_companyId_userId_key" ON "CompanyUser"("companyId", "userId");

-- CreateIndex
CREATE INDEX "CompanyInvite_email_idx" ON "CompanyInvite"("email");

-- CreateIndex
CREATE INDEX "CompanyInvite_status_idx" ON "CompanyInvite"("status");

-- CreateIndex
CREATE INDEX "CompanyInvite_createdAt_idx" ON "CompanyInvite"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInvite_companyId_email_key" ON "CompanyInvite"("companyId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Contract_type_idx" ON "Contract"("type");

-- CreateIndex
CREATE INDEX "Contract_assignedToId_idx" ON "Contract"("assignedToId");

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
CREATE INDEX "Contract_expirationDate_idx" ON "Contract"("expirationDate");

-- CreateIndex
CREATE INDEX "Contract_renewalDate_idx" ON "Contract"("renewalDate");

-- CreateIndex
CREATE INDEX "Contract_renewalStatus_idx" ON "Contract"("renewalStatus");

-- CreateIndex
CREATE INDEX "Contract_autoRenewal_idx" ON "Contract"("autoRenewal");

-- CreateIndex
CREATE INDEX "Contract_status_companyId_idx" ON "Contract"("status", "companyId");

-- CreateIndex
CREATE INDEX "Contract_type_status_idx" ON "Contract"("type", "status");

-- CreateIndex
CREATE INDEX "Contract_createdById_status_idx" ON "Contract"("createdById", "status");

-- CreateIndex
CREATE INDEX "Contract_assignedToId_status_idx" ON "Contract"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "Contract_endDate_renewalStatus_idx" ON "Contract"("endDate", "renewalStatus");

-- CreateIndex
CREATE INDEX "Contract_expirationDate_status_idx" ON "Contract"("expirationDate", "status");

-- CreateIndex
CREATE INDEX "Contract_renewalDate_renewalStatus_idx" ON "Contract"("renewalDate", "renewalStatus");

-- CreateIndex
CREATE INDEX "Contract_parentContractId_idx" ON "Contract"("parentContractId");

-- CreateIndex
CREATE INDEX "Contract_title_idx" ON "Contract"("title");

-- CreateIndex
CREATE INDEX "Contract_otherPartyName_idx" ON "Contract"("otherPartyName");

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
CREATE UNIQUE INDEX "ContractApproval_contractId_approverId_key" ON "ContractApproval"("contractId", "approverId");

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
CREATE UNIQUE INDEX "notification_settings_userId_key" ON "notification_settings"("userId");

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

-- CreateIndex
CREATE INDEX "digital_signatures_contractId_idx" ON "digital_signatures"("contractId");

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
CREATE UNIQUE INDEX "digital_signatures_contractId_userId_key" ON "digital_signatures"("contractId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "signature_packages_contractId_key" ON "signature_packages"("contractId");

-- CreateIndex
CREATE INDEX "signature_packages_status_idx" ON "signature_packages"("status");

-- CreateIndex
CREATE INDEX "signature_packages_createdById_idx" ON "signature_packages"("createdById");

-- CreateIndex
CREATE INDEX "signature_packages_expiresAt_idx" ON "signature_packages"("expiresAt");

-- CreateIndex
CREATE INDEX "signature_packages_completedAt_idx" ON "signature_packages"("completedAt");

-- CreateIndex
CREATE INDEX "signature_packages_createdAt_idx" ON "signature_packages"("createdAt");

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

-- CreateIndex
CREATE UNIQUE INDEX "Condition_displayConditionForFieldId_key" ON "Condition"("displayConditionForFieldId");

-- CreateIndex
CREATE INDEX "FormValidationRule_templateId_idx" ON "FormValidationRule"("templateId");

-- CreateIndex
CREATE INDEX "FormValidationRule_ruleType_idx" ON "FormValidationRule"("ruleType");

-- CreateIndex
CREATE INDEX "FormValidationRule_isActive_idx" ON "FormValidationRule"("isActive");

-- CreateIndex
CREATE INDEX "FormValidationRule_priority_idx" ON "FormValidationRule"("priority");

-- CreateIndex
CREATE INDEX "FormSection_templateId_idx" ON "FormSection"("templateId");

-- CreateIndex
CREATE INDEX "FormSection_order_idx" ON "FormSection"("order");

-- CreateIndex
CREATE INDEX "FormSection_isHidden_idx" ON "FormSection"("isHidden");

-- CreateIndex
CREATE INDEX "FormSection_isRequired_idx" ON "FormSection"("isRequired");

-- CreateIndex
CREATE INDEX "WorkflowApprover_templateId_idx" ON "WorkflowApprover"("templateId");

-- CreateIndex
CREATE INDEX "WorkflowApprover_order_idx" ON "WorkflowApprover"("order");

-- CreateIndex
CREATE INDEX "WorkflowApprover_approverType_idx" ON "WorkflowApprover"("approverType");

-- CreateIndex
CREATE UNIQUE INDEX "WorkflowApprover_templateId_order_key" ON "WorkflowApprover"("templateId", "order");

-- CreateIndex
CREATE INDEX "ApproverCondition_approverId_idx" ON "ApproverCondition"("approverId");

-- CreateIndex
CREATE INDEX "ApproverCondition_type_idx" ON "ApproverCondition"("type");
