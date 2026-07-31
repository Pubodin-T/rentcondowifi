import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { clientmac } = await req.json();
    if (!clientmac) {
      return NextResponse.json({ success: false });
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
