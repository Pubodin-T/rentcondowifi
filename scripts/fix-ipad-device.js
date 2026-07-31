const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixIpad() {
  const ipadMac = '0a:99:18:0b:92:95';
  console.log(`📱 Updating MAC ${ipadMac} to 📱 Apple iPad...`);

  await prisma.systemSetting.upsert({
    where: { key: `device_${ipadMac}` },
    update: { value: '📱 Apple iPad' },
    create: { key: `device_${ipadMac}`, value: '📱 Apple iPad' },
  });

  await prisma.$disconnect();
  console.log('✅ Updated device label for iPad successfully!');
}

fixIpad().catch(console.error);
