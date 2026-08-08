export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { adminToken } from '@/lib/auth';
import { json } from '@/lib/res';

export async function POST(req) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD) {
    return json({ error: 'ADMIN_PASSWORD が未設定です' }, { status: 500 });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return json({ error: 'パスワードが違います' }, { status: 401 });
  }
  const res = json({ ok: true });
  res.cookies.set('admin_token', adminToken(), {
    httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 30, path: '/',
  });
  return res;
}
