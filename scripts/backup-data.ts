import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const prisma = new PrismaClient();

function toCamelCase(str: string) {
  return str.charAt(0).toLowerCase() + str.slice(1);
}

async function backup() {
  try {
    console.log('Veritabanı yedekleme işlemi başladı...');

    const backupData: { [key: string]: any[] } = {};

    // Modelleri yedekleme sırasına göre listele
    const modelNames = [
      'User',
      'Account',
      'Session',
      'Company',
      'CompanyUser',
      'CompanyInvite',
      'CompanySettings',
      'Contract',
      'ContractAttachment',
      'ContractTemplate',
      'ContractApproval',
      'ContractVersion',
      'NotificationSettings',
      'Notification',
      'DigitalSignature',
      'SignaturePackage',
      'Clause',
      'ClauseVariable',
      'ClauseUsage',
      'ClauseApproval',
      'Team',
      'UsersOnTeams',
      'SavedReport',
      'ReportSchedule',
      'ScheduleLog',
      'ClausesOnContracts',
      'WorkflowTemplate',
      'WorkflowTemplateStep',
      'Condition',
      'FormField',
      'FormValidationRule',
      'FormSection',
      'PasswordHistory',
      'LoginAttempt',
      'UserSession',
      'SessionActivity',
      'TokenBlacklist',
    ].filter(Boolean); // Hatalı model isimlerini temizle

    for (const modelName of modelNames) {
      const modelKey = toCamelCase(modelName);
      // @ts-ignore
      const records = await prisma[modelKey].findMany();
      if (records.length > 0) {
        backupData[modelName] = records;
        console.log(`- ${modelName}: ${records.length} kayıt bulundu.`);
      }
    }

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const backupPath = path.join(__dirname, '../prisma/backup.json');
    await writeFile(backupPath, JSON.stringify(backupData, null, 2));

    console.log(`✅ Veritabanı yedeği başarıyla oluşturuldu: ${backupPath}`);
  } catch (error) {
    console.error('❌ Yedekleme sırasında hata oluştu:', error);
  } finally {
    await prisma.$disconnect();
  }
}

backup(); 