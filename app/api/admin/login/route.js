import { adminToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(req) {
  const { password } = await req.json();
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'パスワードが違います' }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_token', adminToken(), {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
  });
  return res;
}
