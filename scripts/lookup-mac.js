const { PrismaClient } = require('@prisma/client');
const { NodeSSH } = require('node-ssh');
const prisma = new PrismaClient();

async function lookup() {
  const targetMac = '3e:2d:16:69:50:f8';
  console.log(`🔎 Looking up details for MAC: ${targetMac}...`);

  // 1. Check SystemSetting for MAC mapping
  const macSetting = await prisma.systemSetting.findUnique({
    where: { key: `mac_${targetMac}` },
  });

  if (macSetting && macSetting.value) {
    const user = await prisma.user.findUnique({
      where: { id: macSetting.value },
      select: { id: true, username: true, phone: true, role: true, expireAt: true },
    });
    console.log('--- Registered User Link ---');
    console.log(user);
  } else {
    console.log('--- Registered User Link ---');
    console.log('No user account linked directly in system_settings.');
  }

  // 2. Check DNS Logs for visited domains
  const dnsLogs = await prisma.dnsLog.groupBy({
    by: ['domain'],
    where: {
      OR: [
        { mac: targetMac },
        { clientIp: '192.168.2.232' }
      ]
    },
    _count: { domain: true },
    orderBy: { _count: { domain: 'desc' } },
    take: 15,
  });

  console.log('--- Top Visited Domains ---');
  console.log(dnsLogs.map(d => `${d.domain} (${d._count.domain} times)`));

  // 3. Check Live status via SSH
  try {
    const ssh = new NodeSSH();
    await ssh.connect({
      host: '192.168.2.1',
      username: 'root',
      password: 'Oat13392',
      readyTimeout: 5000,
    });

    const dhcpRes = await ssh.execCommand('cat /tmp/dhcp.leases 2>/dev/null');
    console.log('--- Router DHCP Lease Info ---');
    for (const line of dhcpRes.stdout.split('\n')) {
      if (line.toLowerCase().includes(targetMac)) {
        console.log(line);
      }
    }
    ssh.dispose();
  } catch (e) {
    console.log('SSH skip:', e.message);
  }

  await prisma.$disconnect();
}

lookup().catch(console.error);
