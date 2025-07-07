import { PrismaClient, FormFieldType } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestProperties() {
  try {
    console.log('Test property\'leri oluşturuluyor...');

    // Önce test kullanıcısını bul
    const testUser = await prisma.user.findFirst({
      where: {
        email: 'hatice.ergun9446@contravo.com'
      }
    });

    if (!testUser) {
      console.error('Test kullanıcısı bulunamadı');
      return;
    }

    // Mevcut company'leri kontrol et
    const companies = await prisma.company.findMany();
    console.log('Mevcut company\'ler:', companies.map(c => ({ id: c.id, name: c.name })));

    let companyId = 'test-company';
    if (companies.length > 0) {
      companyId = companies[0].id;
      console.log('Kullanılacak company ID:', companyId);
    } else {
      // Company yoksa oluştur
      const newCompany = await prisma.company.create({
        data: {
          name: 'Test Company',
          description: 'Test şirketi',
          createdById: testUser.id
        }
      });
      companyId = newCompany.id;
      console.log('Yeni company oluşturuldu:', companyId);
    }

    // Global Properties Library template'ini bul veya oluştur
    let globalTemplate = await prisma.workflowTemplate.findFirst({
      where: {
        name: 'Global Properties Library'
      }
    });

    if (!globalTemplate) {
      globalTemplate = await prisma.workflowTemplate.create({
        data: {
          name: 'Global Properties Library',
          description: 'Merkezi property kütüphanesi',
          companyId: companyId,
          createdById: testUser.id,
          status: 'ACTIVE'
        }
      });
      console.log('Global Properties Library template oluşturuldu:', globalTemplate.id);
    } else {
      console.log('Global Properties Library template zaten mevcut:', globalTemplate.id);
    }

    // Test property'leri
    const testProperties = [
      {
        label: 'Sözleşme Değeri',
        apiKey: 'contractValue',
        type: 'NUMBER',
        helpText: 'Sözleşmenin toplam değeri',
        isRequired: true,
        options: [],
        placeholder: 'Sözleşme değerini giriniz...',
        order: 1
      },
      {
        label: 'Karşı Taraf Adı',
        apiKey: 'counterpartyName',
        type: 'TEXT',
        helpText: 'Sözleşme karşı tarafının tam adı',
        isRequired: true,
        options: [],
        placeholder: 'Karşı taraf adını giriniz...',
        order: 2
      },
      {
        label: 'Sözleşme Türü',
        apiKey: 'contractType',
        type: 'SINGLE_SELECT',
        helpText: 'Sözleşmenin türü',
        isRequired: true,
        options: ['Hizmet Sözleşmesi', 'Satış Sözleşmesi', 'Kiralama Sözleşmesi', 'İstihdam Sözleşmesi'],
        placeholder: 'Sözleşme türünü seçiniz...',
        order: 3
      },
      {
        label: 'Başlangıç Tarihi',
        apiKey: 'startDate',
        type: 'DATE',
        helpText: 'Sözleşmenin başlangıç tarihi',
        isRequired: true,
        options: [],
        placeholder: 'Başlangıç tarihini seçiniz...',
        order: 4
      },
      {
        label: 'Bitiş Tarihi',
        apiKey: 'endDate',
        type: 'DATE',
        helpText: 'Sözleşmenin bitiş tarihi',
        isRequired: false,
        options: [],
        placeholder: 'Bitiş tarihini seçiniz...',
        order: 5
      },
      {
        label: 'İletişim E-posta',
        apiKey: 'contactEmail',
        type: 'EMAIL',
        helpText: 'İletişim için e-posta adresi',
        isRequired: true,
        options: [],
        placeholder: 'E-posta adresini giriniz...',
        order: 6
      },
      {
        label: 'Telefon Numarası',
        apiKey: 'phoneNumber',
        type: 'PHONE',
        helpText: 'İletişim telefon numarası',
        isRequired: false,
        options: [],
        placeholder: 'Telefon numarasını giriniz...',
        order: 7
      },
      {
        label: 'Web Sitesi',
        apiKey: 'website',
        type: 'URL',
        helpText: 'Web sitesi adresi',
        isRequired: false,
        options: [],
        placeholder: 'Web sitesi adresini giriniz...',
        order: 8
      },
      {
        label: 'Açıklama',
        apiKey: 'description',
        type: 'TEXTAREA',
        helpText: 'Sözleşme hakkında detaylı açıklama',
        isRequired: false,
        options: [],
        placeholder: 'Açıklama giriniz...',
        order: 9
      },
      {
        label: 'Onay Durumu',
        apiKey: 'approvalStatus',
        type: 'SINGLE_SELECT',
        helpText: 'Sözleşmenin onay durumu',
        isRequired: true,
        options: ['Beklemede', 'Onaylandı', 'Reddedildi', 'İncelemede'],
        placeholder: 'Onay durumunu seçiniz...',
        order: 10
      }
    ];

    // Property'leri oluştur
    for (const property of testProperties) {
      // Önce bu property'nin var olup olmadığını kontrol et
      const existingProperty = await prisma.formField.findFirst({
        where: {
          apiKey: property.apiKey,
          templateId: globalTemplate.id
        }
      });

      if (!existingProperty) {
        const newProperty = await prisma.formField.create({
          data: {
            ...property,
            type: property.type as FormFieldType,
            templateId: globalTemplate.id
          }
        });
        console.log(`✅ Property oluşturuldu: ${property.label} (${property.apiKey})`);
      } else {
        console.log(`⚠️ Property zaten mevcut: ${property.label} (${property.apiKey})`);
      }
    }

    console.log('Test property\'leri oluşturma işlemi tamamlandı!');

  } catch (error) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestProperties(); 