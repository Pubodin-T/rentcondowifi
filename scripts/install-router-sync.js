const { NodeSSH } = require('node-ssh');
const fs = require('fs');
const path = require('path');

const ssh = new NodeSSH();

async function run() {
  console.log('🔌 Connecting to OpenWrt Router (192.168.2.1) via SSH...');
  await ssh.connect({
    host: process.env.ROUTER_HOST || '192.168.2.1',
    username: process.env.ROUTER_USER || 'root',
    password: process.env.ROUTER_PASS || 'Oat13392',
    readyTimeout: 10000,
  });
  console.log('✅ SSH Connected to Router successfully!');

  const scriptContent = fs.readFileSync(
    path.join(__dirname, '../openwrt/sync-router.sh'),
    'utf8'
  );

  console.log('📁 Creating /etc/opennds/sync-router.sh on Router...');
  await ssh.execCommand('mkdir -p /etc/opennds');
  
  // Upload script content
  await ssh.execCommand(`cat << 'EOF' > /etc/opennds/sync-router.sh\n${scriptContent}\nEOF`);
  await ssh.execCommand('chmod +x /etc/opennds/sync-router.sh');
  console.log('✅ Telemetry script created and permissions set!');

  console.log('📦 Checking and installing dependencies (curl, jq)...');
  const pkgRes = await ssh.execCommand('opkg update && opkg install curl jq');
  console.log('Package status:', pkgRes.stdout ? 'Installed/Updated' : pkgRes.stderr);

  console.log('⏰ Configuring Cronjob on Router...');
  const cronRes = await ssh.execCommand('crontab -l 2>/dev/null');
  if (!cronRes.stdout.includes('sync-router.sh')) {
    await ssh.execCommand(
      '(crontab -l 2>/dev/null; echo "* * * * * /etc/opennds/sync-router.sh >/dev/null 2>&1") | crontab -'
    );
    await ssh.execCommand('/etc/init.d/cron restart 2>/dev/null || /etc/init.d/cron enable 2>/dev/null');
  }
  console.log('✅ Cronjob active (runs every 1 minute)!');

  console.log('🚀 Triggering test telemetry push to Vercel Cloud right now...');
  const testRes = await ssh.execCommand('/etc/opennds/sync-router.sh');
  console.log('Response from Vercel Cloud:', testRes.stdout || testRes.stderr || 'Success');

  ssh.dispose();
  console.log('🎉 ALL DONE! OpenWrt Router Telemetry Sync is fully configured!');
}

run().catch((err) => {
  console.error('❌ Error installing on router:', err.message);
  ssh.dispose?.();
});
