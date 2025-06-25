import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcryptjs';
import { ContractStatusEnum } from '../app/types';

const prisma = new PrismaClient();

// Türkçe isimler ve soyadlar
const turkishNames = [
  'Ahmet', 'Mehmet', 'Ayşe', 'Fatma', 'Mustafa', 'Emine', 'Ali', 'Hatice', 
  'Hüseyin', 'Zeynep', 'İbrahim', 'Özlem', 'Ömer', 'Elif', 'Yusuf', 'Derya',
  'Hasan', 'Merve', 'İsmail', 'Seda', 'Emre', 'Büşra', 'Serkan', 'Gülşen',
  'Burak', 'Deniz', 'Can', 'Selin', 'Barış', 'Pınar', 'Kaan', 'Ece'
];

const turkishSurnames = [
  'Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk',
  'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara',
  'Koç', 'Kurt', 'Özkan', 'Şimşek', 'Ergün', 'Polat', 'Erdoğan', 'Güler',
  'Aktaş', 'Bayram', 'Çakır', 'Acar', 'Korkmaz', 'Türk', 'Uçar', 'Güven'
];

// Departmanlar
const departments = [
  { name: 'Satış', code: 'SALES' },
  { name: 'Pazarlama', code: 'MARKETING' },
  { name: 'Hukuk', code: 'LEGAL' },
  { name: 'Finans', code: 'FINANCE' },
  { name: 'İnsan Kaynakları', code: 'HR' },
  { name: 'Teknoloji', code: 'TECH' },
  { name: 'Operasyon', code: 'OPERATIONS' },
  { name: 'Ar-Ge', code: 'RD' },
  { name: 'Müşteri Hizmetleri', code: 'CUSTOMER_SERVICE' },
  { name: 'İdari İşler', code: 'ADMIN_AFFAIRS' },
  { name: 'Kalite Kontrol', code: 'QA' },
  { name: 'Yönetim', code: 'MANAGEMENT' }
];

