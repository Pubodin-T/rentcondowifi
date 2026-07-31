import { NextResponse } from 'next/server';
import { NodeSSH } from 'node-ssh';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ROUTER_HOST = process.env.ROUTER_HOST || '192.168.2.1';
const ROUTER_USER = process.env.ROUTER_USER || 'root';
const ROUTER_PASS = process.env.ROUTER_PASS || 'Oat13392';

// Parse ndsctl status output into per-client stats
function parseNdsctlStatus(output: string) {
  const clients: {
    ip: string;
    mac: string;
    state: string;
    sessionStart: string | null;
    downloadKb: number;
    uploadKb: number;
    token: string;
  }[] = [];

  const clientBlocks = output.split(/\nClient \d+/).slice(1);
  for (const block of clientBlocks) {
    const ip = block.match(/IP:\s+([\d.]+)/)?.[1] ?? '';
    const mac = block.match(/MAC:\s+([0-9a-f:]+)/i)?.[1] ?? '';
    const state = block.match(/State:\s+(\w+)/)?.[1] ?? '';
    const sessionStart = block.match(/Session Start:\s+([^\n]+)/)?.[1]?.trim() ?? null;
    const token = block.match(/Token:\s+(\w+)/)?.[1] ?? '';
    const downloadKb = parseFloat(block.match(/Download this session:\s+([\d.]+)\s+kB/)?.[1] ?? '0');
    const uploadKb = parseFloat(block.match(/Upload this session:\s+([\d.]+)\s+kB/)?.[1] ?? '0');

    if (mac) {
      clients.push({ ip, mac, state, sessionStart, downloadKb, uploadKb, token });
    }
  }
  return clients;
}

// Parse ARP table to get MAC → IP mapping
function parseArpTable(output: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const line of output.split('\n')) {
    const m = line.match(/([\d.]+)\s+0x\w+\s+0x\w+\s+([0-9a-f:]+)/i);
    if (m) map[m[1]] = m[2].toLowerCase(); // ip -> mac
  }
  return map;
}

