import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const slips = await prisma.paymentSlip.findMany({
      include: {
        user: {
          select: {
            id: true,
            username: true,
            phone: true,
            status: true,
            expireAt: true,
            createdAt: true,
          },
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
            durationDays: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, slips });
  } catch (error) {
    console.error('Fetch Slips Error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch slips' },
      { status: 500 }
    );
  }
}