// Departmana göre gerçekçi sözleşme başlıkları
const contractTemplatesByDepartment = {
  SALES: [
    'Kurumsal Müşteri Yıllık Satış Sözleşmesi',
    'Distribütör Anlaşması',
    'Bayi Satış Sözleşmesi',
    'E-ticaret Platform Sözleşmesi',
    'Ürün Tedarik Anlaşması',
    'Satış Temsilcisi Komisyon Sözleşmesi',
    'Müşteri Hizmet Anlaşması',
    'Franchise Sözleşmesi',
    'İhracat Satış Sözleşmesi',
    'Toptan Satış Anlaşması',
    'Perakende Satış Sözleşmesi',
    'Online Satış Platform Anlaşması'
  ],
  MARKETING: [
    'Sosyal Medya Influencer Sözleşmesi',
    'Reklam Ajansı Hizmet Anlaşması',
    'Dijital Pazarlama Danışmanlık Sözleşmesi',
    'Marka Sponsorluk Anlaşması',
    'Etkinlik Organizasyon Sözleşmesi',
    'Google Ads Yönetim Sözleşmesi',
    'İçerik Üretim Anlaşması',
    'PR Ajansı Sözleşmesi',
    'Grafik Tasarım Hizmet Sözleşmesi',
    'Video Prodüksiyon Anlaşması',
    'SEO Danışmanlık Sözleşmesi',
    'Marka Ambassador Anlaşması'
  ],
  LEGAL: [
    'Hukuki Danışmanlık Sözleşmesi',
    'Dava Vekalet Anlaşması',
    'Şirket Birleşme Sözleşmesi',
    'Fikri Mülkiyet Lisans Anlaşması',
    'Ticaret Sırrı Gizlilik Sözleşmesi',
    'İcra Takip Sözleşmesi',
    'Hukuki İnceleme Hizmet Anlaşması',
    'Patent Başvuru Sözleşmesi',
    'Marka Tescil Anlaşması',
    'Sözleşme İnceleme Hizmet Anlaşması',
    'Uyumluluk Danışmanlık Sözleşmesi',
    'Hukuki Risk Analizi Sözleşmesi'
  ],
  FINANCE: [
    'Bankacılık Hizmetleri Sözleşmesi',
    'Kredi Anlaşması',
    'Faktoring Hizmet Sözleşmesi',
    'Muhasebe Hizmetleri Anlaşması',
    'Mali Müşavir Sözleşmesi',
    'Sigorta Poliçe Anlaşması',
    'Yatırım Danışmanlık Sözleşmesi',
    'Bağımsız Denetim Sözleşmesi',
    'Finansal Raporlama Hizmet Anlaşması',
    'Vergi Danışmanlık Sözleşmesi',
    'Leasing Anlaşması',
    'Treasury Yönetim Sözleşmesi'
  ],
  HR: [
    'Kıdemli Yazılımcı İş Sözleşmesi',
    'Performans Değerlendirme Politikası',
    'İK Danışmanlık Hizmet Sözleşmesi',
    'Eğitim ve Gelişim Anlaşması',
    'Bordro Hizmetleri Sözleşmesi',
    'İşe Alım Süreç Danışmanlık Anlaşması',
    'Çalışan Memnuniyet Araştırması Sözleşmesi',
    'Özlük İşleri Hizmet Anlaşması',
    'İş Sağlığı ve Güvenliği Danışmanlık Sözleşmesi',
    'Kariyer Danışmanlık Anlaşması',
    'İşten Çıkarma Danışmanlık Sözleşmesi',
    'Çalışan Hakları Eğitim Sözleşmesi'
  ],
  TECH: [
    'Yazılım Geliştirme Sözleşmesi',
    'IT Danışmanlık Hizmet Anlaşması',
    'Cloud Hosting Hizmet Sözleşmesi',
    'Cybersecurity Danışmanlık Anlaşması',
    'Mobil Uygulama Geliştirme Sözleşmesi',
    'Sistem Entegrasyon Anlaşması',
    'Veritabanı Yönetim Hizmet Sözleşmesi',
    'DevOps Danışmanlık Anlaşması',
    'Yazılım Lisans Sözleşmesi',
    'IT Destek Hizmet Anlaşması',
    'Backup ve Recovery Hizmet Sözleşmesi',
    'Network Altyapı Kurulum Sözleşmesi'
  ],
  MANAGEMENT: [
    'Stratejik Danışmanlık Sözleşmesi',
    'Yönetim Kurulu Danışmanlık Anlaşması',
    'İş Süreç Optimizasyon Sözleşmesi',
    'Organizasyonel Gelişim Danışmanlık Anlaşması',
    'Change Management Sözleşmesi',
    'Executive Coaching Anlaşması',
    'Risk Yönetim Danışmanlık Sözleşmesi',
    'Kurumsal Yönetişim Sözleşmesi',
    'Performance Management Anlaşması',
    'Digital Transformation Danışmanlık Sözleşmesi',
    'Operational Excellence Sözleşmesi',
    'Business Intelligence Danışmanlık Anlaşması'
  ],
  OPERATIONS: [
    'Lojistik Hizmet Sözleşmesi',
    'Tedarik Zinciri Yönetim Anlaşması',
    'Depo Kiralama Sözleşmesi',
    'Üretim Fason Sözleşmesi',
    'Nakliye Sigorta Poliçesi',
    'Gümrük Müşavirliği Hizmet Anlaşması'
  ],
  RD: [
    'Ar-Ge Projesi İşbirliği Sözleşmesi',
    'Prototip Geliştirme Anlaşması',
    'Teknoloji Transfer Sözleşmesi',
    'Araştırma Bursu Sözleşmesi',
    'Laboratuvar Kullanım Anlaşması',
    'Bilimsel Danışmanlık Sözleşmesi'
  ],
  CUSTOMER_SERVICE: [
    'Çağrı Merkezi Hizmet Anlaşması',
    'Müşteri Destek Platformu Lisans Sözleşmesi',
    'Hizmet Seviyesi Anlaşması (SLA)',
    'Müşteri Memnuniyeti Anketi Hizmet Alımı',
    'Dış Kaynak Müşteri Temsilcisi Sözleşmesi'
  ],
  ADMIN_AFFAIRS: [
    'Ofis Kiralama Sözleşmesi',
    'Güvenlik Hizmeti Alım Sözleşmesi',
    'Araç Filo Kiralama Sözleşmesi',
    'Temizlik Hizmeti Sözleşmesi',
    'Yemek Tedarik (Catering) Anlaşması',
    'Ofis Malzemeleri Tedarik Sözleşmesi'
  ],
  QA: [
    'Kalite Güvence Danışmanlık Sözleşmesi',
    'Test ve Doğrulama Hizmet Anlaşması',
    'ISO Belgelendirme Sözleşmesi',
    'Ürün Kalite Kontrol Raporlama Anlaşması',
    'Süreç Denetim Hizmet Sözleşmesi'
  ]
};

