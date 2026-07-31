import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ROUTER_SECRET = process.env.ROUTER_SECRET || 'Oat13392_router_secret';

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
    if (m) map[m[1]] = m[2].toLowerCase();
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
    if (domain.endsWith('.local') || domain.endsWith('.lan')) continue;
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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { secret, ndsctlStatus, arpTable, dnsLog } = body;

    if (secret !== ROUTER_SECRET) {
      return NextResponse.json({ success: false, message: 'Invalid secret token' }, { status: 401 });
    }

    const arpMap = parseArpTable(arpTable || '');
    const liveClients = parseNdsctlStatus(ndsctlStatus || '');

    // Save current live status snapshot into SystemSetting
    const liveData = {
      timestamp: new Date().toISOString(),
      liveClients: liveClients.map((c) => ({
        ...c,
        mac: c.mac.toLowerCase(),
        clientIp: c.ip,
        arpMac: arpMap[c.ip],
      })),
      arpMap,
    };

    await prisma.systemSetting.upsert({
      where: { key: 'live_router_status' },
      update: { value: JSON.stringify(liveData) },
      create: { key: 'live_router_status', value: JSON.stringify(liveData) },
    });

    // Automatically save Bandwidth Logs to DB for authenticated clients
    for (const client of liveClients) {
      if (client.state !== 'Authenticated') continue;

      const macSetting = await prisma.systemSetting.findUnique({
        where: { key: `mac_${client.mac.toLowerCase()}` },
      });
      const userId = macSetting?.value ?? null;

      await prisma.bandwidthLog.create({
        data: {
          mac: client.mac.toLowerCase(),
          userId,
          downloadMb: client.downloadKb / 1024,
          uploadMb: client.uploadKb / 1024,
          sessionStart: client.sessionStart ? new Date(client.sessionStart) : null,
        },
      });
    }

    // Automatically save DNS logs if provided
    if (dnsLog) {
      const dnsEntries = parseDnsLog(dnsLog, arpMap);
      if (dnsEntries.length > 0) {
        await prisma.dnsLog.createMany({
          data: dnsEntries.slice(0, 300).map((e) => ({
            clientIp: e.clientIp,
            mac: e.mac,
            domain: e.domain,
            queriedAt: e.queriedAt,
          })),
          skipDuplicates: false,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Router telemetry pushed successfully',
      liveClientsCount: liveClients.length,
    });
  } catch (error: any) {
    console.error('Push Router Sync Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
