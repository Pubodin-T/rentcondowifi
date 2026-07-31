export interface NormalizedDomainInfo {
  serviceName: string;
  category: 'Streaming' | 'Social' | 'Messaging' | 'Cloud' | 'Search' | 'Gaming' | 'Other';
  icon: string;
  badgeClass: string;
  accentColor: string;
}

export function normalizeDomain(domain: string): NormalizedDomainInfo {
  const d = domain.toLowerCase().trim();

  // YouTube / Google Video
  if (d.includes('googlevideo.com') || d.includes('youtube.com') || d.includes('ytimg.com') || d.includes('youtu.be')) {
    return {
      serviceName: 'YouTube Streaming',
      category: 'Streaming',
      icon: '▶️',
      badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20',
      accentColor: '#ef4444',
    };
  }

  // Apple Services (iCloud, Siri, App Store, Apple Music)
  if (
    d.includes('apple.com') ||
    d.includes('icloud.com') ||
    d.includes('aaplimg.com') ||
    d.includes('cdn-apple.com') ||
    d.includes('apple-dns.net') ||
    d.includes('mzstatic.com')
  ) {
    return {
      serviceName: 'Apple Services & App Store',
      category: 'Cloud',
      icon: '🍏',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
      accentColor: '#38bdf8',
    };
  }

  // LINE Messenger & Stickers
  if (d.includes('line.me') || d.includes('line-scdn.net') || d.includes('line-apps.com') || d.includes('naver.jp')) {
    return {
      serviceName: 'LINE Messenger',
      category: 'Messaging',
      icon: '💬',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      accentColor: '#10b981',
    };
  }

  // Facebook, Instagram, WhatsApp
  if (
    d.includes('facebook.com') ||
    d.includes('fbcdn.net') ||
    d.includes('instagram.com') ||
    d.includes('cdninstagram.com') ||
    d.includes('whatsapp.com')
  ) {
    return {
      serviceName: 'Facebook & Instagram',
      category: 'Social',
      icon: '📘',
      badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      accentColor: '#3b82f6',
    };
  }

  // TikTok
  if (d.includes('tiktok.com') || d.includes('byteoversea.com') || d.includes('ibyteimg.com')) {
    return {
      serviceName: 'TikTok Video',
      category: 'Streaming',
      icon: '🎵',
      badgeClass: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
      accentColor: '#ec4899',
    };
  }

  // Netflix
  if (d.includes('netflix.com') || d.includes('nflxso.net') || d.includes('nflxext.com')) {
    return {
      serviceName: 'Netflix',
      category: 'Streaming',
      icon: '🎬',
      badgeClass: 'bg-red-600/10 text-red-500 border-red-600/20',
      accentColor: '#dc2626',
    };
  }

  // Google Search & Cloud
  if (
    d.includes('google.com') ||
    d.includes('google.co.th') ||
    d.includes('gstatic.com') ||
    d.includes('googleapis.com') ||
    d.includes('googleusercontent.com') ||
    d.includes('dns.google')
  ) {
    return {
      serviceName: 'Google Web Services',
      category: 'Search',
      icon: '🔍',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      accentColor: '#f59e0b',
    };
  }

  // Microsoft / Office / Outlook
  if (
    d.includes('microsoft.com') ||
    d.includes('office365.com') ||
    d.includes('office.com') ||
    d.includes('outlook.com') ||
    d.includes('live.com') ||
    d.includes('azure.com')
  ) {
    return {
      serviceName: 'Microsoft 365 & Office',
      category: 'Cloud',
      icon: '🪟',
      badgeClass: 'bg-sky-600/10 text-sky-300 border-sky-600/20',
      accentColor: '#0284c7',
    };
  }

  // Akamai / CDN
  if (d.includes('akamai.net') || d.includes('akamaiedge.net') || d.includes('cloudfront.net')) {
    return {
      serviceName: 'CDN Data Network',
      category: 'Cloud',
      icon: '⚡',
      badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
      accentColor: '#94a3b8',
    };
  }

  // Extract root domain for unrecognized domains
  const parts = d.split('.');
  const root = parts.length > 2 ? parts.slice(-2).join('.') : d;

  return {
    serviceName: root,
    category: 'Other',
    icon: '🌐',
    badgeClass: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    accentColor: '#8b5cf6',
  };
}