function getRandomTurkishName(): string {
  const firstName = faker.helpers.arrayElement(turkishNames);
  const lastName = faker.helpers.arrayElement(turkishSurnames);
  return `${firstName} ${lastName}`;
}

function generateTurkishEmail(name: string): string {
  const nameParts = name.toLowerCase().split(' ');
  const firstName = nameParts[0]
    .replace('ç', 'c')
    .replace('ğ', 'g')
    .replace('ı', 'i')
    .replace('ö', 'o')
    .replace('ş', 's')
    .replace('ü', 'u');
  const lastName = nameParts[1]
    .replace('ç', 'c')
    .replace('ğ', 'g')
    .replace('ı', 'i')
    .replace('ö', 'o')
    .replace('ş', 's')
    .replace('ü', 'u');
  
  // Benzersizlik için rastgele sayı ekleyelim
  const randomNum = faker.number.int({ min: 100, max: 9999 });
  return `${firstName}.${lastName}${randomNum}@contravo.com`;
}

async function main() {
  console.log('🚀 Seed işlemi başlıyor...');
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  // 1. Mevcut verileri temizle (doğru sırada)
  console.log('🧹 Mevcut veriler temizleniyor...');
  
  await prisma.workflowTemplateStep.deleteMany();
  await prisma.workflowTemplate.deleteMany();
  await prisma.clausesOnContracts.deleteMany();
  await prisma.scheduleLog.deleteMany();
  await prisma.reportSchedule.deleteMany();
  await prisma.savedReport.deleteMany();
  await prisma.usersOnTeams.deleteMany();
  await prisma.clauseApproval.deleteMany();
  await prisma.clauseUsage.deleteMany();
  await prisma.clauseVariable.deleteMany();
  await prisma.clause.deleteMany();
  await prisma.signaturePackage.deleteMany();
  await prisma.digitalSignature.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationSettings.deleteMany();
  await prisma.contractVersion.deleteMany();
  await prisma.contractApproval.deleteMany();
  await prisma.contractAttachment.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.contractTemplate.deleteMany();
  await prisma.companyInvite.deleteMany();
  await prisma.companyUser.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.company.deleteMany();
  await prisma.sessionActivity.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.passwordHistory.deleteMany();
  await prisma.tokenBlacklist.deleteMany();
  await prisma.team.deleteMany();
  await prisma.user.deleteMany();

  // 2. Departmanları (Team olarak) oluştur
  console.log('🏢 Departmanlar oluşturuluyor...');
  await prisma.team.createMany({
    data: departments.map(d => ({ name: d.name })),
  });
  const createdTeams = await prisma.team.findMany();
  const teamsMap = new Map(createdTeams.map((t: { id: string; name: string }) => [t.name, t.id]));
  console.log(`✅ ${createdTeams.length} departman oluşturuldu.`);

  // 3. Admin kullanıcısını oluştur (şirketlerin 'createdBy' alanı için)
  const adminUser = await prisma.user.create({
    data: {
        name: 'Sistem Admin',
        email: `admin_${faker.string.uuid()}@contravo.com`,
        password: hashedPassword,
        role: 'SUPER_ADMIN',
      }
  });

  // 4. Şirketleri oluştur
  console.log('🏭 Şirketler oluşturuluyor...');
  const companyNames = Array.from({ length: 15 }, generateCompanyName);
  const companiesData = companyNames.map(name => ({
    name,
    description: faker.company.catchPhrase(),
    address: faker.location.streetAddress(),
    phone: faker.phone.number(),
    website: `https://${name.toLowerCase().replace(/\s/g, '')}.com`,
    createdById: adminUser.id,
  }));
  await prisma.company.createMany({ data: companiesData });
  const companies = await prisma.company.findMany();
  console.log(`✅ ${companies.length} şirket oluşturuldu.`);

  // === Statik kullanıcıyı oluştur ve ilk şirkete ata ===
  console.log('👤 Statik kullanıcı (hatice.ergun) oluşturuluyor...');
  const haticeUser = await prisma.user.create({
    data: {
      name: 'Hatice Ergün',
      email: 'hatice.ergun9446@contravo.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  await prisma.companyUser.create({
    data: {
      userId: haticeUser.id,
      companyId: companies[0].id, // İlk oluşturulan şirkete ata
      role: 'ADMIN',
    },
  });
  console.log(`✅ Hatice Ergün kullanıcısı oluşturuldu ve ${companies[0].name} şirketine atandı.`);

  // 5. Kullanıcıları oluştur ve şirketlere/departmanlara ata
  console.log('👥 Kullanıcılar oluşturuluyor...');
  const users = [];
  const cLevelTitles = [
    { title: 'CEO', name: 'İcra Kurulu Başkanı' },
    { title: 'CTO', name: 'Teknoloji Direktörü' },
    { title: 'CFO', name: 'Mali İşler Direktörü' },
  ];

  for (const executive of cLevelTitles) {
    const name = getRandomTurkishName();
    const email = generateTurkishEmail(name);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'ADMIN',
        department: 'Yönetim',
        departmentRole: executive.title,
        createdAt: faker.date.past({ years: 2 }),
      },
    });

    // Yönetim takımına ekle
    const teamId = teamsMap.get('Yönetim');
    if (!teamId) throw new Error('Takım bulunamadı: Yönetim');
    await prisma.usersOnTeams.create({
      data: {
        userId: user.id,
        teamId,
      },
    });

    users.push(user);
  }

  // 6. Her departman için müdür ve çalışanları oluştur
  console.log('👥 Departman çalışanları oluşturuluyor...');
  const allUsers = [...users];

  for (const dept of departments) {
    if (dept.code === 'MANAGEMENT') continue; // Yönetim zaten oluşturuldu
    
    // Departman müdürü
    const managerName = getRandomTurkishName();
    const managerEmail = generateTurkishEmail(managerName);
    
    const manager = await prisma.user.create({
      data: {
        name: managerName,
        email: managerEmail,
        password: hashedPassword,
        role: 'EDITOR',
        department: dept.name,
        departmentRole: `${dept.name} Müdürü`,
        createdAt: faker.date.past({ years: 2 }),
      },
    });

    const teamId = teamsMap.get(dept.name);
    if (!teamId) throw new Error(`Takım bulunamadı: ${dept.name}`);
    await prisma.usersOnTeams.create({
      data: {
        userId: manager.id,
        teamId,
      },
    });

    allUsers.push(manager);

    // 10 normal çalışan
    for (let i = 0; i < 10; i++) {
      const employeeName = getRandomTurkishName();
      const employeeEmail = generateTurkishEmail(employeeName);
      const employeeRole = faker.helpers.arrayElement(['VIEWER', 'EDITOR']);
      
      const employee = await prisma.user.create({
        data: {
          name: employeeName,
          email: employeeEmail,
          password: hashedPassword,
          role: employeeRole,
          department: dept.name,
          departmentRole: faker.helpers.arrayElement([
            'Uzman', 'Kıdemli Uzman', 'Koordinatör', 'Analisti', 'Specialist'
          ]),
          createdAt: faker.date.past({ years: 2 }),
          managerId: manager.id,
        },
      });

      const teamId = teamsMap.get(dept.name);
      if (!teamId) throw new Error(`Takım bulunamadı: ${dept.name}`);
      await prisma.usersOnTeams.create({
        data: {
          userId: employee.id,
          teamId,
        },
      });

      allUsers.push(employee);
    }
  }

  // 7. Her departman için gerçekçi sözleşmeler oluştur
  console.log('📋 Departman sözleşmeleri oluşturuluyor...');
  
  for (const dept of departments) {
    const departmentUsers = allUsers.filter(user => user.department === dept.name);
    if (departmentUsers.length === 0) continue;

    const contractTitles = contractTemplatesByDepartment[dept.code as keyof typeof contractTemplatesByDepartment];
    
    // Her departman için 25 sözleşme oluştur
    const contractCount = 25;
    
    for (let i = 0; i < contractCount; i++) {
      const author = faker.helpers.arrayElement(departmentUsers);
      const title = faker.helpers.arrayElement(contractTitles);
      
      const startDate = faker.date.past({ years: 1 });
      const endDate = faker.date.future({ years: 1, refDate: startDate });
      
      const contractTypes = ['SERVICE_AGREEMENT', 'SALES_CONTRACT', 'CONSULTING_AGREEMENT', 'LICENSE_AGREEMENT', 'EMPLOYMENT_CONTRACT'];
      const statuses = ['DRAFT', 'REVIEW', 'SIGNING', 'ACTIVE', 'ARCHIVED', 'REJECTED'];
      
      // Departmana göre sözleşme değeri aralıkları
      let valueRange = { min: 5000, max: 50000 };
      if (dept.code === 'TECH' || dept.code === 'MANAGEMENT') {
        valueRange = { min: 50000, max: 500000 };
      } else if (dept.code === 'SALES') {
        valueRange = { min: 100000, max: 1000000 };
      }
      
      const value = faker.number.float({ 
        min: valueRange.min, 
        max: valueRange.max, 
        multipleOf: 1000 
      });

      // Gerçekçi sözleşme içeriği oluştur
      const content = generateContractContent(title, dept.name, value);
      
      const contract = await prisma.contract.create({
        data: {
          title,
          description: `${dept.name} departmanı için ${title.toLowerCase()} sözleşmesi`,
          content,
          status: faker.helpers.arrayElement(Object.values(ContractStatusEnum)),
          type: faker.helpers.arrayElement(contractTypes),
          value,
          startDate,
          endDate,
          expirationDate: endDate,
          noticePeriodDays: faker.helpers.arrayElement([30, 60, 90]),
          otherPartyName: generateCompanyName(),
          otherPartyEmail: faker.internet.email(),
          createdById: author.id,
          updatedById: author.id,
          createdAt: faker.date.between({ from: startDate, to: new Date() }),
        },
      });

      // Bazı sözleşmeler için onaylar oluştur
      if (faker.datatype.boolean({ probability: 0.7 })) {
        const approvers = faker.helpers.arrayElements(
          allUsers.filter(u => u.role === 'ADMIN' || u.role === 'EDITOR'), 
          { min: 1, max: 3 }
        );
        
        for (const approver of approvers) {
          await prisma.contractApproval.create({
            data: {
              contractId: contract.id,
              approverId: approver.id,
              status: faker.helpers.arrayElement(['PENDING', 'APPROVED', 'REJECTED']),
              comment: faker.helpers.maybe(() => faker.lorem.sentence(), { probability: 0.5 }) || undefined,
              approvedAt: faker.helpers.maybe(() => faker.date.recent(), { probability: 0.6 }) || undefined,
            },
          });
        }
      }
    }
  }

     // 6. Bazı temel clause'lar oluştur
   console.log('📜 Temel clause\'lar oluşturuluyor...');
  const sampleClauses = [
    {
      title: 'Gizlilik ve Veri Koruma Maddesi',
      description: 'KVKK uyumlu gizlilik koşulları',
      content: 'Taraflar, bu sözleşme kapsamında elde ettikleri kişisel verileri 6698 sayılı Kişisel Verilerin Korunması Kanunu hükümlerine uygun olarak işleyecek ve gizli tutacaklardır.',
      category: 'PRIVACY',
    },
    {
      title: 'Ödeme ve Faturalandırma Koşulları',
      description: 'Standart ödeme maddeleri',
      content: 'Ödeme, hizmet tesliminden sonra 30 gün içinde yapılacaktır. Geç ödeme durumunda TCMB iskonto oranı + %5 gecikme faizi uygulanır.',
      category: 'PAYMENT',
    },
    {
      title: 'Sözleşme Feshi ve İhtar Koşulları',
      description: 'Sözleşme feshi prosedürleri',
      content: 'Taraflardan herhangi biri, diğer tarafı 30 gün önceden yazılı olarak uyararak sözleşmeyi feshedebilir. Haklı nedenle derhal fesih hakkı saklıdır.',
      category: 'TERMINATION',
    },
    {
      title: 'Mücbir Sebep Maddesi',
      description: 'Force majeure koşulları',
      content: 'Doğal afetler, savaş, terör, pandemi gibi mücbir sebeplerden kaynaklanan gecikme ve ifa edilememe durumlarında taraflar sorumlu tutulamaz.',
      category: 'FORCE_MAJEURE',
    },
  ];

  const createdClauses = [];
  for (const clauseData of sampleClauses) {
    const randomUser = faker.helpers.arrayElement(allUsers);
    const clause = await prisma.clause.create({
      data: {
        ...clauseData,
        visibility: 'PUBLIC',
        approvalStatus: 'APPROVED',
        isActive: true,
        createdById: randomUser.id,
      },
    });
    createdClauses.push(clause);
  }

  console.log('✅ Seed işlemi tamamlandı!');
  console.log(`👥 Toplam ${allUsers.length} kullanıcı oluşturuldu`);
  console.log(`🏢 ${departments.length} departman oluşturuldu`);
  console.log(`📋 Toplam sözleşme sayısı hesaplanıyor...`);
  
  const contractCount = await prisma.contract.count();
  console.log(`📋 ${contractCount} sözleşme oluşturuldu`);
  console.log(`📜 ${createdClauses.length} clause oluşturuldu`);
}

