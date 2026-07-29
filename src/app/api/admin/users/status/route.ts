import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, slipId, action } = body; // action: "APPROVE_SLIP", "REJECT_SLIP", "SUSPEND_USER", "ACTIVATE_USER"

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'Invalid payload' },
        { status: 400 }
      );
    }

    if (action === 'SUSPEND_USER') {
      // Suspend user account and mark slip as REJECTED
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'SUSPENDED' },
      });

      if (slipId) {
        await prisma.paymentSlip.update({
          where: { id: slipId },
          data: { status: 'REJECTED', note: 'สลิปปลอม/ชำระเงินไม่ถูกต้อง' },
        });
      }

      return NextResponse.json({
        success: true,
        message: 'ระงับบัญชีผู้ใช้เรียบร้อยแล้ว',
      });
    }

    if (action === 'ACTIVATE_USER') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      });

      return NextResponse.json({
        success: true,
        message: 'ปลดระงับบัญชีเรียบร้อยแล้ว',
      });
    }

    if (action === 'APPROVE_SLIP' && slipId) {
      await prisma.paymentSlip.update({
        where: { id: slipId },
        data: { status: 'APPROVED' },
      });

      return NextResponse.json({
        success: true,
        message: 'ยืนยันความถูกต้องสลิปเรียบร้อยแล้ว',
      });
    }

    return NextResponse.json(
      { success: false, message: 'คำสั่งไม่ถูกต้อง' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update User Status Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update user status' },
      { status: 500 }
    );
  }
}
