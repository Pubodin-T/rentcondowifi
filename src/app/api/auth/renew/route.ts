import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, packageId, slipUrl } = body;

    if (!userId || !packageId || !slipUrl) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลการต่ออายุไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' },
        { status: 404 }
      );
    }

    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน' },
        { status: 403 }
      );
    }

    const pkg = await prisma.package.findUnique({
      where: { id: packageId },
    });

    if (!pkg) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบแพ็กเกจที่เลือก' },
        { status: 404 }
      );
    }

    // Calculate New Expiry Date
    const now = new Date();
    // If current expireAt is in the future, add duration to expireAt; otherwise add duration to now!
    const baseDate = user.expireAt && user.expireAt > now ? new Date(user.expireAt) : now;
    const newExpireAt = new Date(baseDate.getTime() + pkg.durationDays * 24 * 60 * 60 * 1000);

    // Update User & Create Payment Slip
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        expireAt: newExpireAt,
        slips: {
          create: {
            packageId: pkg.id,
            amount: pkg.price,
            slipUrl,
            status: 'PENDING',
            note: 'ต่ออายุแพ็กเกจ',
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `ต่ออายุสำเร็จ! วันหมดอายุใหม่: ${newExpireAt.toLocaleDateString('th-TH')}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        expireAt: updatedUser.expireAt,
        packageName: pkg.name,
      },
    });
  } catch (error) {
    console.error('Renew Error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการต่ออายุแพ็กเกจ' },
      { status: 500 }
    );
  }
}