// Parse dnsmasq log: format "query[A] domain.com from 192.168.x.x"
function parseDnsLog(output: string, arpMap: Record<string, string>): {
  clientIp: string;
  mac: string | null;
  domain: string;
  queriedAt: Date;
}[] {
  const entries: { clientIp: string; mac: string | null; domain: string; queriedAt: Date }[] = [];
  const lineRegex = /(\w+\s+\d+\s+[\d:]+).*?query\[[A-Z0-9]+\]\s+([\w.\-]+)\s+from\s+([\d.]+)/g;
  let match;
  const now = new Date();

  while ((match = lineRegex.exec(output)) !== null) {
    const [, dateStr, domain, clientIp] = match;
    if (clientIp === ROUTER_HOST || domain.endsWith('.local') || domain.endsWith('.lan')) continue;
    const mac = arpMap[clientIp] ?? null;

    let queriedAt: Date;
    try {
      queriedAt = new Date(`${dateStr} ${now.getFullYear()}`);
      if (isNaN(queriedAt.getTime())) queriedAt = now;
    } catch {
      queriedAt = now;
    }

    entries.push({ clientIp, mac, domain, queriedAt });
  }
  return entries;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'stats'; // 'stats' | 'dns' | 'snapshot'

  const ssh = new NodeSSH();
  let liveClients: any[] = [];
  let arpMap: Record<string, string> = {};
  let routerConnected = false;
  let sshErrorMsg = '';

  try {
    await ssh.connect({
      host: ROUTER_HOST,
      username: ROUTER_USER,
      password: ROUTER_PASS,
      readyTimeout: 5000,
    });
    routerConnected = true;

    if (action === 'snapshot') {
      const ndsResult = await ssh.execCommand('ndsctl status');
      const clients = parseNdsctlStatus(ndsResult.stdout);

      const savedLogs = [];
      for (const client of clients) {
        if (client.state !== 'Authenticated') continue;

        const macSetting = await prisma.systemSetting.findUnique({
          where: { key: `mac_${client.mac.toLowerCase()}` },
        });
        const userId = macSetting?.value ?? null;

        const log = await prisma.bandwidthLog.create({
          data: {
            mac: client.mac.toLowerCase(),
            userId,
            downloadMb: client.downloadKb / 1024,
            uploadMb: client.uploadKb / 1024,
            sessionStart: client.sessionStart ? new Date(client.sessionStart) : null,
          },
        });
        savedLogs.push(log);
      }

      ssh.dispose();
      return NextResponse.json({ success: true, saved: savedLogs.length, clients });
    }

    if (action === 'dns') {
      const arpResult = await ssh.execCommand('cat /proc/net/arp');
      arpMap = parseArpTable(arpResult.stdout);

      const logResult = await ssh.execCommand('tail -n 2000 /tmp/dnsmasq.log 2>/dev/null || echo ""');
      const entries = parseDnsLog(logResult.stdout, arpMap);

      if (entries.length > 0) {
        await prisma.dnsLog.createMany({
          data: entries.slice(0, 500).map((e) => ({
            clientIp: e.clientIp,
            mac: e.mac,
            domain: e.domain,
            queriedAt: e.queriedAt,
          })),
          skipDuplicates: false,
        });
      }

      ssh.dispose();
      return NextResponse.json({ success: true, parsed: entries.length });
    }

    // Default: fetch live stats from router
    const ndsResult = await ssh.execCommand('ndsctl status');
    const arpResult = await ssh.execCommand('cat /proc/net/arp');
    arpMap = parseArpTable(arpResult.stdout);
    liveClients = parseNdsctlStatus(ndsResult.stdout);
    ssh.dispose();
  } catch (err: any) {
    sshErrorMsg = err.message || 'Unable to connect SSH to Router';
    ssh.dispose?.();

    // Fallback: Check if Router pushed live telemetry to DB via /api/admin/monitoring/push
    try {
      const liveSetting = await prisma.systemSetting.findUnique({
        where: { key: 'live_router_status' },
      });
      if (liveSetting && liveSetting.value) {
        const liveData = JSON.parse(liveSetting.value);
        const lastSyncTime = new Date(liveData.timestamp).getTime();
        const nowTime = new Date().getTime();

        // If telemetry was received within last 10 minutes, consider router online via push!
        if (nowTime - lastSyncTime < 10 * 60 * 1000) {
          routerConnected = true;
        }
        liveClients = liveData.liveClients || [];
        arpMap = liveData.arpMap || {};
      }
    } catch {
      /* ignore parse errors */
    }
  }

  try {
    // Get bandwidth summary per MAC this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await prisma.bandwidthLog.groupBy({
      by: ['mac'],
      where: { recordedAt: { gte: startOfMonth } },
      _sum: { downloadMb: true, uploadMb: true },
    });

    // Get top domains last 24h
    const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const topDomains = await prisma.dnsLog.groupBy({
      by: ['domain'],
      where: { queriedAt: { gte: since24h } },
      _count: { domain: true },
      orderBy: { _count: { domain: 'desc' } },
      take: 100,
    });

    // Get per-user domain usage last 24h
    const userDomains = await prisma.dnsLog.groupBy({
      by: ['mac', 'domain'],
      where: { queriedAt: { gte: since24h }, mac: { not: null } },
      _count: { domain: true },
      orderBy: { _count: { domain: 'desc' } },
      take: 1000,
    });

    const [totalDnsLogs, totalBandwidthLogs] = await Promise.all([
      prisma.dnsLog.count(),
      prisma.bandwidthLog.count(),
    ]);

    // Map MAC addresses to Usernames & Devices
    const [macSettings, deviceSettings] = await Promise.all([
      prisma.systemSetting.findMany({ where: { key: { startsWith: 'mac_' } } }),
      prisma.systemSetting.findMany({ where: { key: { startsWith: 'device_' } } }),
    ]);

    const userIds = macSettings.map((s) => s.value).filter(Boolean);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true, phone: true },
    });
    const userByIdMap = new Map(users.map((u) => [u.id, u]));
    const deviceMap = new Map(deviceSettings.map((s) => [s.key.replace('device_', '').toLowerCase(), s.value]));

    const macToUserMap: Record<string, { username: string; phone?: string | null; deviceName?: string }> = {};
    for (const s of macSettings) {
      const mac = s.key.replace('mac_', '').toLowerCase();
      const u = userByIdMap.get(s.value);
      const dev = deviceMap.get(mac);
      if (u || dev) {
        macToUserMap[mac] = {
          username: u ? u.username : '',
          phone: u ? u.phone : null,
          deviceName: dev || undefined,
        };
      }
    }
    deviceMap.forEach((dev, mac) => {
      if (!macToUserMap[mac]) {
        macToUserMap[mac] = { username: '', deviceName: dev };
      } else {
        macToUserMap[mac].deviceName = dev;
      }
    });

    return NextResponse.json({
      success: true,
      routerConnected,
      sshErrorMsg,
      liveClients: liveClients.map((c) => ({
        ...c,
        mac: c.mac.toLowerCase(),
        clientIp: c.ip,
        arpMac: arpMap[c.ip],
      })),
      monthlyStats,
      topDomains: topDomains.map((d) => ({ domain: d.domain, count: d._count.domain })),
      userDomains: userDomains.map((d) => ({
        mac: d.mac,
        domain: d.domain,
        count: d._count.domain,
      })),
      userMap: macToUserMap,
      totalDnsLogs,
      totalBandwidthLogs,
    });
  } catch (err: any) {
    console.error('Monitoring API DB error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
