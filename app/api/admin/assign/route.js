import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST { month: '2026-07' } 自動割当
// 優先順位: 1) 手動指定(locked)は保持 2) 固定ルール 3) 希望日から公平に割当
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { month } = await req.json();
  const s = db();
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();
  const from = month + '-01';
  const to = month + '-' + String(daysInMonth).padStart(2, '0');

  const [{ data: avail }, { data: rules }, { data: locked }] = await Promise.all([
    s.from('availability').select('*').gte('date', from).lte('date', to),
    s.from('fixed_rules').select('*'),
    s.from('shifts').select('*').gte('date', from).lte('date', to).eq('locked', true),
  ]);

  // 自動割当分(locked=false)を一旦削除
  await s.from('shifts').delete().gte('date', from).lte('date', to).eq('locked', false);

  const counts = {}; // 公平性: 今月の割当回数
  for (const sh of locked || []) counts[sh.member_id] = (counts[sh.member_id] || 0) + 1;

  const rows = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const date = month + '-' + String(d).padStart(2, '0');
    const weekday = new Date(y, m - 1, d).getDay();
    const takenToday = new Set((locked || []).filter((sh) => sh.date === date).map((sh) => sh.member_id));

    for (const slot of ['early', 'late']) {
      if ((locked || []).some((sh) => sh.date === date && sh.slot === slot)) continue;

      const pick = (list) => {
        const c = list.filter((x) => !takenToday.has(x.member_id) && (x.slot === slot || x.slot === 'both'));
        if (!c.length) return null;
        c.sort((a, b) => (counts[a.member_id] || 0) - (counts[b.member_id] || 0) || Math.random() - 0.5);
        return c[0].member_id;
      };

      // 固定ルール優先、なければ希望日から
      let memberId = pick((rules || []).filter((r) => r.weekday === weekday));
      if (!memberId) memberId = pick((avail || []).filter((a) => a.date === date));

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
