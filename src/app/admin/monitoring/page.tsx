'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Activity,
  Download,
  Upload,
  Globe,
  Wifi,
  RefreshCw,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Database,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  Sparkles,
  User,
  ListFilter,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { normalizeDomain, NormalizedDomainInfo } from '@/lib/domainNormalizer';

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

// Sleek Compact Single-Row Component for Live Devices
function LiveClientRow({
  client,
  userMap,
  monthlyStatMb,
}: {
  client: LiveClient;
  userMap: Record<string, { username: string; phone?: string | null; deviceName?: string }>;
  monthlyStatMb?: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const totalMb = (client.downloadKb + client.uploadKb) / 1024;
  const barWidth = Math.min(100, (totalMb / 500) * 100);
  const userInfo = userMap[client.mac.toLowerCase()];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-xl overflow-hidden transition-all shadow-lg hover:border-slate-700">
      {/* Compact Main Row (1 บรรทัด) */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition select-none"
      >
        <div className="flex items-center space-x-3 min-w-0">
          <div
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              client.state === 'Authenticated' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-amber-400'
            }`}
          />
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-white font-mono text-sm font-bold tracking-tight">{client.mac}</span>
            <span className="text-slate-400 text-xs font-mono">({client.clientIp})</span>
            {userInfo?.username && (
              <span className="text-xs font-sans text-sky-300 font-medium bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                👤 {userInfo.username}
              </span>
            )}
            {userInfo?.deviceName && (
              <span className="text-xs font-sans text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {userInfo.deviceName}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 flex-shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-xs text-sky-400 font-semibold font-mono">
              ⬇ {formatKB(client.downloadKb)} <span className="text-slate-600 font-normal">|</span> ⬆ {formatKB(client.uploadKb)}
            </div>
          </div>

          <span
            className={`text-xs px-2.5 py-1 rounded-lg font-medium ${
              client.state === 'Authenticated'
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
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
        <div className="px-4 pb-4 pt-3 border-t border-slate-800 bg-slate-950/60 space-y-3 text-xs animate-fade-in">
          {userInfo?.deviceName && (
            <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl font-medium">
              <Smartphone className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-slate-400">รุ่น/ประเภทอุปกรณ์:</span>
              <span className="font-bold text-emerald-300">{userInfo.deviceName}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center space-x-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <Download className="w-4 h-4 text-sky-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">ดาวน์โหลด session นี้</div>
                <div className="text-sm text-sky-400 font-bold font-mono">{formatKB(client.downloadKb)}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2.5 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
              <Upload className="w-4 h-4 text-violet-400 flex-shrink-0" />
              <div>
                <div className="text-slate-400">อัปโหลด session นี้</div>
                <div className="text-sm text-violet-400 font-bold font-mono">{formatKB(client.uploadKb)}</div>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-slate-400">
              <span>ใช้งานรวม session นี้:</span>
              <span className="text-white font-bold font-mono">{formatKB(client.downloadKb + client.uploadKb)}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-violet-500 rounded-full transition-all"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>

          {typeof monthlyStatMb === 'number' && (
            <div className="flex items-center justify-between text-sky-400 bg-sky-500/10 border border-sky-500/20 p-2.5 rounded-xl font-medium">
              <span className="text-slate-400">📊 ยอดใช้งานสะสมรวมทั้งเดือนนี้:</span>
              <span className="font-bold text-sky-300 font-mono">{formatBytes(monthlyStatMb)}</span>
            </div>
          )}

          {client.sessionStart && (
            <div className="flex items-center space-x-1.5 text-slate-400 pt-1 border-t border-slate-800/80">
              <Clock className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
              <span>เริ่มเข้าใช้งานเมื่อ: {new Date(client.sessionStart).toLocaleString('th-TH')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function NetworkMonitoringPage() {
  const [liveClients, setLiveClients] = useState<LiveClient[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStatEntry[]>([]);
  const [topDomains, setTopDomains] = useState<DomainEntry[]>([]);
  const [userDomains, setUserDomains] = useState<UserDomainEntry[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { username: string; phone?: string | null; deviceName?: string }>>({});
  const [totalBwLogs, setTotalBwLogs] = useState(0);
  const [routerConnected, setRouterConnected] = useState(false);

  const [loading, setLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showRawDomains, setShowRawDomains] = useState(false);

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

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Aggregate Raw Subdomains into Normalized Services
  const normalizedCategoryStats = useMemo(() => {
    const categories: Record<string, { name: string; count: number; icon: string; badgeClass: string; accentColor: string }> = {};

    for (const d of topDomains) {
      const info = normalizeDomain(d.domain);
      if (!categories[info.serviceName]) {
        categories[info.serviceName] = {
          name: info.serviceName,
          count: 0,
          icon: info.icon,
          badgeClass: info.badgeClass,
          accentColor: info.accentColor,
        };
      }
      categories[info.serviceName].count += d.count;
    }

    const list = Object.values(categories).sort((a, b) => b.count - a.count);
    const totalCount = list.reduce((sum, item) => sum + item.count, 1);

    return list.map((item) => ({
      ...item,
      percentage: Math.round((item.count / totalCount) * 100),
    }));
  }, [topDomains]);

  // Group User App Summaries BY USER ACCOUNT -> THEN BY DEVICE
  const userGroupedSummaries = useMemo(() => {
    const userGroups: Record<
      string,
      {
        username: string;
        devices: Array<{
          mac: string;
          deviceName?: string;
          services: Array<{ info: NormalizedDomainInfo; count: number }>;
          rawDomains: Array<{ domain: string; count: number }>;
        }>;
      }
    > = {};

    const macMap: Record<
      string,
      {
        services: Record<string, { info: NormalizedDomainInfo; count: number }>;
        rawDomains: Record<string, number>;
      }
    > = {};

    for (const ud of userDomains) {
      if (!ud.mac) continue;
      const mac = ud.mac.toLowerCase();
      if (!macMap[mac]) macMap[mac] = { services: {}, rawDomains: {} };

      const info = normalizeDomain(ud.domain);
      if (!macMap[mac].services[info.serviceName]) {
        macMap[mac].services[info.serviceName] = { info, count: 0 };
      }
      macMap[mac].services[info.serviceName].count += ud.count;

      macMap[mac].rawDomains[ud.domain] = (macMap[mac].rawDomains[ud.domain] || 0) + ud.count;
    }

    for (const [mac, data] of Object.entries(macMap)) {
      const userInfo = userMap[mac];
      const username = userInfo?.username || '❓ ผู้ใช้งานทั่วไป (Unlinked Device)';
      const deviceName = userInfo?.deviceName;

      if (!userGroups[username]) {
        userGroups[username] = { username, devices: [] };
      }

      const serviceList = Object.values(data.services).sort((a, b) => b.count - a.count);
      const rawDomainList = Object.entries(data.rawDomains)
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count);

      userGroups[username].devices.push({
        mac,
        deviceName,
        services: serviceList,
        rawDomains: rawDomainList,
      });
    }

    return Object.values(userGroups);
  }, [userDomains, userMap]);

  const totalMonthlyMb = monthlyStats.reduce((s, m) => s + (m._sum.downloadMb ?? 0) + (m._sum.uploadMb ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 px-4 py-6 md:px-8 font-sans">
      {/* Top Futuristic Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center space-x-4">
          <Link href="/admin" className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white rounded-xl transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center space-x-2.5 tracking-tight">
              <Activity className="w-6 h-6 text-sky-400 animate-pulse" />
              <span className="bg-gradient-to-r from-white via-sky-200 to-sky-400 bg-clip-text text-transparent">
                Cyber Network Monitoring
              </span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">
              {lastUpdated ? `อัปเดตล่าสุด ${lastUpdated.toLocaleTimeString('th-TH')}` : 'กำลังเชื่อมต่อเซิร์ฟเวอร์...'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center space-x-2 border shadow-lg ${
              routerConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/5'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${routerConnected ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse' : 'bg-amber-400'}`} />
            <span>{routerConnected ? 'Router SSH: เชื่อมต่อแล้ว' : 'Router SSH: ออฟไลน์'}</span>
          </div>

          <button
            onClick={fetchStats}
            disabled={loading}
            className="p-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-xl transition shadow-lg"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Futuristic Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">อุปกรณ์เชื่อมต่อออนไลน์</span>
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Wifi className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-white font-mono tracking-tight">
            {liveClients.filter((c) => c.state === 'Authenticated').length}
          </div>
          <div className="text-xs text-emerald-400/80 font-medium mt-1 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>พร้อมใช้งานความเร็ว WiFi 6</span>
          </div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">ปริมาณการใช้งานเน็ตเดือนนี้</span>
            <div className="p-2 bg-sky-500/10 border border-sky-500/20 rounded-xl">
              <TrendingUp className="w-5 h-5 text-sky-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-sky-400 font-mono tracking-tight">
            {formatBytes(totalMonthlyMb)}
          </div>
          <div className="text-xs text-slate-400 mt-1">รวมดาวน์โหลด & อัปโหลดทุกอุปกรณ์</div>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 text-xs font-medium">บันทึกข้อมูล Bandwidth</span>
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl">
              <Database className="w-5 h-5 text-violet-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-violet-400 font-mono tracking-tight">
            {totalBwLogs.toLocaleString()}
          </div>
          <div className="text-xs text-slate-400 mt-1">Snapshots บันทึกลง Cloud DB</div>
        </div>
      </div>

      {/* Main Grid: Live Clients & Monthly Bandwidth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Live Clients */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center space-x-2">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] animate-pulse" />
                <span>อุปกรณ์ที่กำลังต่อใช้งานอยู่ (Live Session)</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">ปริมาณเน็ตเฉพาะในรอบการเชื่อมต่อปัจจุบันจาก Router</p>
            </div>
            <button
              onClick={takeSnapshot}
              disabled={snapshotLoading}
              className="text-xs px-3 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 rounded-xl transition flex items-center space-x-1.5 font-medium"
            >
              <Download className={`w-3.5 h-3.5 ${snapshotLoading ? 'animate-spin' : ''}`} />
              <span>บันทึก Snapshot</span>
            </button>
          </div>

          {liveClients.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
              ไม่มีอุปกรณ์เชื่อมต่ออยู่ในขณะนี้
            </div>
          ) : (
            <div className="space-y-2.5">
              {liveClients.map((c) => {
                const stat = monthlyStats.find((m) => m.mac.toLowerCase() === c.mac.toLowerCase());
                const monthlyMb = stat ? (stat._sum.downloadMb ?? 0) + (stat._sum.uploadMb ?? 0) : undefined;
                return <LiveClientRow key={c.mac} client={c} userMap={userMap} monthlyStatMb={monthlyMb} />;
              })}
            </div>
          )}
        </div>

        {/* Monthly Bandwidth per Device */}
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-sky-400" />
              <span>ปริมาณเน็ตสะสมประจำเดือนนี้ (Monthly Total)</span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">รวมประวัติการใช้งานทุก Session ในเดือนนี้ (เรียงจากผู้ใช้เน็ตสูงสุด)</p>
          </div>

          {monthlyStats.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
              ยังไม่มีข้อมูล — กด "บันทึก Snapshot" เพื่อเริ่มเก็บข้อมูล
            </div>
          ) : (
            <div className="space-y-2.5">
              {monthlyStats
                .sort((a, b) => ((b._sum.downloadMb ?? 0) + (b._sum.uploadMb ?? 0)) - ((a._sum.downloadMb ?? 0) + (a._sum.uploadMb ?? 0)))
                .map((entry) => {
                  const dl = entry._sum.downloadMb ?? 0;
                  const ul = entry._sum.uploadMb ?? 0;
                  const total = dl + ul;
                  const max = monthlyStats.reduce((m, e) => Math.max(m, (e._sum.downloadMb ?? 0) + (e._sum.uploadMb ?? 0)), 1);
                  const pct = Math.min(100, (total / max) * 100);
                  const userInfo = userMap[entry.mac.toLowerCase()];
                  const isOnlineNow = liveClients.some((lc) => lc.mac.toLowerCase() === entry.mac.toLowerCase() && lc.state === 'Authenticated');

                  return (
                    <div key={entry.mac} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-mono text-xs text-white font-bold">{entry.mac}</span>
                          {userInfo?.username && (
                            <span className="text-xs text-sky-400 font-medium bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                              👤 {userInfo.username}
                            </span>
                          )}
                          {userInfo?.deviceName && (
                            <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              {userInfo.deviceName}
                            </span>
                          )}
                          {isOnlineNow ? (
                            <span className="text-[10px] font-sans text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>ออนไลน์อยู่</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-sans text-slate-500 font-medium bg-slate-800/80 px-1.5 py-0.5 rounded border border-slate-700">
                              ⚪ ประวัติสะสม
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-sky-400 font-bold font-mono">{formatBytes(total)}</span>
                      </div>

                      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sky-400 via-indigo-500 to-violet-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-slate-400 font-mono pt-0.5">
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

      {/* Futuristic Categorized App Traffic & Service Breakdown */}
      <div className="space-y-6">
        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>ภาพรวมบริการ & แอพพลิเคชัน (Overall App Traffic Category)</span>
            </h2>
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              วิเคราะห์ภาพรวมการใช้งาน
            </span>
          </div>

          {normalizedCategoryStats.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm">
              ไม่มีข้อมูลการเข้าใช้งานบริการในขณะนี้
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {normalizedCategoryStats.slice(0, 4).map((cat) => (
                <div key={cat.name} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{cat.icon}</span>
                      <span className="text-sm font-bold text-white">{cat.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-md font-bold border ${cat.badgeClass}`}>
                      {cat.percentage}%
                    </span>
                  </div>

                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%`, backgroundColor: cat.accentColor }}
                    />
                  </div>

                  <div className="text-xs text-slate-400 font-mono">
                    จำนวนคำขอใช้งาน: <span className="text-white font-bold">{cat.count.toLocaleString()}</span> ครั้ง
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Grouped Activity Stream: BY USER ACCOUNT -> THEN BY DEVICE */}
          {userGroupedSummaries.length > 0 && (
            <div className="space-y-6 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <User className="w-5 h-5 text-sky-400" />
                  <h3 className="text-base font-bold text-white tracking-tight">
                    กิจกรรมการเข้าใช้งาน (แยกตามผู้ใช้งาน 👤 ➔ แล้วซ้อนแยกตามเครื่อง 📱)
                  </h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowRawDomains(false)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1.5 ${
                      !showRawDomains
                        ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>สรุปแอพพลิเคชัน (Smart View)</span>
                  </button>

                  <button
                    onClick={() => setShowRawDomains(true)}
                    className={`text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center space-x-1.5 ${
                      showRawDomains
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>ดูชื่อเว็บไซต์ดิบทุกโดเมน (Full Domain Log)</span>
                  </button>
                </div>
              </div>

              {/* User Account Cards */}
              <div className="space-y-6">
                {userGroupedSummaries.map((userGroup) => (
                  <div
                    key={userGroup.username}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl"
                  >
                    {/* User Account Header */}
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 font-bold">
                          👤
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white flex items-center space-x-2">
                            <span>{userGroup.username}</span>
                            <span className="text-xs text-sky-400 font-normal bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20">
                              {userGroup.devices.length} อุปกรณ์
                            </span>
                          </h4>
                          <p className="text-xs text-slate-400">ประวัติกิจกรรมการใช้งานเว็บไซต์และแอพพลิเคชัน</p>
                        </div>
                      </div>
                    </div>

                    {/* Devices under this User */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userGroup.devices.map((dev) => (
                        <div key={dev.mac} className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-md">
                          {/* Device Header */}
                          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-slate-300">{dev.mac}</span>
                              {dev.deviceName && (
                                <span className="text-xs font-sans text-emerald-300 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                                  {dev.deviceName}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Mode 1: Smart View (Clean Categorized Badges) */}
                          {!showRawDomains ? (
                            <div className="flex flex-wrap gap-2 pt-1">
                              {dev.services.map(({ info, count }) => (
                                <div
                                  key={info.serviceName}
                                  className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-xl border font-medium shadow-sm ${info.badgeClass}`}
                                >
                                  <span>{info.icon}</span>
                                  <span>{info.serviceName}</span>
                                  <span className="text-slate-400 text-[10px] font-mono font-normal">({count} ครั้ง)</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Mode 2: Full Domain Log View (Every Single Website Domain) */
                            <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1 text-xs">
                              {dev.rawDomains.map(({ domain, count }) => (
                                <div
                                  key={domain}
                                  className="flex items-center justify-between bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-xl font-mono text-slate-300 hover:text-white hover:border-slate-700 transition"
                                >
                                  <span className="truncate max-w-[220px]">{domain}</span>
                                  <span className="text-sky-400 font-bold ml-2">{count}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
