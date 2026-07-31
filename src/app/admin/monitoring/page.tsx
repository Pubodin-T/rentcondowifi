'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Download,
  Upload,
  Globe,
  Wifi,
  RefreshCw,
  Search,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Database,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

interface LiveClient {
  mac: string;
  clientIp: string;
  state: string;
  sessionStart: string | null;
  downloadKb: number;
  uploadKb: number;
  token: string;
}

interface MonthlyStatEntry {
  mac: string;
  _sum: { downloadMb: number | null; uploadMb: number | null };
}

interface DomainEntry {
  domain: string;
  count: number;
}

interface UserDomainEntry {
  mac: string | null;
  domain: string;
  count: number;
}

function formatBytes(mb: number) {
  if (mb < 1) return `${(mb * 1024).toFixed(1)} KB`;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  return `${(mb / 1024).toFixed(2)} GB`;
}

function formatKB(kb: number) {
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${(kb / 1024 / 1024).toFixed(2)} GB`;
}

function LiveClientRow({
  client,
  userMap,
}: {
  client: LiveClient;
  userMap: Record<string, { username: string; phone?: string | null }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totalMb = (client.downloadKb + client.uploadKb) / 1024;
  const barWidth = Math.min(100, (totalMb / 500) * 100);
  const userInfo = userMap[client.mac.toLowerCase()];

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden transition-all">
      {/* Compact Main Row (1 บรรทัด) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-700/40 transition select-none"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              client.state === 'Authenticated' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-white font-mono text-sm font-semibold">{client.mac}</span>
            <span className="text-slate-400 text-xs font-mono">({client.clientIp})</span>
            {userInfo && (
              <span className="text-xs font-sans text-sky-400 font-medium bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                👤 {userInfo.username}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-sky-400 font-semibold">
              ⬇ {formatKB(client.downloadKb)} <span className="text-slate-600 font-normal">|</span> ⬆ {formatKB(client.uploadKb)}
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
              client.state === 'Authenticated'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {client.state === 'Authenticated' ? 'ออนไลน์' : 'รอยืนยัน'}
          </span>

          <button className="text-slate-400 hover:text-white p-1 rounded-lg transition">
            {isOpen ? <ChevronUp className="w-4 h-4 text-sky-400" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Dropdown Details */}
      {isOpen && (
        <div className="px-4 pb-4 pt-3 border-t border-slate-700/40 bg-slate-900/50 space-y-3 animate-fade-in text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <Download className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">ดาวน์โหลด session นี้</div>
                <div className="text-sm text-sky-400 font-bold">{formatKB(client.downloadKb)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
              <Upload className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">อัปโหลด session นี้</div>
                <div className="text-sm text-violet-400 font-bold">{formatKB(client.uploadKb)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-slate-400">
              <span>ใช้งานรวม session นี้:</span>
              <span className="text-white font-bold">{formatKB(client.downloadKb + client.uploadKb)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {client.sessionStart && (
            <div className="flex items-center space-x-1.5 text-slate-400 pt-1 border-t border-slate-800/60">
              <Clock className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span>เริ่มเข้าใช้งานเมื่อ: {new Date(client.sessionStart).toLocaleString('th-TH')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DomainBadge({ domain }: { domain: string }) {
  const iconMap: Record<string, string> = {
    'youtube.com': '▶️',
    'tiktok.com': '🎵',
    'facebook.com': '📘',
    'instagram.com': '📷',
    'twitter.com': '🐦',
    'netflix.com': '🎬',
    'google.com': '🔍',
    'line.me': '💬',
    'spotify.com': '🎧',
    'twitch.tv': '🎮',
  };
  const subdomain = domain.split('.').slice(-2).join('.');
  const emoji = iconMap[subdomain] ?? '🌐';
  return (
    <span className="inline-flex items-center space-x-1 bg-slate-700/60 px-2 py-0.5 rounded-lg text-xs text-slate-300">
      <span>{emoji}</span>
      <span className="font-mono">{domain}</span>
    </span>
  );
}

export default function MonitoringPage() {
  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatEntry[]>([]);
  const [topDomains, setTopDomains] = useState<DomainEntry[]>([]);
  const [userDomains, setUserDomains] = useState<UserDomainEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { username: string; phone?: string | null }>>({});
  const [totalDnsLogs, setTotalDnsLogs] = useState(0);
  const [totalBwLogs, setTotalBwLogs] = useState(0);
  const [routerConnected, setRouterConnected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [dnsLoading, setDnsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [domainSearch, setDomainSearch] = useState('');
  const [expandedMac, setExpandedMac] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/monitoring?action=stats');
      const data = await res.json();
      if (data.success) {
        setLiveClients(data.liveClients ?? []);
        setMonthlyStats(data.monthlyStats ?? []);
        setTopDomains(data.topDomains ?? []);
        setUserDomains(data.userDomains ?? []);
        setUserMap(data.userMap ?? {});
        setTotalDnsLogs(data.totalDnsLogs ?? 0);
        setTotalBwLogs(data.totalBandwidthLogs ?? 0);
        setRouterConnected(!!data.routerConnected);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const takeSnapshot = async () => {
    setSnapshotLoading(true);
    try {
      await fetch('/api/admin/monitoring?action=snapshot');
      await fetchStats();
    } finally {
      setSnapshotLoading(false);
    }
  };

  const syncDnsLog = async () => {
    setDnsLoading(true);
    try {
      await fetch('/api/admin/monitoring?action=dns');
      await fetchStats();
    } finally {
      setDnsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30s
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const filteredDomains = domainSearch
    ? topDomains.filter((d) => d.domain.includes(domainSearch))
    : topDomains;

  const uniqueMacs = Array.from(new Set(userDomains.map((d) => d.mac).filter((m): m is string => Boolean(m))));

  return (
    <div className="min-h-screen bg-[#0a0f1e] px-4 py-6 md:px-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="text-slate-400 hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Activity className="w-6 h-6 text-sky-400" />
              <span>Network Monitoring</span>
            </h1>
            <p className="text-slate-400 text-sm">
              {lastUpdated ? `อัปเดตล่าสุด ${lastUpdated.toLocaleTimeString('th-TH')}` : 'กำลังโหลด...'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className={`px-3 py-1 rounded-full text-xs flex items-center space-x-1.5 border ${
            routerConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${routerConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <span>{routerConnected ? 'Router SSH: เชื่อมต่อแล้ว' : 'Router SSH: ออฟไลน์'}</span>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <Wifi className="w-5 h-5 text-emerald-400 mb-2" />
          <div className="text-2xl font-bold text-white">{liveClients.filter((c) => c.state === 'Authenticated').length}</div>
          <div className="text-slate-400 text-xs">ออนไลน์ตอนนี้</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <TrendingUp className="w-5 h-5 text-sky-400 mb-2" />
          <div className="text-2xl font-bold text-white">
            {formatBytes(monthlyStats.reduce((s, m) => s + (m._sum.downloadMb ?? 0), 0))}
          </div>
          <div className="text-slate-400 text-xs">ดาวน์โหลดเดือนนี้</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <Globe className="w-5 h-5 text-violet-400 mb-2" />
          <div className="text-2xl font-bold text-white">{totalDnsLogs.toLocaleString()}</div>
          <div className="text-slate-400 text-xs">DNS queries รวม</div>
        </div>
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <Database className="w-5 h-5 text-amber-400 mb-2" />
          <div className="text-2xl font-bold text-white">{totalBwLogs.toLocaleString()}</div>
          <div className="text-slate-400 text-xs">Bandwidth snapshots</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Live Clients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span>อุปกรณ์ที่เชื่อมต่ออยู่</span>
            </h2>
            <button
              onClick={takeSnapshot}
              disabled={snapshotLoading}
              className="text-xs px-3 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg transition flex items-center space-x-1"
            >
              <Download className={`w-3 h-3 ${snapshotLoading ? 'animate-spin' : ''}`} />
              <span>บันทึก Snapshot</span>
            </button>
          </div>

          {liveClients.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-8 text-center text-slate-500">
              ไม่มีอุปกรณ์เชื่อมต่ออยู่
            </div>
          ) : (
            <div className="space-y-2.5">
              {liveClients.map((c) => (
                <LiveClientRow key={c.mac} client={c} userMap={userMap} />
              ))}
            </div>
          )}
        </div>

        {/* Monthly Bandwidth per MAC */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-sky-400" />
            <span>Bandwidth เดือนนี้ (ต่ออุปกรณ์ / ผู้ใช้งาน)</span>
          </h2>

          {monthlyStats.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-8 text-center">
              <p className="text-slate-500 text-sm mb-3">ยังไม่มีข้อมูล — กด "บันทึก Snapshot" เพื่อเริ่มเก็บข้อมูล</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyStats
                .sort((a, b) => (b._sum.downloadMb ?? 0) - (a._sum.downloadMb ?? 0))
                .map((entry) => {
                  const dl = entry._sum.downloadMb ?? 0;
                  const ul = entry._sum.uploadMb ?? 0;
                  const total = dl + ul;
                  const max = monthlyStats.reduce((m, e) => Math.max(m, (e._sum.downloadMb ?? 0) + (e._sum.uploadMb ?? 0)), 1);
                  const pct = Math.min(100, (total / max) * 100);
                  const userInfo = userMap[entry.mac.toLowerCase()];

                  return (
                    <div key={entry.mac} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs text-slate-300">{entry.mac}</span>
                          {userInfo && (
                            <span className="text-xs text-sky-400 font-semibold bg-sky-500/10 px-1.5 py-0.5 rounded">
                              👤 {userInfo.username}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-white font-semibold">{formatBytes(total)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>↓ {formatBytes(dl)}</span>
                        <span>↑ {formatBytes(ul)}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* DNS Log Section */}
      <div className="space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Globe className="w-5 h-5 text-violet-400" />
            <span>Top Domains (24 ชม.ล่าสุด)</span>
          </h2>
          <button
            onClick={syncDnsLog}
            disabled={dnsLoading}
            className="text-xs px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition flex items-center space-x-1"
          >
            <RefreshCw className={`w-3 h-3 ${dnsLoading ? 'animate-spin' : ''}`} />
            <span>Sync DNS Log</span>
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={domainSearch}
            onChange={(e) => setDomainSearch(e.target.value)}
            placeholder="ค้นหา domain..."
            className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {filteredDomains.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/30 rounded-2xl p-6 text-center">
            <p className="text-slate-500 text-sm mb-2">ยังไม่มีข้อมูล DNS log</p>
            <p className="text-slate-600 text-xs">กด "Sync DNS Log" เพื่อดึงข้อมูลจาก Router</p>
          </div>
        ) : (
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">#</th>
                  <th className="text-left text-xs text-slate-500 font-medium px-4 py-3">Domain</th>
                  <th className="text-right text-xs text-slate-500 font-medium px-4 py-3">Queries</th>
                </tr>
              </thead>
              <tbody>
                {filteredDomains.slice(0, 20).map((d, i) => (
                  <tr key={d.domain} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition">
                    <td className="px-4 py-2.5 text-slate-500 text-sm">{i + 1}</td>
                    <td className="px-4 py-2.5">
                      <DomainBadge domain={d.domain} />
                    </td>
                    <td className="px-4 py-2.5 text-right text-sm text-white font-mono">{d.count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Per-User Domain Breakdown */}
      {uniqueMacs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <span>Domain ต่อ Device / ผู้ใช้งาน (24 ชม.ล่าสุด)</span>
          </h2>
          <div className="space-y-3">
            {uniqueMacs.map((mac) => {
              const domains = userDomains.filter((d) => d.mac === mac);
              const isExpanded = expandedMac === mac;
              const shown = isExpanded ? domains : domains.slice(0, 5);
              const userInfo = userMap[mac.toLowerCase()];
              return (
                <div key={mac} className="bg-slate-800/60 border border-slate-700/50 rounded-2xl overflow-hidden">
                  <div
                    className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-700/20"
                    onClick={() => setExpandedMac(isExpanded ? null : mac)}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span className="font-mono text-sm text-white">{mac}</span>
                      {userInfo ? (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                          👤 {userInfo.username}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-500">(ไม่ระบุชื่อผู้ใช้)</span>
                      )}
                      <span className="text-xs text-slate-500">({domains.length} domains)</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                    {shown.map((d) => (
                      <DomainBadge key={d.domain} domain={d.domain} />
                    ))}
                    {!isExpanded && domains.length > 5 && (
                      <span className="text-xs text-slate-500 px-2 py-0.5">+{domains.length - 5} อีก...</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
