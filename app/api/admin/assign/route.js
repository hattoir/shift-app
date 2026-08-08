export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { monthRange } from '@/lib/month';
import { monthLabel } from '@/lib/calendar';
import { json } from '@/lib/res';

// POST { month: '2026-09' } 自動割当
//
// 優先順位:
//   1. locked=true(管理者の手動指定)は絶対に変更しない
//   2. その日 slot='off' の人 / その曜日に除外ルール(kind='off')がある人は絶対に入れない
//   3. 固定ルール(kind='assign')の人を優先
//   4. 残りは希望日から、今月の割当回数が少ない人を優先(公平性)
//   5. 同じ人が同じ日の早番と遅番を兼任しない
export async function POST(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });

  const { month } = await req.json();
  const range = monthRange(month);
  if (!range) return json({ error: 'month が不正です' }, { status: 400 });

  const s = db();
  const [y, m] = month.split('-').map(Number);
  const daysInMonth = new Date(y, m, 0).getDate();

  const [av, ru, lo] = await Promise.all([
    s.from('availability').select('*').gte('date', range.from).lte('date', range.to),
    s.from('fixed_rules').select('*'),
    s.from('shifts').select('*').gte('date', range.from).lte('date', range.to).eq('locked', true),
  ]);
  const firstErr = av.error || ru.error || lo.error;
  if (firstErr) return json({ error: firstErr.message }, { status: 500 });

  const avail = av.data || [];
  const rules = ru.data || [];
  const locked = lo.data || [];

  const kindOf = (r) => r.kind || 'assign'; // 移行前のデータは 'assign' 扱い
  const assignRules = rules.filter((r) => kindOf(r) === 'assign');
  const offRules = rules.filter((r) => kindOf(r) === 'off');

  // 自動割当分(locked=false)を一旦削除。手動指定(locked=true)は残す
  const { error: delErr } = await s.from('shifts').delete()
    .gte('date', range.from).lte('date', range.to).eq('locked', false);
  if (delErr) return json({ error: delErr.message }, { status: 500 });

  // 公平性: 今月の割当回数(手動指定分も数える)
  const counts = {};
  for (const sh of locked) if (sh.member_id) counts[sh.member_id] = (counts[sh.member_id] || 0) + 1;

  const rows = [];
  const skipped = [];
  const SLOT_JA = { early: '早番', late: '遅番' };

  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const weekday = new Date(y, m - 1, d).getDay();

    // 優先順位2: この日に入れない人
    const offToday = new Set();
    for (const a of avail) if (a.date === date && a.slot === 'off') offToday.add(a.member_id);
    for (const r of offRules) if (r.weekday === weekday) offToday.add(r.member_id);

    // 同じ日に二重で入れないための集合(手動指定分から開始)
    const takenToday = new Set(
      locked.filter((sh) => sh.date === date && sh.member_id).map((sh) => sh.member_id)
    );

    for (const slot of ['early', 'late']) {
      if (locked.some((sh) => sh.date === date && sh.slot === slot)) continue; // 優先順位1

      // 優先順位3 → 4 の順に候補を探す
      const fixedIds = assignRules
        .filter((r) => r.weekday === weekday && (r.slot === slot || r.slot === 'both'))
        .map((r) => r.member_id);
      const availIds = avail
        .filter((a) => a.date === date && (a.slot === slot || a.slot === 'both'))
        .map((a) => a.member_id);

      const choose = (ids) => {
        const c = [...new Set(ids)].filter((id) => !offToday.has(id) && !takenToday.has(id));
        if (!c.length) return null;
        c.sort((a, b) => (counts[a] || 0) - (counts[b] || 0) || Math.random() - 0.5);
        return c[0];
      };

      const memberId = choose(fixedIds) || choose(availIds);

      if (memberId) {
        rows.push({ date, slot, member_id: memberId, locked: false });
        counts[memberId] = (counts[memberId] || 0) + 1;
        takenToday.add(memberId);
      } else {
        // なぜ埋まらなかったのかを記録(管理画面で確認できる)
        const all = [...new Set([...fixedIds, ...availIds])];
        let reason;
        if (!all.length) reason = 'この枠に入れる希望・固定ルールが登録されていません';
        else if (all.every((id) => offToday.has(id))) reason = '候補者が全員「入れない」でした';
        else if (all.every((id) => offToday.has(id) || takenToday.has(id)))
          reason = '候補者がもう一方の枠に入っているため';
        else reason = '候補者がいません';
        skipped.push({ date, slot, slotLabel: SLOT_JA[slot], reason });
      }
    }
  }

  if (rows.length) {
    const { error } = await s.from('shifts').insert(rows);
    if (error) return json({ error: error.message }, { status: 500 });
  }

  return json({
    ok: true,
    month,
    monthLabel: monthLabel(month),
    range,
    assigned: rows.length,
    kept: locked.length,
    total: daysInMonth * 2,
    skipped,
  });
}
