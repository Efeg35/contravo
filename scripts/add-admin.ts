import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = '123456';
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: 'efegokce235@gmail.com' },
    update: { password: hashedPassword },
    create: {
      email: 'efegokce235@gmail.com',
      name: 'Efe Gökçe',
      role: 'ADMIN',
      password: hashedPassword,
    },
  });
  console.log('Admin kullanıcı eklendi: efegokce235@gmail.com | Şifre: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 