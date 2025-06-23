import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Test kullanıcıları oluşturuluyor...');

  // 123456 şifresini hash'leyelim
  const hashedPassword = await bcrypt.hash('123456', 10);

  // Test kullanıcıları
  const testUsers = [
    {
      email: 'admin@contravo.com',
      name: 'Admin Kullanıcı',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Genel Müdürlük',
      departmentRole: 'ADMIN'
    },
    {
      email: 'efegokce235@gmail.com', 
      name: 'Efe Gökçe',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'Genel Müdürlük',
      departmentRole: 'ADMIN'
    },
    {
      email: 'manager@contravo.com',
      name: 'Manager Kullanıcı',
      password: hashedPassword,
      role: 'MANAGER',
      department: 'Hukuk',
      departmentRole: 'MANAGER'
    },
    {
      email: 'editor@contravo.com',
      name: 'Editor Kullanıcı', 
      password: hashedPassword,
      role: 'EDITOR',
      department: 'Pazarlama',
      departmentRole: 'EDITOR'
    },
    {
      email: 'viewer@contravo.com',
      name: 'Viewer Kullanıcı',
      password: hashedPassword,
      role: 'VIEWER',
      department: 'İnsan Kaynakları',
      departmentRole: 'VIEWER'
    }
  ];

  console.log('Kullanıcılar oluşturuluyor...');
  
  for (const userData of testUsers) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password // Şifreyi güncelle
      },
      create: userData
    });
    
    console.log(`✅ Kullanıcı oluşturuldu: ${user.email} (${user.role})`);
  }

  // Test şirketi oluştur
  const adminUser = await prisma.user.findFirst({ where: { email: 'admin@contravo.com' } });
  let company = await prisma.company.findFirst({ where: { name: 'Test Şirketi' } });
  
  if (!company && adminUser) {
    company = await prisma.company.create({
      data: {
        name: 'Test Şirketi',
        description: 'Test amaçlı şirket',
        createdById: adminUser.id
      }
    });
  }

  if (company) {
    console.log(`✅ Test şirketi oluşturuldu: ${company.name}`);
  }

  // Test team'leri oluştur
  const teams = [
    { name: 'Hukuk Takımı' },
    { name: 'Pazarlama Takımı' },
    { name: 'Finans Takımı' },
    { name: 'İnsan Kaynakları Takımı' }
  ];

  for (const teamData of teams) {
    let team = await prisma.team.findFirst({ where: { name: teamData.name } });
    if (!team) {
      team = await prisma.team.create({
        data: teamData
      });
    }
    console.log(`✅ Takım oluşturuldu: ${team.name}`);
  }

  console.log('\n🎉 Test kullanıcıları başarıyla oluşturuldu!');
  console.log('\n📋 GİRİŞ BİLGİLERİ:');
  console.log('👤 admin@contravo.com / 123456 (ADMIN)');
  console.log('👤 efegokce235@gmail.com / 123456 (ADMIN)');
  console.log('👤 manager@contravo.com / 123456 (MANAGER)');
  console.log('👤 editor@contravo.com / 123456 (EDITOR)');
  console.log('👤 viewer@contravo.com / 123456 (VIEWER)');
}

main()
  .catch((e) => {
    console.error('❌ Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 