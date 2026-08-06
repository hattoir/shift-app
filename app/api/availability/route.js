export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { monthRange } from '@/lib/month';
import { NextResponse } from 'next/server';

// GET /api/availability?month=2026-09[&member_id=xxx]
export async function GET(req) {
  const url = new URL(req.url);
  const range = monthRange(url.searchParams.get('month'));
  if (!range) return NextResponse.json({ error: 'month が不正です' }, { status: 400 });
  const memberId = url.searchParams.get('member_id');

  let q = db().from('availability').select('*').gte('date', range.from).lte('date', range.to);
  if (memberId) q = q.eq('member_id', memberId);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// POST { member_id, month, entries: [{ date, slot }] }
export async function POST(req) {
  const { member_id, month, entries } = await req.json();
  const range = monthRange(month);
  if (!member_id || !range) return NextResponse.json({ error: '入力が不正です' }, { status: 400 });

  const s = db();
  const { error: e1 } = await s.from('availability').delete()
    .eq('member_id', member_id).gte('date', range.from).lte('date', range.to);
  if (e1) return NextResponse.json({ error: e1.message }, { status: 500 });

  if (entries?.length) {
    const rows = entries.map((e) => ({ member_id, date: e.date, slot: e.slot }));
    const { error: e2 } = await s.from('availability').insert(rows);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
