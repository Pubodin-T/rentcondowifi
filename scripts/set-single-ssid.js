const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function setSingleSSID() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('📡 Setting single Smart Switch SSID: Wifiเช่า (radio1 Channel 36 5G + radio2 2.4G)...');

  // Keep radio0 (slow 433Mbps WiFi 5) DISABLED
  await ssh.execCommand("uci set wireless.radio0.disabled='1'");
  await ssh.execCommand("uci set wireless.default_radio0.disabled='1'");

  // Radio1 (WiFi 6 5G High Speed) -> Channel 36, SSID: Wifiเช่า
  await ssh.execCommand("uci set wireless.radio1.channel='36'");
  await ssh.execCommand("uci set wireless.radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.ssid='Wifiเช่า'");

  // Radio2 (WiFi 6 2.4G) -> Channel 6, SSID: Wifiเช่า
  await ssh.execCommand("uci set wireless.radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.ssid='Wifiเช่า'");

  await ssh.execCommand('uci commit wireless');
  console.log('🔄 Restarting WiFi services...');
  await ssh.execCommand('wifi down && sleep 2 && wifi up');

  console.log('--- Checking WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
  console.log('✅ SUCCESS! Smart Single SSID Wifiเช่า is now active!');
}

setSingleSSID().catch(err => {
  console.error('Error setting single SSID:', err.message);
  ssh.dispose?.();
});
