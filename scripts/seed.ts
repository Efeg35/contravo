import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed verisi oluşturuluyor...');

  // Önce mevcut verileri temizle (development için)
  await prisma.notification.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.contractApproval.deleteMany();
  await prisma.contractAttachment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractTemplate.deleteMany();
  await prisma.companyInvite.deleteMany();
  await prisma.companyUser.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.company.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Hash password for test users
  const hashedPassword = await bcrypt.hash('123456', 12);

  // 1. Test kullanıcıları oluştur
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@contravo.com',
      name: 'Ahmet Yılmaz',
      password: hashedPassword,
      role: 'ADMIN',
      image: null,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@techcorp.com',
      name: 'Zeynep Kaya',
      password: hashedPassword,
      role: 'EDITOR',
      image: null,
    },
  });

  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@techcorp.com',
      name: 'Mehmet Demir',
      password: hashedPassword,
      role: 'USER',
      image: null,
    },
  });

  await prisma.user.create({
    data: {
      email: 'contact@globaltech.com',
      name: 'Ayşe Öztürk',
      password: hashedPassword,
      role: 'USER',
      image: null,
    },
  });

  await prisma.user.create({
    data: {
      email: 'freelancer@example.com',
      name: 'Can Özkan',
      password: hashedPassword,
      role: 'USER',
      image: null,
    },
  });

  console.log('✅ Test kullanıcıları oluşturuldu');

  // 2. Şirketler oluştur
  const techCorp = await prisma.company.create({
    data: {
      name: 'TechCorp Solutions',
      description: 'Teknoloji danışmanlığı ve yazılım geliştirme şirketi',
      address: 'Maslak Mahallesi, Büyükdere Caddesi No:123, Sarıyer/İstanbul',
      phone: '+90 212 555 0123',
      website: 'https://www.techcorp.com.tr',
      createdById: adminUser.id,
    },
  });

  const digitalAgency = await prisma.company.create({
    data: {
      name: 'Digital Marketing Agency',
      description: 'Dijital pazarlama ve reklam ajansı',
      address: 'Bağdat Caddesi No:456, Kadıköy/İstanbul',
      phone: '+90 216 555 0456',
      website: 'https://www.digitalagency.com.tr',
      createdById: managerUser.id,
    },
  });

  const consultingFirm = await prisma.company.create({
    data: {
      name: 'Business Consulting Firm',
      description: 'İş danışmanlığı ve stratejik planlama',
      address: 'Levent Mahallesi, Akşam Bostanı Sokak No:789, Beşiktaş/İstanbul',
      phone: '+90 212 555 0789',
      website: 'https://www.bcfirm.com.tr',
      createdById: adminUser.id,
    },
  });

  console.log('✅ Şirketler oluşturuldu');

  // 3. Şirket üyelikleri oluştur
  await prisma.companyUser.createMany({
    data: [
      { companyId: techCorp.id, userId: adminUser.id, role: 'ADMIN' },
      { companyId: techCorp.id, userId: managerUser.id, role: 'EDITOR' },
      { companyId: techCorp.id, userId: employeeUser.id, role: 'USER' },
      { companyId: digitalAgency.id, userId: managerUser.id, role: 'ADMIN' },
      { companyId: digitalAgency.id, userId: employeeUser.id, role: 'USER' },
      { companyId: consultingFirm.id, userId: adminUser.id, role: 'ADMIN' },
    ],
  });

  console.log('✅ Şirket üyelikleri oluşturuldu');

  // 4. Şirket ayarları
  await prisma.companySettings.createMany({
    data: [
      {
        companyId: techCorp.id,
        defaultContractType: 'Yazılım Geliştirme Sözleşmesi',
        requireApproval: true,
        allowSelfApproval: false,
        notificationSettings: {
          email: true,
          contractExpiry: true,
          approvalRequired: true,
          weeklyReport: true,
        },
      },
      {
        companyId: digitalAgency.id,
        defaultContractType: 'Dijital Pazarlama Hizmet Sözleşmesi',
        requireApproval: true,
        allowSelfApproval: false,
        notificationSettings: {
          email: true,
          contractExpiry: true,
          approvalRequired: true,
          weeklyReport: false,
        },
      },
      {
        companyId: consultingFirm.id,
        defaultContractType: 'Danışmanlık Hizmet Sözleşmesi',
        requireApproval: true,
        allowSelfApproval: true,
        notificationSettings: {
          email: true,
          contractExpiry: true,
          approvalRequired: false,
          weeklyReport: true,
        },
      },
    ],
  });

  console.log('✅ Şirket ayarları oluşturuldu');

  // 5. Sözleşme şablonları oluştur
  await prisma.contractTemplate.create({
    data: {
      title: 'Standart İş Sözleşmesi',
      description: 'Tam zamanlı çalışanlar için standart iş sözleşmesi şablonu',
      category: 'EMPLOYMENT',
      content: `İŞ SÖZLEŞMESİ

Bu sözleşme {{COMPANY_NAME}} ile {{EMPLOYEE_NAME}} arasında imzalanmıştır.

MADDE 1 - İŞİN TANIMI
Çalışan {{JOB_TITLE}} pozisyonunda görev yapacaktır.

MADDE 2 - ÜCRET
Aylık brüt ücret {{SALARY}} TL'dir.

MADDE 3 - ÇALIŞMA SAATLERİ
Haftalık çalışma süresi {{WORKING_HOURS}} saattir.`,
      variables: {
        COMPANY_NAME: { type: 'text', label: 'Şirket Adı', required: true },
        EMPLOYEE_NAME: { type: 'text', label: 'Çalışan Adı', required: true },
        JOB_TITLE: { type: 'text', label: 'Pozisyon', required: true },
        SALARY: { type: 'number', label: 'Maaş', required: true },
        WORKING_HOURS: { type: 'number', label: 'Haftalık Çalışma Saati', required: true },
      },
      isPublic: true,
      isActive: true,
      createdById: adminUser.id,
      companyId: techCorp.id,
    },
  });

  const serviceTemplate = await prisma.contractTemplate.create({
    data: {
      title: 'Yazılım Geliştirme Hizmet Sözleşmesi',
      description: 'Yazılım projeleri için hizmet sözleşmesi şablonu',
      category: 'SERVICE',
      content: `YAZILIM GELİŞTİRME HİZMET SÖZLEŞMESİ

Bu sözleşme {{COMPANY_NAME}} ile {{CLIENT_NAME}} arasında imzalanmıştır.

MADDE 1 - HİZMET TANIMI
{{SERVICE_DESCRIPTION}}

MADDE 2 - ÜCRET VE ÖDEME
Toplam proje bedeli {{TOTAL_AMOUNT}} TL'dir.
Ödeme planı: {{PAYMENT_TERMS}}

MADDE 3 - TESLİM TARİHİ
Proje teslim tarihi: {{DELIVERY_DATE}}`,
      variables: {
        COMPANY_NAME: { type: 'text', label: 'Şirket Adı', required: true },
        CLIENT_NAME: { type: 'text', label: 'Müşteri Adı', required: true },
        SERVICE_DESCRIPTION: { type: 'textarea', label: 'Hizmet Açıklaması', required: true },
        TOTAL_AMOUNT: { type: 'number', label: 'Toplam Tutar', required: true },
        PAYMENT_TERMS: { type: 'text', label: 'Ödeme Koşulları', required: true },
        DELIVERY_DATE: { type: 'date', label: 'Teslim Tarihi', required: true },
      },
      isPublic: true,
      isActive: true,
      createdById: adminUser.id,
      companyId: techCorp.id,
    },
  });

  await prisma.contractTemplate.create({
    data: {
      title: 'Gizlilik Sözleşmesi (NDA)',
      description: 'Standart gizlilik anlaşması şablonu',
      category: 'NDA',
      content: `GİZLİLİK SÖZLEŞMESİ

Bu sözleşme {{COMPANY_NAME}} ile {{PARTY_NAME}} arasında imzalanmıştır.

MADDE 1 - GİZLİ BİLGİLER
Taraflar arasında paylaşılan tüm ticari ve teknik bilgiler gizli sayılır.

MADDE 2 - GİZLİLİK YÜKÜMLÜLÜĞÜ
Gizlilik yükümlülüğü {{VALIDITY_PERIOD}} yıl süreyle geçerlidir.

MADDE 3 - İHLAL SONUÇLARI
Gizlilik ihlali durumunda {{PENALTY_AMOUNT}} TL ceza ödenecektir.`,
      variables: {
        COMPANY_NAME: { type: 'text', label: 'Şirket Adı', required: true },
        PARTY_NAME: { type: 'text', label: 'Karşı Taraf Adı', required: true },
        VALIDITY_PERIOD: { type: 'number', label: 'Geçerlilik Süresi (Yıl)', required: true },
        PENALTY_AMOUNT: { type: 'number', label: 'Ceza Miktarı', required: true },
      },
      isPublic: true,
      isActive: true,
      createdById: adminUser.id,
    },
  });

  console.log('✅ Sözleşme şablonları oluşturuldu');

  // 6. Aktif sözleşmeler oluştur
  const softwareContract = await prisma.contract.create({
    data: {
      title: 'E-Ticaret Platformu Geliştirme Projesi',
      description: 'Modern e-ticaret platformu geliştirme ve entegrasyon hizmetleri',
      status: 'APPROVED',
      type: 'Yazılım Geliştirme',
      value: 150000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-06-15'),
      otherPartyName: 'GlobalTech Industries',
      otherPartyEmail: 'contact@globaltech.com',
      companyId: techCorp.id,
      templateId: serviceTemplate.id,
      createdById: adminUser.id,
    },
  });

  const marketingContract = await prisma.contract.create({
    data: {
      title: 'Dijital Pazarlama Kampanyası',
      description: 'Sosyal medya ve Google Ads pazarlama kampanyası yönetimi',
      status: 'SIGNED',
      type: 'Pazarlama Hizmetleri',
      value: 50000,
      startDate: new Date('2024-02-01'),
      endDate: new Date('2024-05-31'),
      otherPartyName: 'TechStartup Ltd.',
      otherPartyEmail: 'ceo@techstartup.com',
      companyId: digitalAgency.id,
      createdById: managerUser.id,
    },
  });

  const consultingContract = await prisma.contract.create({
    data: {
      title: 'İş Süreçleri Optimizasyonu Danışmanlığı',
      description: 'Operasyonel verimlilik artırma ve süreç iyileştirme danışmanlığı',
      status: 'IN_REVIEW',
      type: 'Danışmanlık',
      value: 75000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      otherPartyName: 'Manufacturing Corp.',
      otherPartyEmail: 'operations@manufacturing.com',
      companyId: consultingFirm.id,
      createdById: adminUser.id,
    },
  });

  const freelanceContract = await prisma.contract.create({
    data: {
      title: 'Mobil Uygulama UI/UX Tasarımı',
      description: 'iOS ve Android için mobil uygulama kullanıcı arayüzü tasarımı',
      status: 'DRAFT',
      type: 'Tasarım Hizmetleri',
      value: 25000,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-05-15'),
      otherPartyName: 'Can Özkan',
      otherPartyEmail: 'freelancer@example.com',
      companyId: techCorp.id,
      templateId: serviceTemplate.id,
      createdById: managerUser.id,
    },
  });

  await prisma.contract.create({
    data: {
      title: 'Web Sitesi Bakım Hizmetleri',
      description: 'Kurumsal web sitesi bakım ve güncelleme hizmetleri',
      status: 'ARCHIVED',
      type: 'Bakım Hizmetleri',
      value: 12000,
      startDate: new Date('2023-06-01'),
      endDate: new Date('2023-12-31'),
      otherPartyName: 'Local Business Inc.',
      otherPartyEmail: 'info@localbusiness.com',
      companyId: techCorp.id,
      createdById: adminUser.id,
    },
  });

  console.log('✅ Sözleşmeler oluşturuldu');

  // 7. Sözleşme onayları
  await prisma.contractApproval.createMany({
    data: [
      {
        contractId: softwareContract.id,
        approverId: adminUser.id,
        status: 'APPROVED',
        comment: 'Proje kapsamı uygun, onaylandı',
        approvedAt: new Date('2024-01-20'),
      },
      {
        contractId: consultingContract.id,
        approverId: adminUser.id,
        status: 'PENDING',
        comment: null,
        approvedAt: null,
      },
      {
        contractId: freelanceContract.id,
        approverId: managerUser.id,
        status: 'PENDING',
        comment: null,
        approvedAt: null,
      },
    ],
  });

  console.log('✅ Sözleşme onayları oluşturuldu');

  // 8. Sözleşme versiyonları
  await prisma.contractVersion.createMany({
    data: [
      {
        contractId: softwareContract.id,
        versionNumber: '1.0',
        title: 'E-Ticaret Platformu Geliştirme Projesi',
        description: 'İlk versiyon',
        content: 'Proje kapsamı ve teslim tarihleri belirlendi.',
        status: 'APPROVED',
        value: 150000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-06-15'),
        changeType: 'CREATED',
        changeDescription: 'Sözleşme oluşturuldu',
        createdById: adminUser.id,
      },
      {
        contractId: marketingContract.id,
        versionNumber: '1.0',
        title: 'Dijital Pazarlama Kampanyası',
        description: 'İlk versiyon',
        content: 'Pazarlama stratejisi ve bütçe onaylandı.',
        status: 'SIGNED',
        value: 50000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        changeType: 'CREATED',
        changeDescription: 'Sözleşme oluşturuldu',
        createdById: managerUser.id,
      },
      {
        contractId: marketingContract.id,
        versionNumber: '1.1',
        title: 'Dijital Pazarlama Kampanyası - Güncellenmiş',
        description: 'Sosyal medya platformları güncellendi',
        content: 'Instagram ve TikTok kampanyaları eklendi.',
        status: 'SIGNED',
        value: 55000,
        startDate: new Date('2024-02-01'),
        endDate: new Date('2024-05-31'),
        changeType: 'CONTENT_MODIFIED',
        changeDescription: 'Sosyal medya platformları eklendi, bütçe artırıldı',
        createdById: managerUser.id,
      },
    ],
  });

  console.log('✅ Sözleşme versiyonları oluşturuldu');

  // 9. Şirket davetleri
  await prisma.companyInvite.createMany({
    data: [
      {
        email: 'newemployee@techcorp.com',
        role: 'USER',
        status: 'PENDING',
        companyId: techCorp.id,
        invitedById: adminUser.id,
      },
      {
        email: 'designer@digitalagency.com',
        role: 'EDITOR',
        status: 'PENDING',
        companyId: digitalAgency.id,
        invitedById: managerUser.id,
      },
      {
        email: 'consultant@bcfirm.com',
        role: 'USER',
        status: 'EXPIRED',
        companyId: consultingFirm.id,
        invitedById: adminUser.id,
      },
    ],
  });

  console.log('✅ Şirket davetleri oluşturuldu');

  // 10. Bildirimler
  await prisma.notification.createMany({
    data: [
      {
        userId: adminUser.id,
        contractId: consultingContract.id,
        type: 'APPROVAL_NEEDED',
        title: 'Yeni sözleşme onayı gerekiyor',
        message: 'İş Süreçleri Optimizasyonu Danışmanlığı sözleşmesi onayınızı bekliyor.',
        isRead: false,
        emailSent: true,
        metadata: { priority: 'high' },
      },
      {
        userId: managerUser.id,
        contractId: freelanceContract.id,
        type: 'APPROVAL_NEEDED',
        title: 'Tasarım sözleşmesi onayı',
        message: 'Mobil Uygulama UI/UX Tasarımı sözleşmesi onayınızı bekliyor.',
        isRead: false,
        emailSent: true,
        metadata: { priority: 'medium' },
      },
      {
        userId: adminUser.id,
        contractId: softwareContract.id,
        type: 'CONTRACT_EXPIRING',
        title: 'Sözleşme süresi dolmak üzere',
        message: 'E-Ticaret Platformu Geliştirme Projesi 30 gün içinde sona erecek.',
        isRead: true,
        emailSent: true,
        metadata: { daysLeft: 30 },
      },
      {
        userId: managerUser.id,
        contractId: marketingContract.id,
        type: 'VERSION_CREATED',
        title: 'Yeni sözleşme versiyonu oluşturuldu',
        message: 'Dijital Pazarlama Kampanyası için v1.1 versiyonu oluşturuldu.',
        isRead: false,
        emailSent: false,
        metadata: { version: '1.1' },
      },
      {
        userId: employeeUser.id,
        type: 'APPROVAL_RECEIVED',
        title: 'Sözleşme onaylandı',
        message: 'Pazarlama kampanyası sözleşmeniz onaylandı ve imzaya hazır.',
        isRead: true,
        emailSent: true,
        metadata: { approver: 'Zeynep Kaya' },
      },
    ],
  });

  console.log('✅ Bildirimler oluşturuldu');

  // 11. Smart Clauses (Akıllı Maddeler)
  const confidentialityClause = await (prisma as any).clause.create({
    data: {
      title: 'Gizlilik ve Veri Koruma Maddesi',
      description: 'Standart gizlilik ve veri koruma yükümlülükleri',
      content: 'Taraflar, bu sözleşme kapsamında edindikleri tüm gizli bilgileri {{confidentiality_period}} süreyle gizli tutmayı taahhüt ederler. {{company_name}} ve {{other_party}} arasında paylaşılan tüm ticari bilgiler, teknik veriler ve kişisel veriler gizli kabul edilir.',
      category: 'CONFIDENTIALITY',
      visibility: 'COMPANY',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: adminUser.id,
      companyId: techCorp.id,
      variables: {
        create: [
          {
            name: 'confidentiality_period',
            label: 'Gizlilik Süresi',
            type: 'STRING',
            defaultValue: '5 yıl',
            isRequired: true,
            description: 'Gizlilik yükümlülüğünün süresi'
          },
          {
            name: 'company_name',
            label: 'Şirket Adı',
            type: 'STRING',
            isRequired: true,
            description: 'Ana şirket adı'
          },
          {
            name: 'other_party',
            label: 'Karşı Taraf',
            type: 'STRING',
            isRequired: true,
            description: 'Sözleşmenin diğer tarafı'
          }
        ]
      }
    }
  });

  const paymentClause = await (prisma as any).clause.create({
    data: {
      title: 'Ödeme Koşulları ve Gecikme Faizi',
      description: 'Standart ödeme koşulları, vadeler ve gecikme faizi hesaplaması',
      content: 'Ödeme {{payment_days}} gün içinde {{payment_method}} yoluyla yapılacaktır. Geç ödemeler için aylık %{{late_fee_rate}} gecikme faizi uygulanır. Ödemeler {{currency}} olarak gerçekleştirilecektir.',
      category: 'PAYMENT',
      visibility: 'COMPANY',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: adminUser.id,
      companyId: techCorp.id,
      variables: {
        create: [
          {
            name: 'payment_days',
            label: 'Ödeme Vadesi (Gün)',
            type: 'NUMBER',
            defaultValue: '30',
            isRequired: true,
            description: 'Ödeme için verilen süre'
          },
          {
            name: 'payment_method',
            label: 'Ödeme Yöntemi',
            type: 'STRING',
            defaultValue: 'havale/EFT',
            isRequired: true,
            description: 'Kabul edilen ödeme yöntemi'
          },
          {
            name: 'late_fee_rate',
            label: 'Gecikme Faiz Oranı (%)',
            type: 'PERCENTAGE',
            defaultValue: '2',
            isRequired: true,
            description: 'Aylık gecikme faiz oranı'
          },
          {
            name: 'currency',
            label: 'Para Birimi',
            type: 'CURRENCY',
            defaultValue: 'TL',
            isRequired: true,
            description: 'Ödeme para birimi'
          }
        ]
      }
    }
  });

  const terminationClause = await (prisma as any).clause.create({
    data: {
      title: 'Sözleşme Feshi ve İhbar Süresi',
      description: 'Sözleşme feshi koşulları ve ihbar süreleri',
      content: 'Bu sözleşme {{notice_period}} önceden yazılı bildirimde bulunarak feshedilebilir. Haklı sebeplerle derhal fesih mümkündür. Fesih durumunda {{company_name}} tamamlanan işler için ödeme yapmakla yükümlüdür.',
      category: 'TERMINATION',
      visibility: 'PUBLIC',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: adminUser.id,
      companyId: null, // Public clause
      variables: {
        create: [
          {
            name: 'notice_period',
            label: 'İhbar Süresi',
            type: 'STRING',
            defaultValue: '30 gün',
            isRequired: true,
            description: 'Fesih için gerekli ihbar süresi'
          },
          {
            name: 'company_name',
            label: 'Şirket Adı',
            type: 'STRING',
            isRequired: true,
            description: 'Ödeme yükümlüsü şirket'
          }
        ]
      }
    }
  });

  const liabilityClause = await (prisma as any).clause.create({
    data: {
      title: 'Sorumluluk Sınırlaması',
      description: 'Sorumluluk sınırları ve tazminat kuralları',
      content: 'Tarafların sorumluluğu {{liability_limit}} ile sınırlıdır. Dolaylı zararlar, kar kaybı ve fırsat maliyetleri tazmin kapsamı dışındadır. Kasıt ve ağır kusur durumlarında bu sınırlama geçerli değildir.',
      category: 'LIABILITY',
      visibility: 'COMPANY',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: managerUser.id,
      companyId: digitalAgency.id,
      variables: {
        create: [
          {
            name: 'liability_limit',
            label: 'Sorumluluk Sınırı',
            type: 'CURRENCY',
            defaultValue: '100.000 TL',
            isRequired: true,
            description: 'Maksimum sorumluluk tutarı'
          }
        ]
      }
    }
  });

  const intellectualPropertyClause = await (prisma as any).clause.create({
    data: {
      title: 'Fikri Mülkiyet Hakları',
      description: 'Fikri mülkiyet sahipliği ve kullanım hakları',
      content: 'Proje kapsamında üretilen tüm fikri mülkiyet hakları {{ip_owner}} ait olacaktır. {{other_party}} sadece belirlenen amaçla kullanım hakkına sahiptir. Telif hakları {{copyright_period}} süreyle korunur.',
      category: 'INTELLECTUAL_PROPERTY',
      visibility: 'COMPANY',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: adminUser.id,
      companyId: techCorp.id,
      variables: {
        create: [
          {
            name: 'ip_owner',
            label: 'Fikri Mülkiyet Sahibi',
            type: 'STRING',
            isRequired: true,
            description: 'Fikri mülkiyetin sahibi'
          },
          {
            name: 'other_party',
            label: 'Kullanım Hakkı Sahibi',
            type: 'STRING',
            isRequired: true,
            description: 'Kullanım hakkına sahip taraf'
          },
          {
            name: 'copyright_period',
            label: 'Telif Hakkı Süresi',
            type: 'STRING',
            defaultValue: 'yasal süre',
            isRequired: false,
            description: 'Telif hakkı koruma süresi'
          }
        ]
      }
    }
  });

  const forceMarjeureClause = await (prisma as any).clause.create({
    data: {
      title: 'Mücbir Sebep (Force Majeure)',
      description: 'Doğal afet, savaş ve benzeri olağanüstü durumlar',
      content: 'Doğal afet, savaş, pandemi, hükümet kararları gibi mücbir sebep durumlarında taraflar yükümlülüklerinden {{suspension_period}} süreyle muaf tutulur. Mücbir sebep {{notification_period}} içinde karşı tarafa bildirilmelidir.',
      category: 'FORCE_MAJEURE',
      visibility: 'PUBLIC',
      approvalStatus: 'APPROVED',
      isActive: true,
      version: 1,
      createdById: adminUser.id,
      companyId: null,
      variables: {
        create: [
          {
            name: 'suspension_period',
            label: 'Askıya Alma Süresi',
            type: 'STRING',
            defaultValue: 'mücbir sebep süresi boyunca',
            isRequired: true,
            description: 'Yükümlülüklerin askıya alınma süresi'
          },
          {
            name: 'notification_period',
            label: 'Bildirim Süresi',
            type: 'STRING',
            defaultValue: '7 gün',
            isRequired: true,
            description: 'Mücbir sebebin bildirilmesi gereken süre'
          }
        ]
      }
    }
  });

  // Clause kullanım istatistikleri
  await (prisma as any).clauseUsage.createMany({
    data: [
      {
        clauseId: confidentialityClause.id,
        contractId: softwareContract.id,
        userId: adminUser.id,
        contractType: 'Yazılım Geliştirme',
        position: 1
      },
      {
        clauseId: paymentClause.id,
        contractId: softwareContract.id,
        userId: adminUser.id,
        contractType: 'Yazılım Geliştirme',
        position: 2
      },
      {
        clauseId: paymentClause.id,
        contractId: marketingContract.id,
        userId: managerUser.id,
        contractType: 'Pazarlama Hizmetleri',
        position: 1
      },
      {
        clauseId: terminationClause.id,
        contractId: consultingContract.id,
        userId: adminUser.id,
        contractType: 'Danışmanlık',
        position: 3
      }
    ]
  });

  console.log('✅ Smart Clauses oluşturuldu');

  // İstatistikler yazdır
  const userCount = await prisma.user.count();
  const companyCount = await prisma.company.count();
  const contractCount = await prisma.contract.count();
  const templateCount = await prisma.contractTemplate.count();
  const inviteCount = await prisma.companyInvite.count();
  const notificationCount = await prisma.notification.count();
  
  // Smart Clauses count (try-catch for compatibility)
  let clauseCount = 0;
  try {
    clauseCount = await (prisma as any).clause.count();
  } catch (e) {
    // Ignore if clause model not available yet
  }

  console.log('\n📊 Test verisi özeti:');
  console.log(`👥 Kullanıcılar: ${userCount}`);
  console.log(`🏢 Şirketler: ${companyCount}`);
  console.log(`📄 Sözleşmeler: ${contractCount}`);
  console.log(`📋 Şablonlar: ${templateCount}`);
  console.log(`✉️ Davetler: ${inviteCount}`);
  console.log(`🔔 Bildirimler: ${notificationCount}`);
  if (clauseCount > 0) {
    console.log(`📝 Smart Clauses: ${clauseCount}`);
  }

  console.log('\n🔑 Test hesapları:');
  console.log('Admin: admin@contravo.com / 123456');
  console.log('Manager: manager@techcorp.com / 123456');
  console.log('Employee: employee@techcorp.com / 123456');
  console.log('Client: contact@globaltech.com / 123456');
  console.log('Freelancer: freelancer@example.com / 123456');

  console.log('\n✅ Test verisi başarıyla oluşturuldu!');
}

main()
  .catch((e) => {
    console.error('❌ Seed işlemi sırasında hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 