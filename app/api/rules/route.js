export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { json } from '@/lib/res';

export async function GET() {
  const { data, error } = await db().from('fixed_rules').select('*, members(name)').order('weekday');
  if (error) return json({ error: error.message }, { status: 500 });
  // 移行前のデータ(kind なし)は「入れる(assign)」として扱う
  return json((data || []).map((r) => ({ ...r, kind: r.kind || 'assign' })));
}

export async function POST(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });
  const { member_id, weekday, slot, kind } = await req.json();
  if (!member_id) return json({ error: 'メンバーを選んでください' }, { status: 400 });

  const k = kind === 'off' ? 'off' : 'assign';
  const row = {
    member_id,
    weekday,
    // 除外ルールに枠の区別はないので 'both' に固定する
    slot: k === 'off' ? 'both' : slot,
    kind: k,
  };

  const { data, error } = await db().from('fixed_rules')
    .upsert(row, { onConflict: 'member_id,weekday' }).select().single();
  if (error) {
    const hint = /kind/.test(error.message)
      ? '(supabase/migrations のSQLをSupabaseで実行してください)'
      : '';
    return json({ error: error.message + hint }, { status: 500 });
  }
  return json(data);
}

export async function DELETE(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await db().from('fixed_rules').delete().eq('id', id);
  if (error) return json({ error: error.message }, { status: 500 });
  return json({ ok: true });
}
