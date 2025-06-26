-- AlterTable
ALTER TABLE "FormField" ADD COLUMN "customError" TEXT;
ALTER TABLE "FormField" ADD COLUMN "dependsOn" TEXT;
ALTER TABLE "FormField" ADD COLUMN "dependsOnValue" TEXT;
ALTER TABLE "FormField" ADD COLUMN "helpText" TEXT;
ALTER TABLE "FormField" ADD COLUMN "maxLength" INTEGER;
ALTER TABLE "FormField" ADD COLUMN "maxValue" REAL;
ALTER TABLE "FormField" ADD COLUMN "minLength" INTEGER;
ALTER TABLE "FormField" ADD COLUMN "minValue" REAL;
ALTER TABLE "FormField" ADD COLUMN "pattern" TEXT;
