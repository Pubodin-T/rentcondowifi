const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function setSSIDWifiChaoDai() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('📡 Updating SSID to "Wifiเช่าได้"...');

  await ssh.execCommand("uci set wireless.radio0.disabled='1'");
  await ssh.execCommand("uci set wireless.default_radio0.disabled='1'");

  await ssh.execCommand("uci set wireless.radio1.channel='36'");
  await ssh.execCommand("uci set wireless.radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.ssid='Wifiเช่าได้'");

  await ssh.execCommand("uci set wireless.radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.ssid='Wifiเช่าได้'");

  await ssh.execCommand('uci commit wireless');
  console.log('🔄 Restarting WiFi services...');
  await ssh.execCommand('wifi down && sleep 2 && wifi up');

  console.log('--- Checking WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
  console.log('✅ SUCCESS! SSID updated to Wifiเช่าได้!');
}

setSSIDWifiChaoDai().catch(err => {
  console.error('Error setting SSID:', err.message);
  ssh.dispose?.();
});
