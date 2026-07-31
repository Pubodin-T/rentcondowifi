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
  PieChart,
  ShieldCheck,
  Layers,
  Smartphone,
  CheckCircle2,
  Sparkles,
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
}: {
  client: LiveClient;
  userMap: Record<string, { username: string; phone?: string | null; deviceName?: string }>;
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

  // Aggregate Raw Subdomains into Normalized Services (ลดความซ้ำซ้อน 100%)
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

  // Per-Device Normalized App Summary
  const userAppSummaries = useMemo(() => {
    const macMap: Record<string, Record<string, { info: NormalizedDomainInfo; count: number }>> = {};

    for (const ud of userDomains) {
      if (!ud.mac) continue;
      const mac = ud.mac.toLowerCase();
      if (!macMap[mac]) macMap[mac] = {};

      const info = normalizeDomain(ud.domain);
      if (!macMap[mac][info.serviceName]) {
        macMap[mac][info.serviceName] = { info, count: 0 };
      }
      macMap[mac][info.serviceName].count += ud.count;
    }

    return Object.entries(macMap).map(([mac, services]) => {
      const serviceList = Object.values(services).sort((a, b) => b.count - a.count);
      return {
        mac,
        services: serviceList,
      };
    });
  }, [userDomains]);

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
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_8px_#34d399] animate-pulse" />
              <span>อุปกรณ์ที่กำลังต่อใช้งานอยู่ (Live Session)</span>
            </h2>
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
              {liveClients.map((c) => (
                <LiveClientRow key={c.mac} client={c} userMap={userMap} />
              ))}
            </div>
          )}
        </div>

        {/* Monthly Bandwidth per Device */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>ปริมาณเน็ตสะสมเดือนนี้ (ต่ออุปกรณ์)</span>
          </h2>

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

      {/* Futuristic Categorized App Traffic & Service Breakdown (ลดความซ้ำซ้อน 100%) */}
      <div className="space-y-6">
        <div className="border-t border-slate-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center space-x-2 tracking-tight">
              <Sparkles className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span>สถิติการใช้งานบริการ & แอพพลิเคชัน (Smart Category Breakdown)</span>
            </h2>
            <span className="text-xs text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-full">
              วิเคราะห์จำแนกบริการอัตโนมัติ
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

          {/* Per-Device Smart Application Log Summary */}
          {userAppSummaries.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span>จำแนกแอพพลิเคชันที่เข้าใช้งานต่อผู้ใช้งาน (Clean Activity Stream)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userAppSummaries.map(({ mac, services }) => {
                  const userInfo = userMap[mac.toLowerCase()];
                  return (
                    <div key={mac} className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-mono text-xs text-white font-bold">{mac}</span>
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

                      <div className="flex flex-wrap gap-2 pt-1">
                        {services.map(({ info, count }) => (
                          <div
                            key={info.serviceName}
                            className={`flex items-center space-x-1.5 text-xs px-2.5 py-1 rounded-lg border font-medium ${info.badgeClass}`}
                          >
                            <span>{info.icon}</span>
                            <span>{info.serviceName}</span>
                            <span className="text-slate-400 text-[10px] font-mono font-normal">({count})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
