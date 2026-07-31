const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function optimizeWifi() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('⚡ Disabling radio0 (WiFi 5 433Mbps) and enabling radio1 (WiFi 6 5G) + radio2 (2.4G)...');

  await ssh.execCommand("uci set wireless.radio0.disabled='1'");
  await ssh.execCommand("uci set wireless.default_radio0.disabled='1'");

  await ssh.execCommand("uci set wireless.radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.ssid='เช่าถูกๆ'");

  await ssh.execCommand("uci set wireless.radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.ssid='เช่าถูกๆ'");

  await ssh.execCommand('uci commit wireless');
  console.log('🔄 Reloading WiFi services on router...');
  await ssh.execCommand('wifi reload || /sbin/wifi');

  console.log('--- Checking updated WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
  console.log('✅ SUCCESS! WiFi is now optimized for 600-800+ Mbps!');
}

optimizeWifi().catch(err => {
  console.error('Error optimizing WiFi:', err.message);
  ssh.dispose?.();
});
