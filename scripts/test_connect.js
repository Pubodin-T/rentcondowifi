const { PrismaClient } = require('@prisma/client');

const urls = [
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  "postgresql://postgres:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres",
  "postgresql://postgres:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
];

async function test() {
  for (const url of urls) {
    console.log("Testing URL:", url);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log("SUCCESSFULLY CONNECTED TO DATABASE!");
      console.log("WORKING URL IS:", url);
      await prisma.$disconnect();
      return;
    } catch (err) {
      console.log("Failed:", err.message ? err.message.split('\n')[0] : err);
      await prisma.$disconnect();
    }
  }
}

test();
