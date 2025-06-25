import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ContractStatusEnum } from '../app/types';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@contravo.com' },
    update: {},
    create: {
      email: 'admin@contravo.com',
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  // Efe Gökçe kullanıcısı
  const efeUser = await prisma.user.upsert({
    where: { email: 'efegokce235@gmail.com' },
    update: {},
    create: {
      email: 'efegokce235@gmail.com',
      name: 'Efe Gökçe',
      role: 'ADMIN',
    },
  });

  // Create test company
  let company = await prisma.company.findFirst({
    where: { name: 'Test Company' },
  });

  if (!company) {
    company = await prisma.company.create({
    data: {
        name: 'Test Company',
        description: 'A test company for development',
      createdById: adminUser.id,
    },
  });
  }

  // === 20 GERÇEKÇİ SÖZLEŞME ÖRNEKLERİ ===
  const realContracts = [
    {
      title: 'Microsoft Office 365 Lisans Sözleşmesi',
      description: 'Şirket geneli Office 365 yazılım lisansı',
      content: `Bu sözleşme, ABC Şirketi ve Microsoft Corporation arasında Office 365 Business Premium lisanslarının tedariki için düzenlenmiştir.

KAPSAM:
- 150 kullanıcı lisansı
- Word, Excel, PowerPoint, Outlook, Teams
- OneDrive ve SharePoint erişimi
- 12 aylık lisans süresi

ÖDEME KOŞULLARI:
- Aylık 15$ per kullanıcı
- Toplam aylık tutar: 2,250$
- Yıllık ödeme %10 indirimli

GEÇERLİLİK SÜRESİ:
- Başlangıç: 1 Ocak 2024
- Bitiş: 31 Aralık 2024
- Otomatik yenileme seçeneği`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 27000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      otherPartyName: 'Microsoft Corporation',
      otherPartyEmail: 'contracts@microsoft.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      title: 'AWS Cloud Hizmetleri Anlaşması',
      description: 'Bulut altyapısı ve hosting hizmetleri',
      content: `Amazon Web Services ile bulut altyapısı hizmetleri sözleşmesi.

HİZMET KAPSAMI:
- EC2 Instance'lar (t3.large x 5)
- RDS PostgreSQL Veritabanı
- S3 Storage (1TB)
- CloudFront CDN
- Load Balancer

ÖDEME MODELİ:
- Pay-as-you-use model
- Aylık minimum: 2,500$
- Maksimum limit: 5,000$

GÜVENLİK:
- SSL/TLS şifreleme
- IAM kullanıcı yönetimi
- Backup ve disaster recovery`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 60000,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2025-02-28'),
      otherPartyName: 'Amazon Web Services',
      otherPartyEmail: 'enterprise@aws.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-02-10'),
      updatedAt: new Date('2024-02-15'),
    },
    {
      title: 'Mobil Uygulama Geliştirme Sözleşmesi',
      description: 'iOS ve Android e-ticaret uygulaması geliştirme',
      content: `TechCorp ile mobil uygulama geliştirme projesi sözleşmesi.

PROJE KAPSAMI:
- Native iOS uygulaması (Swift)
- Native Android uygulaması (Kotlin)
- Admin paneli (React)
- API Backend (Node.js)
- Ödeme entegrasyonu
- Push notification sistemi

TESLİMAT AŞAMALARI:
1. UI/UX Tasarım - 4 hafta
2. Frontend Geliştirme - 8 hafta  
3. Backend Geliştirme - 6 hafta
4. Test ve Debug - 4 hafta
5. App Store yayınlama - 2 hafta

ÖDEME PLANI:
- %30 proje başlangıcı
- %40 prototype teslimi
- %30 final teslim`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 85000,
      startDate: new Date('2024-04-01'),
      endDate: new Date('2024-10-01'),
      otherPartyName: 'TechCorp Solutions',
      otherPartyEmail: 'contracts@techcorp.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-03-05'),
      updatedAt: new Date('2024-03-20'),
    },
    {
      title: 'Ofis Kira Sözleşmesi - Maslak Plaza',
      description: 'İstanbul Maslak\'ta 500m² ofis kiralama',
      content: `Maslak Plaza\'da ofis alanı kiralama sözleşmesi.

KONUM VE ALAN:
- Adres: Maslak Plaza, Kat 15, Daire 1501-1502
- Toplam Alan: 500 m²
- Açık ofis alanı: 350 m²
- Toplantı odaları: 4 adet
- Mutfak ve sosyal alan: 150 m²

KİRA KOŞULLARI:
- Aylık kira: 75,000 TL
- Aidat: 15,000 TL
- Depozito: 3 aylık kira (225,000 TL)
- Kira artış oranı: Yıllık TÜFE + %5

SÜRESİ:
- 3 yıl (36 ay)
- Erken çıkış: 6 ay önce ihbar
- Yenileme opsiyonu`,
      status: ContractStatusEnum.SIGNING,
      type: 'LEASE_AGREEMENT',
      value: 3240000, // 36 ay x 90,000 TL
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
      otherPartyName: 'Maslak Plaza Yönetimi',
      otherPartyEmail: 'yonetim@maslakplaza.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2023-11-15'),
      updatedAt: new Date('2023-12-20'),
    },
    {
      title: 'Grafik Tasarım Hizmetleri Sözleşmesi',
      description: 'Brand identity ve dijital tasarım hizmetleri',
      content: `Creative Studio ile grafik tasarım hizmetleri sözleşmesi.

HİZMET KAPSAMI:
- Logo tasarımı ve brand identity
- Kurumsal kimlik kılavuzu
- Web sitesi UI/UX tasarımı
- Sosyal medya template'leri
- Broşür ve katalog tasarımları
- Ambalaj tasarımları

ÇALIŞMA SÜRECİ:
- İlk konsept sunumu: 1 hafta
- Revizyon süreci: 2 hafta
- Final dosya teslimi: 1 hafta
- Revizyon hakkı: 3 major, unlimited minor

FİKRİ MÜLKİYET:
- Tüm haklar müşteriye devredilir
- Kaynak dosyalar (AI, PSD) dahil
- Portfolio kullanım izni`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 45000,
      startDate: new Date('2024-04-15'),
      endDate: new Date('2024-07-15'),
      otherPartyName: 'Creative Studio İstanbul',
      otherPartyEmail: 'hello@creativestudio.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-04-01'),
      updatedAt: new Date('2024-04-01'),
    },
    {
      title: 'Bilgi Güvenliği Danışmanlığı',
      description: 'ISO 27001 sertifikasyon süreç danışmanlığı',
      content: `CyberSec Consulting ile bilgi güvenliği danışmanlık sözleşmesi.

PROJE KAPSAMI:
- Mevcut durum analizi (Gap Analysis)
- ISO 27001 standart uygunluk çalışması
- Risk değerlendirmesi ve yönetimi
- Politika ve prosedür geliştirme
- Çalışan eğitimleri
- İç denetim süreçleri
- Sertifikasyon süreç yönetimi

ÇALIŞMA PLANI:
- Faz 1: Analiz ve Planlama (4 hafta)
- Faz 2: Sistem Kurulumu (8 hafta)
- Faz 3: Test ve Optimizasyon (4 hafta)
- Faz 4: Sertifikasyon Desteği (4 hafta)

SONUÇ ÇIKTILARI:
- ISO 27001 hazırlık raporu
- BGYS dokümantasyonu
- Eğitim materyalleri`,
      status: ContractStatusEnum.SIGNING,
      type: 'CONSULTING_AGREEMENT',
      value: 120000,
      startDate: new Date('2024-05-01'),
      endDate: new Date('2024-12-31'),
      otherPartyName: 'CyberSec Consulting',
      otherPartyEmail: 'contracts@cybersec.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-04-10'),
      updatedAt: new Date('2024-04-18'),
    },
    {
      title: 'Tedarikçi Çerçeve Anlaşması - Teknoloji',
      description: 'Donanım ve yazılım tedariki çerçeve sözleşmesi',
      content: `TechSupply A.Ş. ile teknoloji ürünleri tedarik sözleşmesi.

ÜRÜN KATEGORİLERİ:
- Bilgisayar ve laptop'lar
- Server ve network ekipmanları
- Yazılım lisansları
- Mobil cihazlar (telefon, tablet)
- Ofis ekipmanları (printer, projektör)

TİCARİ KOŞULLAR:
- Volume discount: %5-15 arası
- Ödeme vadesi: 60 gün
- Garanti süresi: Minimum 2 yıl
- Teknik destek: 7/24

LOJİSTİK:
- Ücretsiz kargo (2,000 TL üzeri)
- Express teslimat seçeneği
- Kurulum hizmeti
- Eski cihaz geri alım`,
      status: ContractStatusEnum.SIGNING,
      type: 'PURCHASE_AGREEMENT',
      value: 2500000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      otherPartyName: 'TechSupply A.Ş.',
      otherPartyEmail: 'satış@techsupply.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2023-12-05'),
      updatedAt: new Date('2023-12-28'),
    },
    {
      title: 'Gizlilik Anlaşması - Ar-Ge Projesi',
      description: 'Yapay zeka projesi için karşılıklı gizlilik anlaşması',
      content: `ABC Şirketi ve XYZ Teknoloji arasında AI projesi NDA'sı.

GİZLİ BİLGİ KAPSAMI:
- Yapay zeka algoritmaları
- Müşteri verileri ve analizler
- İş süreçleri ve methodolojiler
- Finansal projeksiyon ve planlar
- Teknik dökümanlar ve kaynak kodlar

GİZLİLİK SÜRESI:
- Anlaşma süresi: 5 yıl
- Proje bitiminden sonra: 3 yıl ek
- Hassas veriler için: 10 yıl

YÜKÜMLÜLÜKLER:
- Bilgilerin üçüncü kişilerle paylaşılmaması
- Güvenli saklama ve imha prosedürleri
- Çalışan eğitimleri
- Veri ihlali bildirim süreci

İHLAL DURUMU:
- Tazminat miktarı: 500,000 TL
- Hukuki işlem hakları`,
      status: ContractStatusEnum.SIGNING,
      type: 'NDA',
      value: 0,
      startDate: new Date('2024-03-01'),
      endDate: new Date('2029-03-01'),
      otherPartyName: 'XYZ Teknoloji A.Ş.',
      otherPartyEmail: 'legal@xyztech.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-02-20'),
      updatedAt: new Date('2024-02-28'),
    },
    {
      title: 'Pazarlama Ajansı Hizmet Sözleşmesi',
      description: 'Dijital pazarlama ve reklam kampanyası yönetimi',
      content: `Digital Boost Agency ile pazarlama hizmetleri sözleşmesi.

HİZMET KAPSAMI:
- Google Ads yönetimi
- Facebook & Instagram reklamları
- SEO optimizasyon
- Content marketing
- Email marketing kampanyaları
- Sosyal medya yönetimi
- Influencer marketing

HEDEF METRIKLƏR:
- Website trafiği: %150 artış
- Conversion rate: %25 iyileştirme
- ROAS: Minimum 4:1
- Social media engagement: %200 artış

ÇALIŞMA MODELİ:
- Aylık strategi toplantıları
- Haftalık performans raporları
- A/B test süreçleri
- Competitor analysis

REKLAM BÜTÇE:
- Aylık ad spend: 50,000 TL
- Ajans komisyonu: %15`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 540000, // 12 ay x (50k + 7.5k ajans)
      startDate: new Date('2024-05-01'),
      endDate: new Date('2025-04-30'),
      otherPartyName: 'Digital Boost Agency',
      otherPartyEmail: 'contracts@digitalboost.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-04-08'),
      updatedAt: new Date('2024-04-15'),
    },
    {
      title: 'Siber Güvenlik Monitoring Hizmeti',
      description: '7/24 SOC hizmeti ve incident response',
      content: `SecureWatch ile siber güvenlik monitoring sözleşmesi.

HİZMET KAPSAMI:
- 7/24 Security Operations Center (SOC)
- SIEM monitoring ve analysis
- Threat intelligence feed'leri
- Vulnerability assessment
- Incident response team
- Forensic analysis
- Security awareness training

MONİTORİNG KAPSAMI:
- Network traffic analysis
- Endpoint detection & response
- Email security monitoring  
- Web application firewall logs
- Database activity monitoring
- Cloud security posture

SLA KOŞULLARI:
- Alert response time: < 15 dakika
- Critical incident response: < 1 saat
- Monthly security report
- Quarterly security assessment

ESKALASYONs:
- Level 1: Automated response
- Level 2: Security analyst
- Level 3: Senior security engineer
- Level 4: CISO involvement`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 240000, // 12 ay x 20k
      startDate: new Date('2024-04-01'),
      endDate: new Date('2025-03-31'),
      otherPartyName: 'SecureWatch Cyber',
      otherPartyEmail: 'enterprise@securewatch.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-03-10'),
      updatedAt: new Date('2024-03-25'),
    },
    {
      title: 'Temizlik Hizmetleri Sözleşmesi',
      description: 'Ofis temizlik ve bakım hizmetleri',
      content: `CleanPro Services ile ofis temizlik hizmetleri sözleşmesi.

HİZMET KAPSAMI:
- Günlük genel temizlik
- Haftalık derin temizlik
- Cam temizliği (aylık)
- Halı temizliği (3 aylık)
- Dezenfeksiyon hizmetleri
- Çöp toplama ve bertaraf
- Hijyen malzemesi temini

ÇALIŞMA SAATLERİ:
- Hafta içi: 18:00-22:00
- Cumartesi: 09:00-17:00
- Acil temizlik: 24 saat notice

MALZEME VE EKİPMAN:
- Eco-friendly temizlik ürünleri
- Professional equipment
- Hijyen ve güvenlik malzemeleri
- Temizlik araçları ve makineler

KALİTE KONTROLÜ:
- Supervisor check: Günlük
- Customer feedback: Haftalık
- Quality audit: Aylık
- Service improvement meetings

PERSONEL:
- Trained cleaning staff
- Background check completed
- Uniform and ID cards
- Insurance coverage`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 96000, // 12 ay x 8k
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      otherPartyName: 'CleanPro Services',
      otherPartyEmail: 'admin@cleanpro.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2023-12-10'),
      updatedAt: new Date('2023-12-25'),
    },
    {
      title: 'Veri Merkezi Colocation Hizmeti',
      description: 'Sunucu hosting ve colocation hizmetleri',
      content: `DataCenter Istanbul ile colocation hizmetleri sözleşmesi.

DONANIM KAPSAMI:
- 2U rack space
- Dedicated server hosting
- Network connectivity: 1Gbps
- Power: Redundant A+B feed
- Cooling: N+1 redundancy
- Physical security: 24/7

NETWORK İMKANLARI:
- Multiple ISP connections
- BGP routing
- DDoS protection
- Network monitoring
- Bandwidth burstability
- IPv4 ve IPv6 support

GÜVENLİK ÖZELLİKLERİ:
- Biometric access control
- CCTV surveillance
- Security guards 24/7
- Mantrap entry systems
- Visitor escort policy
- Access logging

SLA GARANTİLERİ:
- Power uptime: %99.982
- Network uptime: %99.9
- Cooling uptime: %99.9
- Physical security: %100
- Response time: < 15 min`,
      status: ContractStatusEnum.ARCHIVED,
      type: 'SERVICE_AGREEMENT',
      value: 144000, // 12 ay x 12k
      startDate: new Date('2023-06-01'),
      endDate: new Date('2024-05-31'),
      otherPartyName: 'DataCenter Istanbul',
      otherPartyEmail: 'sales@dcistanbul.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2023-05-15'),
      updatedAt: new Date('2024-05-31'),
    },
    {
      title: 'Mobil Operatör Kurumsal Hat Sözleşmesi',
      description: 'Şirket çalışanları için mobil hat ve data paketleri',
      content: `TurkTelecom ile kurumsal mobil hizmetleri sözleşmesi.

HAT DETAYLARI:
- 75 adet mobil hat
- Unlimited yerli konuşma
- 50GB aylık internet
- Unlimited SMS
- Roaming paketleri dahil
- Mobile hotspot özelliği

İŞ ÇÖZÜMLERI:
- Mobile device management (MDM)
- Corporate email setup
- VPN access
- Security policies
- Remote wipe capability
- Usage monitoring

CİHAZ TEDAİK:
- iPhone 15 Pro: 25 adet
- Samsung Galaxy S24: 25 adet  
- Business smartphones: 25 adet
- Device insurance included
- Replacement service

FİYATLANDIRMA:
- Hat başı aylık: 450 TL
- Device installment: 36 ay
- Setup fee: Muaf
- Corporate discount: %15`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 405000, // 12 ay x 75 hat x 450 TL
      startDate: new Date('2024-02-01'),
      endDate: new Date('2026-01-31'),
      otherPartyName: 'Türk Telekom A.Ş.',
      otherPartyEmail: 'kurumsal@turktelekom.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-28'),
    },
    {
      title: 'Yazılım Lisans Yenileme - Atlassian',
      description: 'Jira, Confluence ve Bitbucket lisans yenileme',
      content: `Atlassian ile yazılım lisansları yenileme sözleşmesi.

ÜRÜN LİSANSLARI:
- Jira Software Cloud: 100 user
- Confluence Cloud: 100 user  
- Bitbucket Cloud: 50 user
- Jira Service Management: 25 agent
- Advanced Roadmaps dahil
- Unlimited storage

ENTERPRISE ÖZELLİKLER:
- Advanced user management
- Audit log and compliance
- Data residency options
- SLA guarantees
- Premium support
- Migration assistance

ENTEGRASYON:
- Single Sign-On (SSO)
- LDAP/Active Directory
- Slack integration
- Microsoft Teams integration
- Third-party app marketplace

DESTEK:
- Priority support queue
- Technical account manager
- Training and best practices
- Health check sessions`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 168000, // Yıllık lisans ücreti
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      otherPartyName: 'Atlassian Corporation',
      otherPartyEmail: 'enterprise@atlassian.com',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-04-25'),
      updatedAt: new Date('2024-04-25'),
    },
    {
      title: 'İK Danışmanlığı ve Bordro Hizmetleri',
      description: 'İnsan kaynakları yönetimi ve bordro outsourcing',
      content: `HR Solutions ile İK danışmanlığı hizmetleri sözleşmesi.

HİZMET KAPSAMI:
- Bordro hesaplama ve ödeme
- SGK işlemleri ve takibi
- İş sözleşmesi hazırlama
- Performance management
- Recruitment ve seçme yerleştirme
- Employee handbook geliştirme
- Compliance ve yasal takip

BORDRO HİZMETLERİ:
- Aylık bordro hesaplama
- Vergi ve SGK kesintileri
- Yıllık gelir vergisi beyannamesi
- Personel giriş/çıkış işlemleri
- İzin ve mesai takibi
- Avans ve harcırah işlemleri

İK DANIŞMANLIĞI:
- HR policy development
- Job description yazımı
- Salary benchmarking
- Employee training programs
- Disciplinary procedures
- Exit interview process

TEKNOLOJİ PLATFORMU:
- Cloud-based HR system
- Self-service employee portal
- Mobile app access
- Reporting ve analytics`,
      status: ContractStatusEnum.SIGNING,
      type: 'SERVICE_AGREEMENT',
      value: 216000, // 12 ay x 18k
      startDate: new Date('2024-06-01'),
      endDate: new Date('2025-05-31'),
      otherPartyName: 'HR Solutions Türkiye',
      otherPartyEmail: 'contracts@hrsolutions.com.tr',
      createdById: efeUser.id,
      updatedById: efeUser.id,
      companyId: company.id,
      createdAt: new Date('2024-04-15'),
      updatedAt: new Date('2024-04-22'),
    }
  ];

  // Gerçekçi sözleşmeleri veritabanına ekle
  console.log('Adding 15 realistic contracts...');
  for (const contractData of realContracts) {
    await prisma.contract.create({
      data: contractData,
    });
  }

  console.log('Database seeded successfully!');
  console.log('Added:', {
    users: 2,
    company: 1,
    contracts: realContracts.length
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 