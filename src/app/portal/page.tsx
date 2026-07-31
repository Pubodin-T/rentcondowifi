'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Wifi,
  Lock,
  User,
  Phone,
  Upload,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Clock,
  Sparkles,
  RefreshCw,
  Zap,
  PlusCircle,
  X,
  HardDrive,
  Eye,
  EyeOff,
  KeyRound,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { generatePromptPayPayload } from '@/lib/promptpay';
import QRCode from 'qrcode';

interface Package {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  description: string;
}

function PortalContent() {
  const searchParams = useSearchParams();

  // OpenNDS v10 FAS Level 1: all params come inside a base64-encoded 'fas' query param
  const fasRaw = searchParams.get('fas') || '';
  let fasHid = '';
  let fasGatewayAddress = '';
  let fasOriginUrl = '';
  let fasClientMac = '';
  let fasClientIp = '';
  let fasGatewayName = '';

  if (fasRaw) {
    try {
      const decoded = atob(fasRaw);
      const parts = decoded.split(',').map((s: string) => s.trim());
      for (const part of parts) {
        const [key, ...valParts] = part.split('=');
        const val = decodeURIComponent(valParts.join('=').trim());
        if (key === 'hid') fasHid = val;
        else if (key === 'gatewayaddress') fasGatewayAddress = val;
        else if (key === 'originurl') fasOriginUrl = val;
        else if (key === 'clientmac') fasClientMac = val;
        else if (key === 'clientip') fasClientIp = val;
        else if (key === 'gatewayname') fasGatewayName = val;
      }
    } catch (e) {
      console.error('Failed to decode FAS parameter', e);
    }
  }

  // Fallback to legacy query params if fas is not present
  const tok = fasHid || searchParams.get('tok') || searchParams.get('token') || '';
  const redir = fasOriginUrl || searchParams.get('redir') || searchParams.get('target') || 'http://captive.apple.com/hotspot-detect.html';
  const clientmac = fasClientMac || searchParams.get('clientmac') || searchParams.get('mac') || '';
  const clientip = fasClientIp || searchParams.get('clientip') || searchParams.get('ip') || '';
  const authaction = searchParams.get('authaction') || '';
  const gatewayname = fasGatewayName || searchParams.get('gatewayname') || '';
  const gatewayAddress = fasGatewayAddress || '192.168.2.1:2050';

  const [tab, setTab] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [packages, setPackages] = useState<Package[]>([
    {
      id: 'pkg-7d',
      name: 'โปร 7 วัน',
      price: 75,
      durationDays: 7,
      description: 'อินเทอร์เน็ตสปีดแรงเต็มสปีด 7 วัน เล่นได้ไม่อั้น',
    },
    {
      id: 'pkg-30d',
      name: 'โปร 30 วัน',
      price: 250,
      durationDays: 30,
      description: 'สุดคุ้ม! อินเทอร์เน็ตสปีดแรงเต็มสปีด 30 วัน เล่นได้ไม่อั้น',
    },
  ]);

  // Form States
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(packages[0]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [slipPreview, setSlipPreview] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Renewal Form States
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewPackage, setRenewPackage] = useState<Package | null>(packages[0]);
  const [renewSlipPreview, setRenewSlipPreview] = useState<string | null>(null);
  const [renewQrCodeUrl, setRenewQrCodeUrl] = useState<string>('');

  // Login States
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Password Visibility States
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');

  // UI Flow States
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [suspendedMsg, setSuspendedMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const promptPayNumber = process.env.NEXT_PUBLIC_PROMPTPAY_ID || '0912368969';

  // Fetch Packages from API
  useEffect(() => {
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.packages.length > 0) {
          setPackages(data.packages);
          setSelectedPackage(data.packages[0]);
          setRenewPackage(data.packages[0]);
        }
      })
      .catch(() => {});
  }, []);

  // Automatic MAC Authentication Check (Auto-Login if device was previously authenticated and package is active)
  useEffect(() => {
    if (clientmac) {
      fetch('/api/auth/check-mac', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientmac }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.user) {
            setSuccessData(data.user);
          }
        })
        .catch(() => {});
    }
  }, [clientmac]);

  // Generate PromptPay QR Code when selectedPackage changes
  useEffect(() => {
    if (selectedPackage) {
      const payload = generatePromptPayPayload(promptPayNumber, selectedPackage.price);
      QRCode.toDataURL(payload, { width: 300, margin: 2 }, (err, url) => {
        if (!err && url) {
          setQrCodeDataUrl(url);
        }
      });
    }
  }, [selectedPackage, promptPayNumber]);

  // Generate PromptPay QR Code when renewPackage changes
  useEffect(() => {
    if (renewPackage) {
      const payload = generatePromptPayPayload(promptPayNumber, renewPackage.price);
      QRCode.toDataURL(payload, { width: 300, margin: 2 }, (err, url) => {
        if (!err && url) {
          setRenewQrCodeUrl(url);
        }
      });
    }
  }, [renewPackage, promptPayNumber]);

  // Handle Slip Upload for Registration
  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Slip Upload for Renewal
  const handleRenewSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRenewSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');

    if (!forgotUsername || !forgotPhone || !forgotNewPassword) {
      setForgotErrorMsg('กรุณากรอก Username, เบอร์โทรศัพท์ และรหัสผ่านใหม่ให้ครบถ้วน');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: forgotUsername,
          phone: forgotPhone,
          newPassword: forgotNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotErrorMsg(data.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      } else {
        setForgotSuccessMsg(data.message || 'เปลี่ยนรหัสผ่านสำเร็จ!');
        setTimeout(() => {
          setLoginUsername(forgotUsername);
          setShowForgotModal(false);
          setForgotUsername('');
          setForgotPhone('');
          setForgotNewPassword('');
          setForgotSuccessMsg('');
        }, 1800);
      }
    } catch (err) {
      setForgotErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Registration & Slip Submit
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!username || !password) {
      setErrorMsg('กรุณากรอก Username และ Password');
      return;
    }

    if (!phone || !phone.trim()) {
      setErrorMsg('กรุณากรอกเบอร์โทรศัพท์สำหรับลงทะเบียน (จำเป็นต้องใช้ในกรณีลืมรหัสผ่าน)');
      return;
    }

    if (!selectedPackage) {
      setErrorMsg('กรุณาเลือกแพ็กเกจเช่าใช้งาน');
      return;
    }

    if (!slipPreview) {
      setErrorMsg('กรุณาแนบภาพสลิปชำระเงิน');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          phone,
          packageId: selectedPackage.id,
          slipUrl: slipPreview,
          clientmac,
          clientip,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการสมัคร');
      } else {
        setSuccessData(data.user);
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuspendedMsg('');

    if (!loginUsername || !loginPassword) {
      setErrorMsg('กรุณากรอก Username และ Password');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
          clientmac,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.isSuspended) {
          setSuspendedMsg(data.message);
        } else {
          setErrorMsg(data.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        }
      } else {
        setSuccessData(data.user);
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
    } finally {
      setLoading(false);
    }
  };

  // Handle Renew Submission
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!renewPackage) {
      setErrorMsg('กรุณาเลือกแพ็กเกจต่ออายุ');
      return;
    }
    if (!renewSlipPreview) {
      setErrorMsg('กรุณาแนบสลิปชำระเงินต่ออายุ');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/renew', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: successData.id,
          packageId: renewPackage.id,
          slipUrl: renewSlipPreview,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'เกิดข้อผิดพลาดในการต่ออายุ');
      } else {
        setSuccessData(data.user);
        setShowRenewModal(false);
        setRenewSlipPreview(null);
        alert('🎉 ต่ออายุแพ็กเกจเรียบร้อยแล้ว!');
      }
    } catch (err) {
      setErrorMsg('ไม่สามารถต่ออายุได้');
    } finally {
      setLoading(false);
    }
  };

  // Redirect to OpenNDS Auth Gateway (OpenNDS v10 FAS Level 1 uses 'hid')
  const handleUnlockInternet = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    setIsConnecting(true);

    const gwAddr = gatewayAddress.includes('://') ? gatewayAddress : `http://${gatewayAddress}`;

    if (tok) {
      // Direct Top-Level Navigation to OpenNDS Gateway Auth URL.
      // Top-level navigation from HTTPS (Vercel) to HTTP (Router) is permitted by mobile browsers
      // whereas background fetch()/Image() is blocked due to Mixed Content security rules.
      const authUrl = `${gwAddr}/opennds_auth/?hid=${encodeURIComponent(tok)}&redir=${encodeURIComponent(redir)}`;
      window.location.href = authUrl;
    } else {
      // Fallback if accessed directly without FAS parameters
      window.location.href = redir || 'https://www.google.com';
    }
  };

  // Helper: Calculate Remaining Days / Hours
  const getRemainingText = (expireDateStr: string) => {
    if (!expireDateStr) return 'ไม่พบข้อมูล';
    const expire = new Date(expireDateStr).getTime();
    const now = new Date().getTime();
    const diff = expire - now;

    if (diff <= 0) return 'หมดอายุการใช้งานแล้ว';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) {
      return `เหลืออีก ${days} วัน ${hours} ชั่วโมง`;
    }
    return `เหลืออีก ${hours} ชั่วโมง`;
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-lg">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 shadow-lg shadow-sky-500/25 mb-3">
            <Wifi className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-100 to-sky-400 bg-clip-text text-transparent">
            {gatewayname || 'RentWiFi Portal'}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            อินเทอร์เน็ต WiFi ความเร็วสูง สปีดแรง สมัครง่าย จ่ายผ่าน PromptPay
          </p>

          {/* Client MAC Badge */}
          {clientmac && (
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800 rounded-full text-[11px] text-slate-400 mt-2.5">
              <HardDrive className="w-3 h-3 text-sky-400" />
              <span>อุปกรณ์ (MAC): <strong className="text-slate-200 font-mono">{clientmac}</strong></span>
            </div>
          )}
        </div>

        {/* Suspended Account Alert Modal */}
        {suspendedMsg && (
          <div className="glass-card p-6 rounded-2xl border-red-500/50 text-center mb-6 animate-fade-in">
            <div className="w-14 h-14 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-red-400 mb-2">บัญชีถูกระงับการใช้งาน!</h3>
            <p className="text-slate-300 text-sm mb-4">{suspendedMsg}</p>
            <button
              onClick={() => setSuspendedMsg('')}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
            >
              ปิดหน้านี้
            </button>
          </div>
        )}

        {/* Customer Profile & Expiry Check Screen */}
        {successData ? (
          <div className="glass-card p-6 rounded-3xl border-sky-500/40 shadow-2xl animate-fade-in space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-sky-500/20 text-sky-400 rounded-2xl flex items-center justify-center border border-sky-500/30">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{successData.username}</h2>
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>เข้าสู่ระบบแล้ว</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSuccessData(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800"
              >
                ออกจากระบบ
              </button>
            </div>

            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 p-5 rounded-2xl border border-sky-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>สถานะแพ็กเกจอินเทอร์เน็ต</span>
                </div>
                {new Date(successData.expireAt) > new Date() ? (
                  <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold">
                    ใช้งานได้ปกติ
                  </span>
                ) : (
                  <span className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-semibold">
                    หมดอายุแล้ว
                  </span>
                )}
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs text-slate-400">เวลาใช้งานคงเหลือ</div>
                    <div className="text-base font-bold text-sky-400">
                      {getRemainingText(successData.expireAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                {successData.packageName && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">แพ็กเกจปัจจุบัน:</span>
                    <span className="font-semibold text-white">{successData.packageName}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">วันหมดอายุใช้งาน:</span>
                  <span className="font-semibold text-slate-200">
                    {new Date(successData.expireAt).toLocaleString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => setShowRenewModal(true)}
                className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-sky-500/30 font-semibold rounded-2xl transition flex items-center justify-center space-x-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>ต่ออายุแพ็กเกจ</span>
              </button>

              <button
                onClick={handleUnlockInternet}
                disabled={isConnecting}
                className={`py-3 px-4 text-white font-semibold rounded-2xl shadow-lg transition flex items-center justify-center space-x-2 text-sm ${isConnecting ? 'bg-slate-600 cursor-wait shadow-none' : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 shadow-sky-500/25'}`}
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>กำลังเชื่อมต่อ...</span>
                  </>
                ) : (
                  <>
                    <span>เชื่อมต่ออินเทอร์เน็ต</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Portal Form Card */
          <div className="glass-card rounded-3xl p-6 shadow-2xl border-slate-800">
            <div className="grid grid-cols-2 p-1 bg-slate-900/80 rounded-2xl mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTab('LOGIN');
                  setErrorMsg('');
                }}
                className={`py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  tab === 'LOGIN'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <User className="w-4 h-4" />
                <span>เข้าสู่ระบบ</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('REGISTER');
                  setErrorMsg('');
                }}
                className={`py-2.5 text-sm font-medium rounded-xl transition-all flex items-center justify-center space-x-2 ${
                  tab === 'REGISTER'
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>สมัครเช่าใช้งาน</span>
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 mb-5 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-sm flex items-center space-x-2 animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {tab === 'LOGIN' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Username (ชื่อผู้ใช้งาน)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="กรอก Username"
                      className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-400">
                      Password (รหัสผ่าน)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotUsername(loginUsername);
                        setForgotErrorMsg('');
                        setForgotSuccessMsg('');
                        setShowForgotModal(true);
                      }}
                      className="text-xs text-sky-400 hover:text-sky-300 transition hover:underline"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full glass-input pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>เข้าสู่ระบบเช็คสถานะ / เล่นเน็ต</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {tab === 'REGISTER' && (
              <form onSubmit={handleRegister} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-sky-400" />
                    <span>เลือกแพ็กเกจเช่าใช้งาน</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {packages.map((pkg) => {
                      const isSelected = selectedPackage?.id === pkg.id;
                      return (
                        <div
                          key={pkg.id}
                          onClick={() => setSelectedPackage(pkg)}
                          className={`cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                            isSelected
                              ? 'bg-sky-500/15 border-sky-500 shadow-md shadow-sky-500/10'
                              : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {isSelected && (
                            <div className="absolute top-2 right-2 text-sky-400">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                          )}
                          <div>
                            <div className="text-lg font-bold text-white mb-0.5">{pkg.name}</div>
                            <div className="text-2xl font-extrabold text-sky-400">
                              {pkg.price}{' '}
                              <span className="text-xs font-normal text-slate-400">บาท</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-300 mt-2 leading-relaxed whitespace-pre-line font-normal border-t border-slate-800/80 pt-2">
                            {pkg.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      ตั้ง Username (สำหรับเข้าใช้งาน)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="เช่น user1234"
                        className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        ตั้ง Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type={showRegisterPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full glass-input pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition"
                          tabIndex={-1}
                        >
                          {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        เบอร์โทรศัพท์ <span className="text-sky-400 font-semibold">(จำเป็น)</span>
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                        <input
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="08X-XXX-XXXX"
                          className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPackage && (
                  <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800 text-center">
                    <div className="flex items-center justify-center space-x-1.5 text-xs text-sky-400 font-semibold uppercase tracking-wider mb-2">
                      <QrCode className="w-4 h-4" />
                      <span>สแกนจ่ายผ่าน PromptPay</span>
                    </div>

                    {qrCodeDataUrl ? (
                      <div className="inline-block p-2 bg-white rounded-xl shadow-md mb-2">
                        <img
                          src={qrCodeDataUrl}
                          alt="PromptPay QR Code"
                          className="w-44 h-44 mx-auto"
                        />
                      </div>
                    ) : (
                      <div className="w-44 h-44 bg-slate-800 rounded-xl flex items-center justify-center mx-auto mb-2 text-slate-500">
                        กำลังสร้าง QR...
                      </div>
                    )}

                    <div className="text-sm font-semibold text-slate-200">
                      ยอดชำระ:{' '}
                      <span className="text-sky-400 text-lg font-bold">
                        {selectedPackage.price} บาท
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      พร้อมเพย์: <span className="text-slate-200 font-mono">{promptPayNumber}</span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Upload className="w-4 h-4 text-sky-400" />
                    <span>แนบสลิปชำระเงิน</span>
                  </label>

                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSlipChange}
                      className="hidden"
                      id="slip-input"
                    />
                    <label
                      htmlFor="slip-input"
                      className="flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-700 hover:border-sky-500 bg-slate-900/40 cursor-pointer transition text-center"
                    >
                      {slipPreview ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={slipPreview}
                            alt="Slip preview"
                            className="h-28 object-contain rounded-lg mb-2 border border-slate-700"
                          />
                          <span className="text-xs text-sky-400 font-medium flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>เปลี่ยนรูปสลิป</span>
                          </span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-7 h-7 text-slate-400 mb-1.5" />
                          <span className="text-sm text-slate-300 font-medium">
                            กดเพื่อเลือกรูปภาพสลิป
                          </span>
                          <span className="text-[11px] text-slate-500 mt-0.5">
                            รองรับไฟล์ JPG, PNG
                          </span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-2xl shadow-lg shadow-sky-500/25 transition flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <span>ยืนยันการแจ้งชำระเงิน</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        )}

        {showRenewModal && successData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full rounded-3xl p-6 border-slate-800 relative shadow-2xl animate-fade-in space-y-4">
              <button
                onClick={() => setShowRenewModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-white">ต่ออายุแพ็กเกจ</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  เลือกแพ็กเกจ สแกน PromptPay และแนบสลิปเพื่อเพิ่มวันใช้งาน
                </p>
              </div>

              <form onSubmit={handleRenewSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {packages.map((pkg) => {
                    const isSelected = renewPackage?.id === pkg.id;
                    return (
                      <div
                        key={pkg.id}
                        onClick={() => setRenewPackage(pkg)}
                        className={`cursor-pointer p-3.5 rounded-2xl border transition-all relative ${
                          isSelected
                            ? 'bg-sky-500/15 border-sky-500'
                            : 'bg-slate-900/50 border-slate-800'
                        }`}
                      >
                        <div className="text-sm font-bold text-white">{pkg.name}</div>
                        <div className="text-xl font-extrabold text-sky-400">{pkg.price} ฿</div>
                      </div>
                    );
                  })}
                </div>

                {renewPackage && (
                  <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 text-center">
                    {renewQrCodeUrl && (
                      <img
                        src={renewQrCodeUrl}
                        alt="PromptPay QR Code"
                        className="w-36 h-36 mx-auto bg-white p-1.5 rounded-xl shadow-md mb-1"
                      />
                    )}
                    <div className="text-xs text-slate-300 font-semibold">
                      ยอดชำระ:{' '}
                      <span className="text-sky-400 text-sm font-bold">
                        {renewPackage.price} บาท
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleRenewSlipChange}
                    className="hidden"
                    id="renew-slip-input"
                  />
                  <label
                    htmlFor="renew-slip-input"
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-slate-700 hover:border-sky-500 bg-slate-900/40 cursor-pointer transition text-center"
                  >
                    {renewSlipPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={renewSlipPreview}
                          alt="Renew slip preview"
                          className="h-20 object-contain rounded mb-1"
                        />
                        <span className="text-[11px] text-sky-400">เปลี่ยนสลิป</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-slate-400 mb-1" />
                        <span className="text-xs text-slate-300 font-medium">แนบสลิปชำระเงิน</span>
                      </>
                    )}
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm"
                >
                  {loading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>ยืนยันต่ออายุแพ็กเกจ</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-card max-w-md w-full rounded-3xl p-6 border-slate-800 relative shadow-2xl animate-fade-in space-y-4">
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-2xl flex items-center justify-center mx-auto border border-sky-500/20 mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white">ลืมรหัสผ่าน / ตั้งรหัสผ่านใหม่</h3>
                <p className="text-xs text-slate-400">
                  กรอก Username และเบอร์โทรศัพท์ที่ลงทะเบียนไว้เพื่อตั้งรหัสผ่านใหม่
                </p>
              </div>

              {forgotErrorMsg && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{forgotErrorMsg}</span>
                </div>
              )}

              {forgotSuccessMsg && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{forgotSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Username (ชื่อผู้ใช้งาน)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={forgotUsername}
                      onChange={(e) => setForgotUsername(e.target.value)}
                      placeholder="กรอก Username ที่ลงทะเบียน"
                      className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    เบอร์โทรศัพท์ที่ลงทะเบียน
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      required
                      value={forgotPhone}
                      onChange={(e) => setForgotPhone(e.target.value)}
                      placeholder="08X-XXX-XXXX"
                      className="w-full glass-input pl-10 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    ตั้งรหัสผ่านใหม่ (New Password)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    <input
                      type={showForgotPassword ? 'text' : 'password'}
                      required
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่านใหม่"
                      className="w-full glass-input pl-10 pr-10 py-2.5 rounded-xl text-sm text-white placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(!showForgotPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-200 transition"
                      tabIndex={-1}
                    >
                      {showForgotPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition flex items-center justify-center space-x-2 text-sm mt-2"
                >
                  {forgotLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>ยืนยันตั้งรหัสผ่านใหม่</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Step-by-Step Instructions Guide (ขั้นตอนการเปิดใช้งานอินเทอร์เน็ต) */}
        <div className="mt-8 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 text-left space-y-4 shadow-xl">
          <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              วิธีเปิดใช้งานอินเทอร์เน็ต (3 ขั้นตอนง่ายๆ)
            </h3>
          </div>

          <div className="space-y-4 text-xs text-slate-300">
            {/* Step 1 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-md shadow-emerald-500/10">
                1
              </div>
              <div>
                <p className="font-bold text-white text-xs">สำหรับผู้ใช้ใหม่ ➔ กดสลับไปที่แท็บ "สมัครสมาชิก (Register)"</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  กดเลือกแท็บ <strong className="text-emerald-300 font-semibold">"สมัครสมาชิก"</strong> ด้านบน จากนั้นเลือกแพ็กเกจ WiFi ที่ต้องการ สแกน QR Code ชำระเงิน และแนบสลิป
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-md shadow-sky-500/10">
                2
              </div>
              <div>
                <p className="font-bold text-white text-xs">กรอกข้อมูลตั้งรหัสผ่าน & ยืนยันการเชื่อมต่อเน็ต</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  กรอกชื่อผู้ใช้ (Username), รหัสผ่าน (Password) และเบอร์โทรศัพท์ แล้วกดปุ่ม <strong className="text-sky-300 font-semibold">"ยืนยันสมัคร & เชื่อมต่อเน็ต"</strong>
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-400 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 shadow-md shadow-violet-500/10">
                3
              </div>
              <div>
                <p className="font-bold text-white text-xs">สำหรับลูกค้าเดิมที่มีบัญชีอยู่แล้ว ➔ กดสลับไปที่แท็บ "เข้าสู่ระบบ (Login)"</p>
                <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                  เพียงสลับไปที่แท็บ <strong className="text-violet-300 font-semibold">"เข้าสู่ระบบ (Login)"</strong> ด้านบน กรอก Username และ Password เดิมเพื่อปลดล็อกเล่นเน็ตได้ทันที!
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center space-y-3">
          <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-sky-500" />
            <span>ระบบปลอดภัย เชื่อมต่อนวัตกรรม WiFi ความเร็วสูง</span>
          </div>

          <div className="flex flex-col items-center justify-center">
            <a
              href="https://line.me/ti/p/~tieanthong"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 rounded-xl text-emerald-400 text-xs font-medium transition-all group shadow-lg shadow-emerald-500/5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>ติดต่อผู้ดูแลระบบ: <strong className="font-semibold text-emerald-300">LINE ID: tieanthong</strong></span>
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PortalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">กำลังโหลด...</div>}>
      <PortalContent />
    </Suspense>
  );
}
