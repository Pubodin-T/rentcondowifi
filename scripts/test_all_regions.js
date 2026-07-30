const { PrismaClient } = require('@prisma/client');

const regions = [
  "aws-0-ap-southeast-1.pooler.supabase.com",
  "aws-0-ap-southeast-2.pooler.supabase.com",
  "aws-0-ap-northeast-1.pooler.supabase.com",
  "aws-0-ap-northeast-2.pooler.supabase.com",
  "aws-0-ap-south-1.pooler.supabase.com",
  "aws-0-us-east-1.pooler.supabase.com",
  "aws-0-us-west-1.pooler.supabase.com",
  "aws-0-eu-central-1.pooler.supabase.com",
  "aws-0-eu-west-1.pooler.supabase.com",
  "aws-0-sa-east-1.pooler.supabase.com"
];

async function test() {
  for (const host of regions) {
    const url = `postgresql://postgres.zdvavhuvjjqzgswggmyl:Oat1200101876013@${host}:6543/postgres?pgbouncer=true`;
    console.log("Testing:", host);
    const prisma = new PrismaClient({ datasources: { db: { url } } });
    try {
      await prisma.$connect();
      console.log("🎉 SUCCESS!! MATCHING SUPABASE POOLER HOST IS:", host);
      console.log("--> FULL URL FOR VERCEL:\n", url);
      await prisma.$disconnect();
      return;
    } catch (err) {
      if (err.message && !err.message.includes('ENOTFOUND')) {
        console.log(`[Response from ${host}]:`, err.message.split('\n')[0]);
      }
      try { await prisma.$disconnect(); } catch(e) {}
    }
  }
}

test();
