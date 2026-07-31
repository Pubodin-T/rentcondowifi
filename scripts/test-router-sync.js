const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

async function testSync() {
  console.log('🔌 Connecting to Router via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });

  console.log('--- Testing /etc/opennds/sync-router.sh output ---');
  const res = await ssh.execCommand('/etc/opennds/sync-router.sh');
  console.log('STDOUT:');
  console.log(res.stdout);
  console.log('STDERR:');
  console.log(res.stderr);

  ssh.dispose();
}

testSync().catch(err => {
  console.error('Error running sync test:', err.message);
  ssh.dispose?.();
});
