import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tok = searchParams.get('tok');
  const redir = searchParams.get('redir') || 'https://www.google.com';
  const username = searchParams.get('username');

  if (!tok) {
    return NextResponse.json({ success: false, message: 'Missing OpenNDS Token' }, { status: 400 });
  }

  // OpenNDS Router default gateway auth address
  const routerIp = process.env.OPENNDS_ROUTER_IP || '192.168.2.1';
  const routerPort = process.env.OPENNDS_GATEWAY_PORT || '2050';

  // Format OpenNDS FAS redirect callback URL
  const openndsAuthUrl = `http://${routerIp}:${routerPort}/opennds_auth/?tok=${tok}&redir=${encodeURIComponent(redir)}`;

  return NextResponse.redirect(openndsAuthUrl);
}
