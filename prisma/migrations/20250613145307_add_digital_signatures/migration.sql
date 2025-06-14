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
    CONSTRAINT "digital_signatures_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "digital_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "signature_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contractId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "expiresAt" DATETIME NOT NULL,
    "sendReminders" BOOLEAN NOT NULL DEFAULT true,
    "allowDecline" BOOLEAN NOT NULL DEFAULT true,
    "completedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "signature_packages_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "signature_packages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "digital_signatures_contractId_idx" ON "digital_signatures"("contractId");

-- CreateIndex
CREATE UNIQUE INDEX "digital_signatures_contractId_userId_key" ON "digital_signatures"("contractId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "signature_packages_contractId_key" ON "signature_packages"("contractId");