function generateContractContent(title: string, department: string, value: number): string {
  const formattedValue = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(value);

  return `
# ${title}

Bu sözleşme, Contravo Teknoloji A.Ş. (${department} Departmanı) ile hizmet sağlayıcı arasında düzenlenmiştir.

## 1. SÖZLEŞME KAPSAMI
${generateScopeContent(title, department)}

## 2. HİZMET BEDELİ VE ÖDEME KOŞULLARI
- Toplam hizmet bedeli: ${formattedValue}
- Ödeme planı: ${faker.helpers.arrayElement(['Aylık', 'Üç aylık', 'Altı aylık', 'Yıllık'])}
- Fatura tarihi: Her ayın ${faker.number.int({ min: 1, max: 28 })}. günü
- Ödeme vadesi: Fatura tarihinden itibaren ${faker.helpers.arrayElement([15, 30, 45])} gün

## 3. TARAFLARIN YÜKÜMLÜLÜKLERİ

### 3.1 Contravo Teknoloji A.Ş. Yükümlülükleri:
- Sözleşme konusu hizmetin kaliteli ve zamanında alınmasını sağlamak
- Ödeme yükümlülüklerini zamanında yerine getirmek
- Gerekli bilgi ve belgeleri temin etmek

### 3.2 Hizmet Sağlayıcı Yükümlülükleri:
- Hizmeti sözleşme şartlarına uygun olarak vermek
- Kalite standartlarını korumak
- Gizlilik yükümlülüklerine uymak

## 4. SÜRESİ VE FESİH
- Sözleşme süresi: ${faker.number.int({ min: 6, max: 36 })} ay
- Fesih ihbar süresi: ${faker.number.int({ min: 30, max: 90 })} gün
- Haklı nedenle derhal fesih hakkı saklıdır

## 5. GİZLİLİK VE VERİ KORUMA
Bu sözleşme kapsamında paylaşılan tüm bilgiler gizli olup, 6698 sayılı KVKK hükümlerine tabidir.

## 6. İHTİLAF ÇÖZÜMÜ
Bu sözleşmeden doğan ihtilaflar öncelikle dostane yollarla çözülmeye çalışılacaktır. 
Çözüm sağlanamadığı takdirde İstanbul Mahkemeleri ve İcra Müdürlükleri yetkili olacaktır.

**Düzenleme Tarihi:** ${faker.date.recent().toLocaleDateString('tr-TR')}
**Sözleşme No:** CNT-${faker.number.int({ min: 1000, max: 9999 })}
`;
}

