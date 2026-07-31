import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { detectDeviceName } from '@/lib/deviceDetector';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, phone, packageId, slipUrl } = body;

    if (!username || !password || !phone || !packageId || !slipUrl) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอกข้อมูล Username, Password, เบอร์โทรศัพท์ และแนบสลิปให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Check if username exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้นี้มีในระบบแล้ว กรุณาใช้ชื่ออื่น' },
        { status: 400 }
      );
    }

    // Get Package duration
    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบแพ็กเกจที่เลือก' },
        { status: 404 }
      );
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    // Calculate Access Expiry Date (Instant Access Granted)
    const now = new Date();
    const expireAt = new Date(now.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

    // Create User & Payment Slip in a transaction
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
        phone,
        role: 'USER',
        status: 'ACTIVE',
        expireAt,
        slips: {
          create: {
            packageId: pkg.id,
            amount: pkg.price,
            slipUrl,
            status: 'PENDING',
          },
        },
      },
      include: {
        slips: true,
      },
    });

    // Save MAC binding if clientmac is provided
    if (body.clientmac) {
      const macKey = `mac_${body.clientmac.toLowerCase()}`;
      await prisma.systemSetting.upsert({
        where: { key: macKey },
        update: { value: newUser.id },
        create: { key: macKey, value: newUser.id },
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

    return NextResponse.json({
      success: true,
      message: 'สมัครใช้งานและแจ้งชำระเงินสำเร็จ!',
      user: {
        id: newUser.id,
        username: newUser.username,
        expireAt: newUser.expireAt,
        packageName: pkg.name,
      },
    });
  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' },
      { status: 500 }
    );
  }
}
