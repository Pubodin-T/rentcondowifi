const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedDevices() {
  console.log('📱 Seeding device detection labels for active MAC addresses...');

  const devices = [
    { mac: '04:d4:c4:75:73:d3', name: '💻 Windows PC (Admin)' },
    { mac: '1e:f5:f7:ae:2c:d7', name: '📱 Apple iPhone' },
    { mac: '3e:86:3b:3d:af:d5', name: '📱 Samsung Galaxy' },
    { mac: '22:13:5a:76:91:37', name: '📱 Xiaomi / Redmi' },
    { mac: '8a:00:30:12:b4:bf', name: '📱 Apple iPad' },
    { mac: '2e:87:6b:4f:61:ba', name: '📱 Apple iPhone' },
    { mac: '0a:99:18:0b:92:95', name: '📱 OPPO' },
  ];

  for (const d of devices) {
    const key = `device_${d.mac.toLowerCase()}`;
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value: d.name },
      create: { key, value: d.name },
    });
    console.log(`Saved ${key} = ${d.name}`);
  }

  await prisma.$disconnect();
  console.log('✅ Devices seeded successfully!');
}

seedDevices().catch(console.error);
