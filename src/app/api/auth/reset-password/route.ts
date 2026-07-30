import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, phone, newPassword } = body;

    if (!username || !phone || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'กรุณากรอก Username, เบอร์โทรศัพท์ และรหัสผ่านใหม่ให้ครบถ้วน' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim();
    const cleanPhone = phone.replace(/[- \s]/g, '');

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบชื่อผู้ใช้นี้ในระบบ หรือข้อมูลไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Verify registered phone number
    const userCleanPhone = (user.phone || '').replace(/[- \s]/g, '');

    if (!userCleanPhone || userCleanPhone !== cleanPhone) {
      return NextResponse.json(
        { success: false, message: 'ชื่อผู้ใช้หรือเบอร์โทรศัพท์ที่ลงทะเบียนไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Hash new password and update user in database
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จ! กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่',
    });
  } catch (error: any) {
    console.error('Reset Password Error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' },
      { status: 500 }
    );
  }
}