function generateScopeContent(title: string, department: string): string {
  if (title.includes('Yazılım') || title.includes('IT') || title.includes('Teknoloji')) {
    return 'Yazılım geliştirme, sistem entegrasyonu, teknik destek ve bakım hizmetlerini kapsar. Proje yönetimi, dokümantasyon ve eğitim hizmetleri dahildir.';
  }
  
  if (title.includes('Pazarlama') || title.includes('Reklam')) {
    return 'Dijital pazarlama stratejileri, sosyal medya yönetimi, içerik üretimi ve reklam kampanyalarının yürütülmesi. Marka bilinirliği artırma çalışmaları dahildir.';
  }
  
  if (title.includes('Hukuki') || title.includes('Hukuk')) {
    return 'Hukuki danışmanlık, sözleşme hazırlama ve inceleme, dava takibi ve hukuki uyumluluk çalışmaları. Mevzuat takibi ve risk analizi dahildir.';
  }
  
  if (title.includes('Finans') || title.includes('Mali')) {
    return 'Mali danışmanlık, finansal planlama, risk yönetimi ve yatırım stratejileri. Muhasebe ve vergi danışmanlığı hizmetleri dahildir.';
  }
  
  if (title.includes('İnsan Kaynakları') || title.includes('İK')) {
    return 'İnsan kaynakları danışmanlığı, personel seçimi, eğitim programları ve performans yönetimi. Özlük işleri ve bordro hizmetleri dahildir.';
  }
  
  return 'Sözleşme kapsamında belirlenen hizmetlerin profesyonel standartlarda sunulması, kalite kontrolü ve müşteri memnuniyetinin sağlanması.';
}

function generateCompanyName(): string {
  const prefixes = ['Küresel', 'Türk', 'Anadolu', 'İstanbul', 'Ankara', 'Modern', 'Dijital', 'Teknoloji'];
  const types = ['Danışmanlık', 'Teknoloji', 'Yazılım', 'Pazarlama', 'Finans', 'Hukuk', 'Sistem', 'Çözüm'];
  const suffixes = ['A.Ş.', 'Ltd. Şti.', 'Hizmetleri', 'Grup', 'Holding'];
  
  return `${faker.helpers.arrayElement(prefixes)} ${faker.helpers.arrayElement(types)} ${faker.helpers.arrayElement(suffixes)}`;
}

main()
  .catch((e) => {
    console.error('❌ Seed hatası:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 