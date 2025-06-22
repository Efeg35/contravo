import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // --- Geçici olarak silme işlemleri yoruma alındı ---
  // await prisma.contractVersion.deleteMany();
  // await prisma.contractApproval.deleteMany();
  // await prisma.contractAttachment.deleteMany();
  // await prisma.contract.deleteMany();
  // await prisma.user.deleteMany();

  // Test kullanıcısı oluştur
  const testUser = await prisma.user.upsert({
    where: { email: 'test@contravo.com' },
    update: {},
    create: {
      email: 'test@contravo.com',
      name: 'Test User',
      role: 'ADMIN',
    },
  });

  // Yeni admin kullanıcı ekle
  await prisma.user.upsert({
    where: { email: 'efegokce235@gmail.com' },
    update: {},
    create: {
      email: 'efegokce235@gmail.com',
      name: 'Efe Gökçe',
      role: 'ADMIN',
    },
  });

  // Test clause'ları oluştur
  const clause1 = await prisma.clause.create({
    data: {
      title: 'Gizlilik Maddesi',
      description: 'Standart gizlilik koşulları',
      content: 'Taraflar, bu sözleşme kapsamında elde ettikleri bilgileri gizli tutmayı ve üçüncü kişilerle paylaşmamayı taahhüt ederler.',
      category: 'PRIVACY',
      visibility: 'PUBLIC',
      approvalStatus: 'APPROVED',
      createdById: testUser.id,
    },
  });

  const clause2 = await prisma.clause.create({
    data: {
      title: 'Ödeme Koşulları',
      description: 'Standart ödeme maddeleri',
      content: 'Ödeme, hizmet tesliminden sonra 30 gün içinde yapılacaktır. Geç ödeme durumunda aylık %2 gecikme faizi uygulanır.',
      category: 'PAYMENT',
      visibility: 'PUBLIC',
      approvalStatus: 'APPROVED',
      createdById: testUser.id,
    },
  });

  // Test sözleşmesi oluştur
  const testContract = await prisma.contract.create({
    data: {
      title: 'Test Sözleşmesi',
      description: 'Bildirim sistemi testi için oluşturuldu',
      content: 'Test içerik',
      status: 'DRAFT',
      type: 'SERVICE',
      value: 1000,
      startDate: new Date(),
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 gün sonra
      createdById: testUser.id,
      updatedById: testUser.id,
    },
  });

  // Sözleşmeye clause'ları ekle
  await prisma.clausesOnContracts.createMany({
    data: [
      {
        contractId: testContract.id,
        clauseId: clause1.id,
      },
      {
        contractId: testContract.id,
        clauseId: clause2.id,
      },
    ],
  });

  console.log('Test verileri oluşturuldu:', { testUser, testContract, clause1, clause2 });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 