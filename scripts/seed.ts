import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

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

  // Create test contracts
  await prisma.contract.createMany({
    data: [
      {
        title: 'Service Agreement',
        description: 'A sample service agreement',
        content: 'This is the content of the service agreement...',
        status: 'DRAFT',
        type: 'SERVICE',
      value: 50000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        createdById: adminUser.id,
        companyId: company.id,
      },
      {
        title: 'License Agreement',
        description: 'A sample license agreement',
        content: 'This is the content of the license agreement...',
        status: 'SIGNED',
        type: 'LICENSE',
        value: 25000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months from now
        createdById: adminUser.id,
        companyId: company.id,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 