const { PrismaClient } = require('@prisma/client');

const urls = [
  "postgresql://postgres:Oat1200101876013@db.zdvavhuvjjqzgswggmyl.supabase.co:5432/postgres?sslmode=require",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
];

async function test() {
  for (const url of urls) {
    console.log("Testing:", url);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log("SUCCESS! CONNECTED TO SUPABASE WITH URL:", url);
      await prisma.$disconnect();
      return url;
    } catch (err) {
      console.log("FAILED:", err.message ? err.message.split('\n')[0] : err);
      await prisma.$disconnect();
    }
  }
}

test();
