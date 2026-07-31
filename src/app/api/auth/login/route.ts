import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { detectDeviceName } from '@/lib/deviceDetector';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอก Username และ Password' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Check account status (e.g. SUSPENDED)
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          isSuspended: true,
          message: '❌ บัญชีของคุณถูกระงับการใช้งานเนื่องจากสลิปชำระเงินไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ',
        },
        { status: 403 }
      );
    }

    // Save MAC binding if clientmac is provided
    if (body.clientmac) {
      const macKey = `mac_${body.clientmac.toLowerCase()}`;
      await prisma.systemSetting.upsert({
        where: { key: macKey },
        update: { value: user.id },
        create: { key: macKey, value: user.id },
      });

      if (body.userAgent) {
        const deviceKey = `device_${body.clientmac.toLowerCase()}`;
        const deviceName = detectDeviceName(body.userAgent);
        await prisma.systemSetting.upsert({
          where: { key: deviceKey },
          update: { value: deviceName },
          create: { key: deviceKey, value: deviceName },
        });
      }
    }

    // Check expiration
    const now = new Date();
    const isExpired = user.expireAt ? user.expireAt < now : true;

    return NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ!',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        status: user.status,
        expireAt: user.expireAt,
        isExpired,
      },
    });
  } catch (error) {
    console.error('Login Error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' },
      { status: 500 }
    );
  }
}
