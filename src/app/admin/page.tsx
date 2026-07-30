'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  Users,
  CreditCard,
  Ban,
  RefreshCw,
  Search,
  Check,
  X,
  Lock,
  Activity,
} from 'lucide-react';

interface SlipItem {
  id: string;
  userId: string;
  amount: number;
  slipUrl: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    phone?: string;
    status: string;
    expireAt?: string;
    createdAt: string;
  };
  package: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  };
}

export default function AdminPage() {
  const [slips, setSlips] = useState<SlipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedSlip, setSelectedSlip] = useState<SlipItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('admin_authed') === 'true') {
      setAuthed(true);
    }
  }, []);

  const checkAuth = () => {
    if (password === 'Oat13392') {
      setAuthed(true);
      setAuthError('');
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('admin_authed', 'true');
      }
    } else {
      setAuthError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('admin_authed');
    }
    setAuthed(false);
    setPassword('');
  };

  const fetchSlips = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/slips');
      const data = await res.json();
      if (data.success) {
        setSlips(data.slips);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authed) {
      fetchSlips();
    }
  }, [authed]);

  // Handle Admin Action (Approve Slip or Suspend User)
  const handleAction = async (userId: string, slipId: string, action: string) => {
    setActionLoading(slipId + action);
    try {
      const res = await fetch('/api/admin/users/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, slipId, action }),
      });
      const data = await res.json();
      if (data.success) {
        fetchSlips();
        if (selectedSlip?.id === slipId) {
          setSelectedSlip(null);
        }
      } else {
        alert(data.message || 'เกิดข้อผิดพลาด');
      }
    } catch (err) {
      alert('ไม่สามารถส่งคำสั่งได้');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredSlips = slips.filter(
    (item) =>
      item.user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.user.phone && item.user.phone.includes(searchQuery))
  );

  const pendingCount = slips.filter((s) => s.status === 'PENDING').length;
  const totalRevenue = slips
    .filter((s) => s.status === 'APPROVED' || s.status === 'PENDING')
    .reduce((sum, s) => sum + s.amount, 0);

  if (!authed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-sm glass-card border border-slate-800 rounded-3xl p-8 space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">RentWiFi Admin Panel</h1>
            <p className="text-slate-400 text-sm">กรุณาใส่รหัสผ่าน Admin</p>
          </div>
          <div className="space-y-3">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && checkAuth()}
              placeholder="รหัสผ่าน"
              className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
            {authError && <p className="text-red-400 text-xs font-medium text-center">{authError}</p>}
            <button
              onClick={checkAuth}
              className="w-full py-3 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold rounded-xl transition shadow-lg shadow-sky-500/20"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 rounded-3xl border-slate-800">
          <div>
            <div className="flex items-center space-x-2 text-sky-400 font-semibold text-xs tracking-wider uppercase mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>RentWiFi Admin Panel</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              ระบบตรวจสอบสลิป & จัดการสมาชิก
            </h1>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/admin/monitoring"
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-sm font-medium transition flex items-center space-x-2 shadow-lg shadow-sky-500/20"
            >
              <Activity className="w-4 h-4" />
              <span>Network Monitoring</span>
            </Link>

            <button
              onClick={fetchSlips}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition flex items-center space-x-2 w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>รีเฟรชข้อมูล</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition flex items-center space-x-1.5"
              title="ออกจากระบบ Admin"
            >
              <Lock className="w-4 h-4" />
              <span>ล็อกเอาต์</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase">รอยืนยันสลิป</span>
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-amber-400">{pendingCount} รายการ</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase">ยอดรวมการชำระเงิน</span>
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-emerald-400">{totalRevenue} บาท</div>
          </div>

          <div className="glass-card p-5 rounded-2xl border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase">สมาชิกทั้งหมด</span>
              <Users className="w-5 h-5 text-sky-400" />
            </div>
            <div className="text-3xl font-bold text-sky-400">{slips.length} คน</div>
          </div>
        </div>

        {/* Slips Table Section */}
        <div className="glass-card rounded-3xl p-6 border-slate-800 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-white flex items-center space-x-2">
              <span>รายการแจ้งชำระเงินและตรวจสอบสลิป</span>
            </h2>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="ค้นหา Username หรือเบอร์..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 flex flex-col items-center justify-center space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400" />
              <span>กำลังโหลดข้อมูลสลิป...</span>
            </div>
          ) : filteredSlips.length === 0 ? (
            <div className="py-12 text-center text-slate-500">ไม่พบรายการแจ้งชำระเงิน</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/90 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5 rounded-l-xl">ผู้ใช้งาน (Username)</th>
                    <th className="px-4 py-3.5">แพ็กเกจ</th>
                    <th className="px-4 py-3.5">ยอดเงิน</th>
                    <th className="px-4 py-3.5">รูปภาพสลิป</th>
                    <th className="px-4 py-3.5">สถานะบัญชี</th>
                    <th className="px-4 py-3.5">วันที่แจ้ง</th>
                    <th className="px-4 py-3.5 text-right rounded-r-xl">จัดการสลิป / บัญชี</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredSlips.map((item) => {
                    const isSuspended = item.user.status === 'SUSPENDED';
                    return (
                      <tr key={item.id} className="hover:bg-slate-900/50 transition">
                        <td className="px-4 py-4 font-semibold text-white">
                          <div>{item.user.username}</div>
                          {item.user.phone && (
                            <div className="text-xs text-slate-400">{item.user.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 font-medium text-slate-200">
                          {item.package.name} ({item.package.durationDays} วัน)
                        </td>
                        <td className="px-4 py-4 font-bold text-sky-400">{item.amount} ฿</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => setSelectedSlip(item)}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-medium transition flex items-center space-x-1 border border-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>ดูรูปสลิป</span>
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          {isSuspended ? (
                            <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                              <Ban className="w-3 h-3" />
                              <span>ถูกระงับ (Suspended)</span>
                            </span>
                          ) : item.status === 'APPROVED' ? (
                            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                              <CheckCircle className="w-3 h-3" />
                              <span>อนุมัติแล้ว</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold inline-flex items-center space-x-1">
                              <RefreshCw className="w-3 h-3 animate-spin" />
                              <span>รอยืนยัน</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString('th-TH')}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Approve Slip Button */}
                            {item.status === 'PENDING' && !isSuspended && (
                              <button
                                onClick={() => handleAction(item.userId, item.id, 'APPROVE_SLIP')}
                                disabled={actionLoading === item.id + 'APPROVE_SLIP'}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center space-x-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>ยืนยันสลิป</span>
                              </button>
                            )}

                            {/* Suspend / Ban User Button */}
                            {!isSuspended ? (
                              <button
                                onClick={() => handleAction(item.userId, item.id, 'SUSPEND_USER')}
                                disabled={actionLoading === item.id + 'SUSPEND_USER'}
                                className="px-3 py-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded-xl text-xs font-medium transition flex items-center space-x-1"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>ระงับบัญชี</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => handleAction(item.userId, item.id, 'ACTIVATE_USER')}
                                disabled={actionLoading === item.id + 'ACTIVATE_USER'}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl text-xs font-medium transition flex items-center space-x-1 border border-slate-700"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>ปลดระงับ</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Slip Image Preview Modal */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card max-w-lg w-full rounded-3xl p-6 border-slate-800 relative shadow-2xl animate-fade-in">
            <button
              onClick={() => setSelectedSlip(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1">
              สลิปชำระเงินของ: {selectedSlip.user.username}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              แพ็กเกจ {selectedSlip.package.name} ({selectedSlip.amount} บาท)
            </p>

            <div className="bg-slate-900 p-2 rounded-2xl border border-slate-800 max-h-[60vh] overflow-auto flex items-center justify-center mb-6">
              <img
                src={selectedSlip.slipUrl}
                alt="Bank slip image"
                className="max-h-[55vh] w-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              {selectedSlip.user.status !== 'SUSPENDED' && (
                <button
                  onClick={() =>
                    handleAction(selectedSlip.userId, selectedSlip.id, 'SUSPEND_USER')
                  }
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Ban className="w-4 h-4" />
                  <span>สลิปไม่ถูกต้อง (ระงับบัญชี)</span>
                </button>
              )}

              {selectedSlip.status === 'PENDING' && selectedSlip.user.status !== 'SUSPENDED' && (
                <button
                  onClick={() =>
                    handleAction(selectedSlip.userId, selectedSlip.id, 'APPROVE_SLIP')
                  }
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>สลิปถูกต้อง (อนุมัติ)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
