const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function setSeparateSSIDs() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('📡 Setting separate SSIDs: เช่าถูกๆ_5G (WiFi 6 800Mbps) and เช่าถูกๆ_2.4G...');

  await ssh.execCommand("uci set wireless.radio0.disabled='1'");
  await ssh.execCommand("uci set wireless.default_radio0.disabled='1'");

  await ssh.execCommand("uci set wireless.radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.ssid='เช่าถูกๆ_5G'");

  await ssh.execCommand("uci set wireless.radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.ssid='เช่าถูกๆ_2.4G'");

  await ssh.execCommand('uci commit wireless');
  console.log('🔄 Reloading WiFi services on router...');
  await ssh.execCommand('wifi reload || /sbin/wifi');

  console.log('--- Checking updated WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
  console.log('✅ SUCCESS! Separate SSIDs set successfully!');
}

setSeparateSSIDs().catch(err => {
  console.error('Error setting SSIDs:', err.message);
  ssh.dispose?.();
});
