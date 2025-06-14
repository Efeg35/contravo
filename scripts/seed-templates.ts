import prisma from '../lib/prisma';

const templates = [
  {
    title: 'İş Sözleşmesi - Tam Zamanlı',
    description: 'Tam zamanlı çalışanlar için standart iş sözleşmesi şablonu',
    category: 'EMPLOYMENT' as const,
    content: `İŞ SÖZLEŞMESİ

İşveren: {{company_name}}
Adres: {{company_address}}
Vergi No: {{company_tax_no}}

Çalışan: {{employee_name}}
T.C. Kimlik No: {{employee_id}}
Adres: {{employee_address}}

Madde 1 - İşin Konusu ve Yeri
Çalışan, {{job_title}} pozisyonunda {{work_location}} adresinde çalışmayı kabul eder.

Madde 2 - Çalışma Süresi
Haftalık çalışma süresi {{weekly_hours}} saat olup, günlük çalışma saatleri {{start_time}} - {{end_time}} arasındadır.

Madde 3 - Ücret
Aylık brüt ücret {{monthly_salary}} TL'dir. Ücret her ayın {{payment_day}}. günü ödenecektir.

Madde 4 - İş Sözleşmesinin Süresi
Bu sözleşme {{start_date}} tarihinde başlayıp {{contract_type}} sözleşmedir.

Madde 5 - Fesih
Her iki taraf da bu sözleşmeyi {{notice_period}} gün önceden yazılı bildirimle feshedebilir.

Tarih: {{contract_date}}

İşveren: _______________     Çalışan: _______________`,
    variables: [
      { name: 'company_name', label: 'Şirket Adı', type: 'text', required: true },
      { name: 'company_address', label: 'Şirket Adresi', type: 'text', required: true },
      { name: 'company_tax_no', label: 'Vergi Numarası', type: 'text', required: true },
      { name: 'employee_name', label: 'Çalışan Adı', type: 'text', required: true },
      { name: 'employee_id', label: 'T.C. Kimlik No', type: 'text', required: true },
      { name: 'employee_address', label: 'Çalışan Adresi', type: 'text', required: true },
      { name: 'job_title', label: 'Görev Unvanı', type: 'text', required: true },
      { name: 'work_location', label: 'Çalışma Yeri', type: 'text', required: true },
      { name: 'weekly_hours', label: 'Haftalık Çalışma Saati', type: 'number', required: true, defaultValue: '40' },
      { name: 'start_time', label: 'Başlangıç Saati', type: 'text', required: true, defaultValue: '09:00' },
      { name: 'end_time', label: 'Bitiş Saati', type: 'text', required: true, defaultValue: '18:00' },
      { name: 'monthly_salary', label: 'Aylık Maaş (TL)', type: 'number', required: true },
      { name: 'payment_day', label: 'Maaş Ödeme Günü', type: 'number', required: true, defaultValue: '5' },
      { name: 'start_date', label: 'İşe Başlangıç Tarihi', type: 'date', required: true },
      { name: 'contract_type', label: 'Sözleşme Türü', type: 'select', required: true, options: ['belirsiz süreli', 'belirli süreli'], defaultValue: 'belirsiz süreli' },
      { name: 'notice_period', label: 'İhbar Süresi (gün)', type: 'number', required: true, defaultValue: '30' },
      { name: 'contract_date', label: 'Sözleşme Tarihi', type: 'date', required: true },
    ],
    isPublic: true,
  },
  {
    title: 'Hizmet Sözleşmesi - Danışmanlık',
    description: 'Danışmanlık hizmetleri için genel amaçlı sözleşme şablonu',
    category: 'CONSULTING' as const,
    content: `DANIŞMANLIK HİZMET SÖZLEŞMESİ

Hizmet Veren: {{consultant_name}}
Adres: {{consultant_address}}
T.C./Vergi No: {{consultant_id}}

Hizmet Alan: {{client_name}}
Adres: {{client_address}}
Vergi No: {{client_tax_no}}

Madde 1 - Hizmetin Konusu
Danışman, {{service_description}} konusunda danışmanlık hizmeti sunacaktır.

Madde 2 - Hizmetin Süresi
Hizmet {{start_date}} tarihinde başlayıp {{end_date}} tarihinde sona erecektir.

Madde 3 - Ücret ve Ödeme
Toplam hizmet bedeli {{total_amount}} TL'dir. Ödeme {{payment_terms}} şeklinde yapılacaktır.

Madde 4 - Gizlilik
Taraflar, sözleşme kapsamında öğrendikleri tüm bilgileri gizli tutmayı taahhüt ederler.

Madde 5 - Fesih
Bu sözleşme {{termination_clause}} şartlarında feshedilebilir.

Tarih: {{contract_date}}

Hizmet Veren: _______________     Hizmet Alan: _______________`,
    variables: [
      { name: 'consultant_name', label: 'Danışman Adı', type: 'text', required: true },
      { name: 'consultant_address', label: 'Danışman Adresi', type: 'text', required: true },
      { name: 'consultant_id', label: 'T.C./Vergi No', type: 'text', required: true },
      { name: 'client_name', label: 'Müşteri Adı', type: 'text', required: true },
      { name: 'client_address', label: 'Müşteri Adresi', type: 'text', required: true },
      { name: 'client_tax_no', label: 'Müşteri Vergi No', type: 'text', required: true },
      { name: 'service_description', label: 'Hizmet Açıklaması', type: 'text', required: true },
      { name: 'start_date', label: 'Başlangıç Tarihi', type: 'date', required: true },
      { name: 'end_date', label: 'Bitiş Tarihi', type: 'date', required: true },
      { name: 'total_amount', label: 'Toplam Tutar (TL)', type: 'number', required: true },
      { name: 'payment_terms', label: 'Ödeme Şartları', type: 'select', required: true, options: ['peşin', 'aylık', '3 eşit taksit', 'iş tesliminde'], defaultValue: 'iş tesliminde' },
      { name: 'termination_clause', label: 'Fesih Şartları', type: 'text', required: true, defaultValue: '15 gün önceden yazılı bildirimle' },
      { name: 'contract_date', label: 'Sözleşme Tarihi', type: 'date', required: true },
    ],
    isPublic: true,
  },
  {
    title: 'Gizlilik Sözleşmesi (NDA)',
    description: 'Standart gizlilik anlaşması şablonu',
    category: 'NDA' as const,
    content: `GİZLİLİK ANLAŞMASI (NDA)

Taraf 1: {{party1_name}}
Adres: {{party1_address}}
Vergi/T.C. No: {{party1_id}}

Taraf 2: {{party2_name}}
Adres: {{party2_address}}
Vergi/T.C. No: {{party2_id}}

Madde 1 - Gizli Bilgi Tanımı
Bu anlaşma kapsamında "Gizli Bilgi"; {{confidential_info_definition}}

Madde 2 - Gizlilik Yükümlülüğü
Taraflar, öğrendikleri gizli bilgileri {{confidentiality_period}} süreyle gizli tutmayı taahhüt ederler.

Madde 3 - Kullanım Kısıtlamaları
Gizli bilgiler yalnızca {{permitted_use}} amacıyla kullanılabilir.

Madde 4 - İhlal Durumu
Gizlilik ihlali durumunda, ihlalde bulunan taraf {{penalty_amount}} TL tazminat ödeyecektir.

Madde 5 - Süre
Bu anlaşma {{agreement_start}} tarihinde yürürlüğe girer ve {{agreement_end}} tarihinde sona erer.

Tarih: {{contract_date}}

Taraf 1: _______________     Taraf 2: _______________`,
    variables: [
      { name: 'party1_name', label: '1. Taraf Adı', type: 'text', required: true },
      { name: 'party1_address', label: '1. Taraf Adresi', type: 'text', required: true },
      { name: 'party1_id', label: '1. Taraf Vergi/T.C. No', type: 'text', required: true },
      { name: 'party2_name', label: '2. Taraf Adı', type: 'text', required: true },
      { name: 'party2_address', label: '2. Taraf Adresi', type: 'text', required: true },
      { name: 'party2_id', label: '2. Taraf Vergi/T.C. No', type: 'text', required: true },
      { name: 'confidential_info_definition', label: 'Gizli Bilgi Tanımı', type: 'text', required: true, defaultValue: 'teknik, ticari, finansal ve diğer tüm bilgiler' },
      { name: 'confidentiality_period', label: 'Gizlilik Süresi', type: 'text', required: true, defaultValue: '5 yıl' },
      { name: 'permitted_use', label: 'İzin Verilen Kullanım', type: 'text', required: true },
      { name: 'penalty_amount', label: 'Tazminat Miktarı (TL)', type: 'number', required: true, defaultValue: '50000' },
      { name: 'agreement_start', label: 'Anlaşma Başlangıç Tarihi', type: 'date', required: true },
      { name: 'agreement_end', label: 'Anlaşma Bitiş Tarihi', type: 'date', required: true },
      { name: 'contract_date', label: 'Sözleşme Tarihi', type: 'date', required: true },
    ],
    isPublic: true,
  },
  {
    title: 'Satış Sözleşmesi - Mal',
    description: 'Mal satışı için standart sözleşme şablonu',
    category: 'SALES' as const,
    content: `MAL SATIŞ SÖZLEŞMESİ

Satıcı: {{seller_name}}
Adres: {{seller_address}}
Vergi No: {{seller_tax_no}}

Alıcı: {{buyer_name}}
Adres: {{buyer_address}}
Vergi No: {{buyer_tax_no}}

Madde 1 - Satılan Mal
Satışa konu mal: {{product_description}}
Miktar: {{quantity}}
Birim Fiyatı: {{unit_price}} TL

Madde 2 - Toplam Bedel
Toplam satış bedeli {{total_amount}} TL'dir.

Madde 3 - Ödeme Şartları
Ödeme {{payment_method}} şeklinde {{payment_date}} tarihinde yapılacaktır.

Madde 4 - Teslimat
Mal {{delivery_address}} adresine {{delivery_date}} tarihinde teslim edilecektir.

Madde 5 - Garanti
Satılan mal {{warranty_period}} garanti kapsamındadır.

Madde 6 - Mülkiyet Geçişi
Malın mülkiyeti {{ownership_transfer}} anında alıcıya geçer.

Tarih: {{contract_date}}

Satıcı: _______________     Alıcı: _______________`,
    variables: [
      { name: 'seller_name', label: 'Satıcı Adı', type: 'text', required: true },
      { name: 'seller_address', label: 'Satıcı Adresi', type: 'text', required: true },
      { name: 'seller_tax_no', label: 'Satıcı Vergi No', type: 'text', required: true },
      { name: 'buyer_name', label: 'Alıcı Adı', type: 'text', required: true },
      { name: 'buyer_address', label: 'Alıcı Adresi', type: 'text', required: true },
      { name: 'buyer_tax_no', label: 'Alıcı Vergi No', type: 'text', required: true },
      { name: 'product_description', label: 'Ürün Açıklaması', type: 'text', required: true },
      { name: 'quantity', label: 'Miktar', type: 'text', required: true },
      { name: 'unit_price', label: 'Birim Fiyat (TL)', type: 'number', required: true },
      { name: 'total_amount', label: 'Toplam Tutar (TL)', type: 'number', required: true },
      { name: 'payment_method', label: 'Ödeme Yöntemi', type: 'select', required: true, options: ['nakit', 'havale/EFT', 'kredi kartı', 'çek', 'senet'], defaultValue: 'havale/EFT' },
      { name: 'payment_date', label: 'Ödeme Tarihi', type: 'date', required: true },
      { name: 'delivery_address', label: 'Teslimat Adresi', type: 'text', required: true },
      { name: 'delivery_date', label: 'Teslimat Tarihi', type: 'date', required: true },
      { name: 'warranty_period', label: 'Garanti Süresi', type: 'text', required: true, defaultValue: '2 yıl' },
      { name: 'ownership_transfer', label: 'Mülkiyet Geçiş Anı', type: 'select', required: true, options: ['ödeme yapıldığında', 'mal teslim edildiğinde', 'sözleşme imzalandığında'], defaultValue: 'ödeme yapıldığında' },
      { name: 'contract_date', label: 'Sözleşme Tarihi', type: 'date', required: true },
    ],
    isPublic: true,
  },
];

async function seedTemplates() {
  try {
    console.log('🌱 Seeding contract templates...');

    // Create a default admin user first if not exists
    let adminUser = await prisma.user.findFirst({
      where: { email: 'admin@contravo.com' }
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@contravo.com',
          name: 'System Admin',
          role: 'ADMIN',
          password: '$2a$12$LQv3c1yqBwEHwQ1FpJWCi.TK8xKuNQK0o2fMxAKr.gzC3Q8.qQ.qG', // "admin123"
        },
      });
    }

    // Delete existing public templates
    await prisma.contractTemplate.deleteMany({
      where: { isPublic: true }
    });

    // Create new templates
    for (const template of templates) {
      await prisma.contractTemplate.create({
        data: {
          ...template,
          variables: template.variables,
          createdById: adminUser.id,
        },
      });
    }

    console.log(`✅ Created ${templates.length} contract templates`);
  } catch (error) {
    console.error('❌ Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => {
      console.log('🎉 Template seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Template seeding failed:', error);
      process.exit(1);
    });
}

export default seedTemplates; 