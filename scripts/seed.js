const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Admin Account
  const adminPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log('✅ Admin user created:', admin.username);

  // Default Packages
  const packages = [
    {
      name: 'โปร 7 วัน',
      price: 75,
      durationDays: 7,
      description: 'อินเทอร์เน็ตสปีดแรงเต็มสปีด 7 วัน เล่นได้ไม่อั้น',
    },
    {
      name: 'โปร 30 วัน',
      price: 250,
      durationDays: 30,
      description: 'สุดคุ้ม! อินเทอร์เน็ตสปีดแรงเต็มสปีด 30 วัน เล่นได้ไม่อั้น',
    },
  ];

  for (const pkg of packages) {
    const created = await prisma.package.create({
      data: pkg,
    });
    console.log(`✅ Package created: ${created.name} (${created.price}฿)`);
  }

  console.log('🎉 Seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
