import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Test kullanıcısı oluştur
  const hashedPassword = await bcrypt.hash('efe200510', 12);
  
  const user = await prisma.user.upsert({
    where: { email: 'efegokceee35@gmail.com' },
    update: {},
    create: {
      email: 'efegokceee35@gmail.com',
      name: 'Efe Gökçe',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  console.log('Test kullanıcısı oluşturuldu:', user);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 