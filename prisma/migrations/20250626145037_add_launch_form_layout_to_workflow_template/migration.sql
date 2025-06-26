-- AlterTable
ALTER TABLE "WorkflowTemplate" ADD COLUMN "launchFormLayout" JSONB;

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
    "templateId" TEXT NOT NULL,
    CONSTRAINT "FormField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Condition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "displayConditionForFieldId" TEXT,
    CONSTRAINT "Condition_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkflowTemplateStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Condition_displayConditionForFieldId_fkey" FOREIGN KEY ("displayConditionForFieldId") REFERENCES "FormField" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Condition" ("field", "id", "operator", "stepId", "value") SELECT "field", "id", "operator", "stepId", "value" FROM "Condition";
DROP TABLE "Condition";
ALTER TABLE "new_Condition" RENAME TO "Condition";
CREATE UNIQUE INDEX "Condition_displayConditionForFieldId_key" ON "Condition"("displayConditionForFieldId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
