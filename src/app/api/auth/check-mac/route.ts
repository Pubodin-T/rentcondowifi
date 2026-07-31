import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { detectDeviceName } from '@/lib/deviceDetector';

export async function POST(req: Request) {
  try {
    const { clientmac, userAgent: bodyUa } = await req.json();
    if (!clientmac) {
      return NextResponse.json({ success: false });
    }

    // Auto-save REAL device name from HTTP User-Agent header
    const reqUa = bodyUa || req.headers.get('user-agent') || '';
    if (reqUa) {
      const deviceKey = `device_${clientmac.toLowerCase()}`;
      const deviceName = detectDeviceName(reqUa);
      await prisma.systemSetting.upsert({
        where: { key: deviceKey },
        update: { value: deviceName },
        create: { key: deviceKey, value: deviceName },
      });
    }

    const macKey = `mac_${clientmac.toLowerCase()}`;
    const setting = await prisma.systemSetting.findUnique({
      where: { key: macKey },
    });

    if (!setting || !setting.value) {
      return NextResponse.json({ success: false });
    }

    const user = await prisma.user.findUnique({
      where: { id: setting.value },
    });

    if (!user) {
      return NextResponse.json({ success: false });
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json({
        success: false,
        isSuspended: true,
        message: '❌ บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
      });
    }

    const now = new Date();
    if (!user.expireAt || user.expireAt < now) {
      return NextResponse.json({ success: false, isExpired: true });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        expireAt: user.expireAt,
      },
    });
  } catch (error) {
    console.error('Check MAC Error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
