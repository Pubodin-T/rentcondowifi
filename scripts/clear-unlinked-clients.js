const { PrismaClient } = require('@prisma/client');
const { NodeSSH } = require('node-ssh');
const prisma = new PrismaClient();

async function clearUnlinked() {
  console.log('🔍 Finding clients without a linked user in DB...');

  // Get all MACs mapped to users
  const macSettings = await prisma.systemSetting.findMany({
    where: { key: { startsWith: 'mac_' } },
  });
  const linkedMacs = new Set(macSettings.map((s) => s.key.replace('mac_', '').toLowerCase()));

  console.log('Linked MACs in DB:', Array.from(linkedMacs));

  const ssh = new NodeSSH();
  await ssh.connect({
    host: '192.168.2.1',
    username: 'root',
    password: 'Oat13392',
    readyTimeout: 10000,
  });

  const statusRes = await ssh.execCommand('ndsctl status');
  const output = statusRes.stdout;

  const clientBlocks = output.split(/\nClient \d+/).slice(1);
  const unlinkedClients = [];

  for (const block of clientBlocks) {
    const mac = block.match(/MAC:\s+([0-9a-f:]+)/i)?.[1]?.toLowerCase() ?? '';
    const ip = block.match(/IP:\s+([\d.]+)/)?.[1] ?? '';
    const state = block.match(/State:\s+(\w+)/)?.[1] ?? '';

    if (mac && state === 'Authenticated' && !linkedMacs.has(mac)) {
      unlinkedClients.push({ mac, ip });
    }
  }

  console.log(`Found ${unlinkedClients.length} unlinked authenticated clients:`);
  console.log(unlinkedClients);

  for (const client of unlinkedClients) {
    console.log(`🧹 Deauthenticating unlinked client MAC: ${client.mac} (IP: ${client.ip})...`);
    const deauthRes = await ssh.execCommand(`ndsctl deauth ${client.mac}`);
    console.log(`Response for ${client.mac}:`, deauthRes.stdout || deauthRes.stderr || 'Success');
  }

  ssh.dispose();
  await prisma.$disconnect();
  console.log('🎉 Done clearing unlinked connections!');
}

clearUnlinked().catch(console.error);
