const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function fix5gChannel() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('📡 Setting 5G channel to 36 (Universal 5G) and renaming SSIDs to wifiเช่า_5G & wifiเช่า_2.4G...');

  // Disable radio0 (slow WiFi 5)
  await ssh.execCommand("uci set wireless.radio0.disabled='1'");
  await ssh.execCommand("uci set wireless.default_radio0.disabled='1'");

  // Radio1 (WiFi 6 5G) -> Channel 36, SSID: wifiเช่า_5G
  await ssh.execCommand("uci set wireless.radio1.channel='36'");
  await ssh.execCommand("uci set wireless.radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio1.ssid='wifiเช่า_5G'");

  // Radio2 (2.4G) -> Channel auto/6, SSID: wifiเช่า_2.4G
  await ssh.execCommand("uci set wireless.radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.disabled='0'");
  await ssh.execCommand("uci set wireless.default_radio2.ssid='wifiเช่า_2.4G'");

  await ssh.execCommand('uci commit wireless');
  console.log('🔄 Restarting WiFi services...');
  await ssh.execCommand('wifi down && sleep 2 && wifi up');

  console.log('--- Checking WiFi Status ---');
  const iwinfoRes = await ssh.execCommand('iwinfo');
  console.log(iwinfoRes.stdout);

  ssh.dispose();
  console.log('✅ SUCCESS! 5G Channel 36 applied and SSIDs updated!');
}

fix5gChannel().catch(err => {
  console.error('Error fixing 5G channel:', err.message);
  ssh.dispose?.();
});
