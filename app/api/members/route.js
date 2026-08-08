export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { json } from '@/lib/res';

export async function GET() {
  const { data, error } = await db().from('members').select('*').order('created_at');
  if (error) return json({ error: error.message }, { status: 500 });
  return json(data);
}

export async function POST(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });
  const { name } = await req.json();
  if (!name?.trim()) return json({ error: '名前を入力してください' }, { status: 400 });
  const { data, error } = await db().from('members').insert({ name: name.trim() }).select().single();
  if (error) return json({ error: error.message }, { status: 500 });
  return json(data);
}

export async function DELETE(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await db().from('members').delete().eq('id', id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
