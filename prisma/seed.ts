import { PrismaClient } from '@prisma/client';
import { readFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed işlemi başlıyor...');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const backupPath = path.join(__dirname, 'backup.json');

  try {
    const backupFile = await readFile(backupPath, 'utf-8');
    const backupData = JSON.parse(backupFile);

    const modelNames = Object.keys(backupData);

    for (const modelName of modelNames) {
      const modelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);
      const data = backupData[modelName];

      if (data && data.length > 0) {
        // Tarih alanlarını Date objesine dönüştür
        let processedData = data.map((record: any) => {
          for (const key in record) {
            if (typeof record[key] === 'string' && /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(record[key])) {
              record[key] = new Date(record[key]);
            }
          }
          return record;
        });

        // FormField için ilişkili sectionId ve templateId kontrolü
        if (modelName === 'FormField') {
          const sectionIds = (await prisma.formSection.findMany({ select: { id: true } })).map(s => s.id);
          const templateIds = (await prisma.workflowTemplate.findMany({ select: { id: true } })).map(t => t.id);
          processedData = processedData.filter((record: any) => {
            const sectionOk = !record.sectionId || sectionIds.includes(record.sectionId);
            const templateOk = record.templateId && templateIds.includes(record.templateId);
            return sectionOk && templateOk;
          });
        }

        // @ts-ignore
        await prisma[modelKey].createMany({
          data: processedData
        });
        console.log(`- ${modelName}: ${processedData.length} kayıt eklendi.`);
      }
    }

    console.log('✅ Seed işlemi başarıyla tamamlandı.');
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      console.warn('⚠️ backup.json bulunamadı, seed işlemi atlanıyor.');
    } else {
      console.error('❌ Seed işlemi sırasında hata oluştu:', error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 