export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { monthRange } from '@/lib/month';
import { json } from '@/lib/res';

const SLOTS = ['early', 'late', 'both', 'off'];

// GET /api/availability?month=2026-09[&member_id=xxx]
export async function GET(req) {
  const url = new URL(req.url);
  const range = monthRange(url.searchParams.get('month'));
  if (!range) return json({ error: 'month が不正です' }, { status: 400 });
  const memberId = url.searchParams.get('member_id');

  let q = db().from('availability').select('*').gte('date', range.from).lte('date', range.to);
  if (memberId) q = q.eq('member_id', memberId);
  const { data, error } = await q;
  if (error) return json({ error: error.message }, { status: 500 });
  return json(data);
}

// POST { member_id, month, entries: [{ date, slot }] }
export async function POST(req) {
  const { member_id, month, entries } = await req.json();
  const range = monthRange(month);
  if (!member_id || !range) return json({ error: '入力が不正です' }, { status: 400 });

  const list = (entries || []).filter((e) => e?.date && SLOTS.includes(e.slot));
  if (list.some((e) => e.date < range.from || e.date > range.to)) {
    return json({ error: 'この月以外の日付が含まれています' }, { status: 400 });
  }

  const s = db();
  const { error: e1 } = await s.from('availability').delete()
    .eq('member_id', member_id).gte('date', range.from).lte('date', range.to);
  if (e1) return json({ error: e1.message }, { status: 500 });

  if (list.length) {
    const rows = list.map((e) => ({ member_id, date: e.date, slot: e.slot }));
    const { error: e2 } = await s.from('availability').insert(rows);
    if (e2) {
      const hint = /slot/.test(e2.message)
        ? '(「入れない」を使うには supabase/migrations のSQLをSupabaseで実行してください)'
        : '';
      return json({ error: e2.message + hint }, { status: 500 });
    }
  }
  return json({ ok: true, saved: list.length });
}
