const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function checkWifiClients() {
  await ssh.connect({
    host: '192.168.2.1',
    username: 'root',
    password: 'Oat13392',
  });

  console.log('--- Associated clients on phy0 (WiFi 5 - 433Mbps max) ---');
  console.log((await ssh.execCommand('iwinfo phy0-ap0 assoclist')).stdout);

  console.log('--- Associated clients on phy1 (WiFi 6 - High Speed) ---');
  console.log((await ssh.execCommand('iwinfo phy1-ap0 assoclist')).stdout);

  console.log('--- Associated clients on phy2 (2.4GHz) ---');
  console.log((await ssh.execCommand('iwinfo phy2-ap0 assoclist')).stdout);

  ssh.dispose();
}

checkWifiClients().catch(console.error);
