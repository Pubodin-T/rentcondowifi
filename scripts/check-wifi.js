const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkWifi() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('--- /etc/config/wireless ---');
  const wirelessConfig = await ssh.execCommand('cat /etc/config/wireless');
  console.log(wirelessConfig.stdout);

  console.log('--- iwinfo / WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo || iw dev || ifconfig');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
}

checkWifi().catch(err => {
  console.error('Error checking WiFi:', err.message);
  ssh.dispose?.();
});
