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
    "propertyId" TEXT,
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
    CONSTRAINT "FormField_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "FormField" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FormField_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "FormSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FormField_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormField" ("apiKey", "customError", "defaultValue", "dependsOn", "dependsOnValue", "errorMessage", "fieldGroup", "helpText", "hideWhen", "id", "isConditional", "isHidden", "isReadOnly", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "priority", "propertyId", "realTimeValidation", "sectionId", "showWhen", "successMessage", "templateId", "type", "validateWhen", "validationRules", "warningMessage") SELECT "apiKey", "customError", "defaultValue", "dependsOn", "dependsOnValue", "errorMessage", "fieldGroup", "helpText", "hideWhen", "id", "isConditional", "isHidden", "isReadOnly", "isRequired", "label", "maxLength", "maxValue", "minLength", "minValue", "options", "order", "pattern", "placeholder", "priority", "propertyId", "realTimeValidation", "sectionId", "showWhen", "successMessage", "templateId", "type", "validateWhen", "validationRules", "warningMessage" FROM "FormField";
DROP TABLE "FormField";
ALTER TABLE "new_FormField" RENAME TO "FormField";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
