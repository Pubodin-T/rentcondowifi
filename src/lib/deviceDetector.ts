export function detectDeviceName(userAgent: string): string {
  if (!userAgent) return '📱 อุปกรณ์เชื่อมต่อ';

  const ua = userAgent.toLowerCase();

  // Apple Devices
  if (ua.includes('iphone')) return '📱 Apple iPhone';
  if (ua.includes('ipad')) return '📱 Apple iPad';
  if (ua.includes('ipod')) return '📱 Apple iPod';

  // Android Brands
  if (ua.includes('samsung') || ua.includes('sm-')) return '📱 Samsung Galaxy';
  if (ua.includes('xiaomi') || ua.includes('redmi') || ua.includes('poco') || ua.includes('mi ')) return '📱 Xiaomi / Redmi';
  if (ua.includes('oppo') || ua.includes('cph')) return '📱 OPPO';
  if (ua.includes('vivo') || ua.includes('v2')) return '📱 vivo';
  if (ua.includes('realme') || ua.includes('rmx')) return '📱 realme';
  if (ua.includes('huawei') || ua.includes('honor')) return '📱 Huawei / Honor';
  if (ua.includes('pixel')) return '📱 Google Pixel';
  if (ua.includes('android')) return '📱 Android Phone';

  // Computers & Laptops
  if (ua.includes('windows')) return '💻 Windows PC';
  if (ua.includes('macintosh') || ua.includes('mac os')) return '💻 Apple Mac';
  if (ua.includes('linux')) return '💻 Linux Computer';

  return '📱 อุปกรณ์สมาร์ตโฟน';
}
