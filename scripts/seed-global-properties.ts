import prisma from '../lib/prisma';
import { FormFieldType } from '@prisma/client';

async function main() {
  // 1. Bir admin veya ilk şirketi bul
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error('Hiç şirket yok! Önce bir şirket oluşturmalısın.');
    process.exit(1);
  }
  const companyId = company.id;
  console.log('Kullanılacak companyId:', companyId);

  // 2. Global Properties Library template'ini bul veya oluştur
  let template = await prisma.workflowTemplate.findFirst({
    where: {
      name: 'Global Properties Library',
      companyId,
    },
  });
  if (!template) {
    template = await prisma.workflowTemplate.create({
      data: {
        name: 'Global Properties Library',
        description: 'Tüm workflowlarda kullanılacak merkezi property kütüphanesi',
        companyId,
        status: 'PUBLISHED',
      },
    });
    console.log('Global Properties Library template oluşturuldu:', template.id);
  } else {
    console.log('Global Properties Library template zaten var:', template.id);
  }

  // 3. Örnek property'ler (FormField olarak ekle)
  const properties = [
    { label: 'Counterparty Name', apiKey: 'counterparty_name', type: FormFieldType.TEXT, isRequired: true, description: 'Karşı tarafın tam adı' },
    { label: 'Contract Value', apiKey: 'contract_value', type: FormFieldType.NUMBER, isRequired: false, description: 'Sözleşme toplam tutarı' },
    { label: 'Start Date', apiKey: 'start_date', type: FormFieldType.DATE, isRequired: true, description: 'Sözleşme başlangıç tarihi' },
    { label: 'End Date', apiKey: 'end_date', type: FormFieldType.DATE, isRequired: false, description: 'Sözleşme bitiş tarihi' },
    { label: 'Contact Email', apiKey: 'contact_email', type: FormFieldType.EMAIL, isRequired: false, description: 'Karşı taraf e-posta adresi' },
  ];

  let order = 1;
  for (const prop of properties) {
    const exists = await prisma.formField.findFirst({
      where: {
        apiKey: prop.apiKey,
        templateId: template.id,
      },
    });
    if (!exists) {
      await prisma.formField.create({
        data: {
          label: prop.label,
          apiKey: prop.apiKey,
          type: prop.type,
          isRequired: prop.isRequired,
          helpText: prop.description,
          order: order++,
          templateId: template.id,
        },
      });
      console.log('Property (FormField) eklendi:', prop.label);
    } else {
      console.log('Property (FormField) zaten var:', prop.label);
    }
  }

  console.log('✅ Seed işlemi tamamlandı!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}); 