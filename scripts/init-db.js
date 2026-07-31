const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('⚡ Initializing Supabase Database tables via Raw SQL...');

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      username TEXT UNIQUE NOT NULL,
      "passwordHash" TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'USER',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      "expireAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.packages (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      name TEXT NOT NULL,
      price DOUBLE PRECISION NOT NULL,
      "durationDays" INTEGER NOT NULL,
      description TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.payment_slips (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      "userId" TEXT NOT NULL,
      "packageId" TEXT NOT NULL,
      amount DOUBLE PRECISION NOT NULL,
      "slipUrl" TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      note TEXT,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.system_settings (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.bandwidth_logs (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      mac TEXT NOT NULL,
      "userId" TEXT,
      "downloadMb" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "uploadMb" DOUBLE PRECISION NOT NULL DEFAULT 0,
      "sessionStart" TIMESTAMP(3),
      "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.dns_logs (
      id BIGSERIAL PRIMARY KEY,
      mac TEXT,
      "clientIp" TEXT NOT NULL,
      domain TEXT NOT NULL,
      "queriedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('🎉 ALL TABLES CREATED SUCCESSFULLY ON SUPABASE DATABASE!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
