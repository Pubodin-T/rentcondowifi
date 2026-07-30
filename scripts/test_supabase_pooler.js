const { PrismaClient } = require('@prisma/client');

const poolerUrls = [
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-us-east-1.pooler.supabase.com:5432/postgres",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
  "postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
];

async function test() {
  for (const url of poolerUrls) {
    console.log("Testing:", url);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      const count = await prisma.package.count();
      console.log("✅ SUCCESS! Connected to pooler! Packages count:", count);
      console.log("--> EXACT WORKING POOLER URL FOR VERCEL IS:\n", url);
      await prisma.$disconnect();
      return;
    } catch (err) {
      console.log("❌ Failed:", err.message ? err.message.split('\n')[0] : err);
      try { await prisma.$disconnect(); } catch(e) {}
    }
  }
}

test();
