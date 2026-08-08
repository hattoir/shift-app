export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { json } from '@/lib/res';

// POST の受け付け方は2通り
//
// (A) 1日ぶんまとめて  { date, slots: [{ slot, member_id|null, locked }, ...] }
//     編集ダイアログはこちらを使う。早番と遅番を同時に入れ替えても正しく保存できる。
//
// (B) 1枠だけ          { date, slot, member_id|null, locked? }
//
// member_id あり           … その人を割り当てる(locked 省略時は true = 手動指定)
// member_id なし + locked  … 「この枠は空のまま固定」として残す
// member_id なし + !locked … 枠を削除して未定に戻す
export async function POST(req) {
  if (!isAdmin()) return json({ error: '管理者としてログインしてください' }, { status: 401 });

  const body = await req.json();
  const date = body.date;
  if (!date) return json({ error: '日付が指定されていません' }, { status: 400 });

  const raw = Array.isArray(body.slots)
    ? body.slots
    : [{ slot: body.slot, member_id: body.member_id, locked: body.locked }];

  const entries = [];
  for (const e of raw) {
    if (!['early', 'late'].includes(e?.slot)) {
      return json({ error: '枠(早番/遅番)が不正です' }, { status: 400 });
    }
    if (entries.some((x) => x.slot === e.slot)) {
      return json({ error: '同じ枠が2回指定されています' }, { status: 400 });
    }
    entries.push({
      slot: e.slot,
      member_id: e.member_id || null,
      locked: e.locked === undefined ? true : !!e.locked,
    });
  }

  const s = db();

  // --- 同じ日に同じ人が早番と遅番を兼任していないか確認する ---
  // 今回の指定どうし
  const picked = entries.filter((e) => e.member_id).map((e) => e.member_id);
  if (new Set(picked).size !== picked.length) {
    return json({ error: '同じ日の早番と遅番に同じ人は入れられません' }, { status: 400 });
  }
  // 今回さわらない枠に、すでに同じ人が入っていないか
  const untouched = ['early', 'late'].filter((sl) => !entries.some((e) => e.slot === sl));
  if (untouched.length && picked.length) {
    const { data: rows, error: dupErr } = await s.from('shifts')
      .select('slot, member_id').eq('date', date).in('slot', untouched);
    if (dupErr) return json({ error: dupErr.message }, { status: 500 });
    if ((rows || []).some((r) => r.member_id && picked.includes(r.member_id))) {
      return json({ error: '同じ日の早番と遅番に同じ人は入れられません' }, { status: 400 });
    }
  }

  // --- 保存 ---
  // 先に「消す枠」を処理してから「入れる枠」を処理する(入れ替えができるように)
  const toDelete = entries.filter((e) => !e.member_id && !e.locked).map((e) => e.slot);
  const toUpsert = entries.filter((e) => e.member_id || e.locked);

  if (toDelete.length) {
    const { error } = await s.from('shifts').delete().eq('date', date).in('slot', toDelete);
    if (error) return json({ error: error.message }, { status: 500 });
  }

  // 入れ替え(早番と遅番の担当者を交換)のとき unique(date,slot) と衝突しないよう、
  // 変更対象の枠をいったん消してから入れ直す
  if (toUpsert.length) {
    const slots = toUpsert.map((e) => e.slot);
    const { error: e1 } = await s.from('shifts').delete().eq('date', date).in('slot', slots);
    if (e1) return json({ error: e1.message }, { status: 500 });

    const rows = toUpsert.map((e) => ({
      date, slot: e.slot, member_id: e.member_id, locked: e.locked,
    }));
    const { error: e2 } = await s.from('shifts').insert(rows);
    if (e2) return json({ error: e2.message }, { status: 500 });
  }

  return json({ ok: true, date, saved: entries.length });
}
