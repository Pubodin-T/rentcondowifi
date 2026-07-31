const { PrismaClient } = require('@prisma/client');
const { NodeSSH } = require('node-ssh');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, phone: true, role: true, expireAt: true },
  });
  console.log('=== Registered Users in DB ===');
  console.log(users);

  const settings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'mac_' } },
  });
  console.log('=== MAC Settings Mappings ===');
  console.log(settings);

  try {
    const ssh = new NodeSSH();
    await ssh.connect({
      host: '192.168.2.1',
      username: 'root',
      password: 'Oat13392',
      readyTimeout: 5000,
    });
    const status = await ssh.execCommand('ndsctl status');
    console.log('=== Current ndsctl Status ===');
    console.log(status.stdout);
    ssh.dispose();
  } catch (e) {
    console.log('SSH err:', e.message);
  }

  await prisma.$disconnect();
}

listUsers().catch(console.error);
