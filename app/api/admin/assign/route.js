export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { monthRange } from '@/lib/month';
import { NextResponse } from 'next/server';

// POST { month: '2026-09' } 自動割当
// 優先順位: 1) 手動指定(locked)は保持 2) 固定ルール 3) 希望日から公平に割当
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: '管理者としてログインしてください' }, { status: 401 });

  const { month } = await req.json();
  const range = monthRange(month);
  if (!range) return NextResponse.json({ error: 'month が不正です' }, { status: 400 });

  const s = db();
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [av, ru, lo] = await Promise.all([
    s.from('availability').select('*').gte('date', range.from).lte('date', range.to),
    s.from('fixed_rules').select('*'),
    s.from('shifts').select('*').gte('date', range.from).lte('date', range.to).eq('locked', true),
  ]);
  const firstErr = av.error || ru.error || lo.error;
  if (firstErr) return NextResponse.json({ error: firstErr.message }, { status: 500 });

  const avail = av.data || [], rules = ru.data || [], locked = lo.data || [];

  // 自動割当分(locked=false)を一旦削除
  const { error: delErr } = await s.from('shifts').delete()
    .gte('date', range.from).lte('date', range.to).eq('locked', false);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  const counts = {}; // 公平性: 今月の割当回数
  for (const sh of locked) counts[sh.member_id] = (counts[sh.member_id] || 0) + 1;

  const rows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const weekday = new Date(y, m - 1, d).getDay();
    const takenToday = new Set(locked.filter((sh) => sh.date === date).map((sh) => sh.member_id));

    for (const slot of ['early', 'late']) {
      if (locked.some((sh) => sh.date === date && sh.slot === slot)) continue;

      const pick = (list) => {
        const c = list.filter((x) => !takenToday.has(x.member_id) && (x.slot === slot || x.slot === 'both'));
        if (!c.length) return null;
        c.sort((a, b) => (counts[a.member_id] || 0) - (counts[b.member_id] || 0) || Math.random() - 0.5);
        return c[0].member_id;
      };

      // 固定ルール優先、なければ希望日から
      let memberId = pick(rules.filter((r) => r.weekday === weekday));
      if (!memberId) memberId = pick(avail.filter((a) => a.date === date));

      if (memberId) {
        rows.push({ date, slot, member_id: memberId, locked: false });
        counts[memberId] = (counts[memberId] || 0) + 1;
        takenToday.add(memberId);
      }
    }
  }

  if (rows.length) {
    const { error } = await s.from('shifts').insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, assigned: rows.length });
}
