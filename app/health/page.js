export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';
import { normalizeUrl, normalizeKey } from '@/lib/supabase';

async function check() {
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = normalizeUrl(rawUrl);
  const key = normalizeKey(rawKey);

  const env = [
    ['SUPABASE_URL (実際に使う値)', url || 'NG 未設定'],
    ['SUPABASE_URL の文字数', rawUrl ? String(rawUrl.length) + ' 文字' : '—'],
    ['SUPABASE_SERVICE_ROLE_KEY', key ? key.slice(0, 10) + '... (' + key.length + '文字)' : 'NG 未設定'],
    ['ADMIN_PASSWORD', process.env.ADMIN_PASSWORD ? 'OK 設定済み' : 'NG 未設定'],
  ];

  const results = [];
  if (!url || !key) {
    results.push(['接続', 'Vercelの環境変数が未設定です']);
    return { env, results, months: [] };
  }

  // 1) 素のHTTP疎通
  try {
    const r = await fetch(url + '/rest/v1/', { headers: { apikey: key }, cache: 'no-store' });
    results.push(['疎通テスト', 'HTTP ' + r.status + (r.ok ? ' OK' : ' (キーが違う可能性)')]);
  } catch (e) {
    results.push(['疎通テスト', '失敗: ' + String(e.message) + ' → URLが間違っている可能性大']);
    return { env, results, months: [] };
  }

  // 2) 各テーブル
  const s = createClient(url, key, { auth: { persistSession: false } });
  for (const t of ['members', 'availability', 'fixed_rules', 'shifts']) {
    try {
      const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
      results.push([t, error ? 'エラー: ' + error.message : count + ' 件']);
    } catch (e) {
      results.push([t, '例外: ' + String(e.message)]);
    }
  }

  // 2-b) 追加機能のSQLが実行済みか(fixed_rules.kind 列があるかで判定)
  try {
    const { error } = await s.from('fixed_rules').select('kind', { count: 'exact', head: true });
    results.push([
      '追加SQL (migrations/001)',
      error ? '未実行 → SupabaseのSQL Editorで supabase/migrations/001_add_off_and_rule_kind.sql を実行してください' : 'OK 実行済み',
    ]);
  } catch (e) {
    results.push(['追加SQL (migrations/001)', '確認できませんでした: ' + String(e.message)]);
  }

  // 3) シフトが「どの月」に入っているかの内訳
  const months = [];
  const { data: rows, error: rowErr } = await s.from('shifts').select('date, slot, locked, members(name)').order('date');
  if (rowErr) {
    months.push(['エラー', rowErr.message]);
  } else {
    const byMonth = {};
    for (const r of rows || []) {
      const key = String(r.date).slice(0, 7);
      byMonth[key] = byMonth[key] || { n: 0, named: 0 };
      byMonth[key].n++;
      if (r.members?.name) byMonth[key].named++;
    }
    for (const k of Object.keys(byMonth).sort()) {
      months.push([k, byMonth[k].n + ' 枠 (名前が入っている: ' + byMonth[k].named + ')']);
    }
    if (!months.length) months.push(['—', 'シフトが1件もありません']);
    const sample = (rows || []).slice(-3).map((r) => r.date + ' ' + r.slot + ' ' + (r.members?.name || '(名前なし)'));
    months.push(['最新3件', sample.join(' / ') || '—']);
  }

  return { env, results, months };
}

export default async function Health() {
  const { env, results, months = [] } = await check();
  return (
    <div>
      <h1>接続診断</h1>
      <div className="card">
        <h2>環境変数</h2>
        <ul className="plain">
          {env.map(([k, v]) => <li key={k}><span>{k}</span><span style={{ textAlign: 'right' }}>{v}</span></li>)}
        </ul>
      </div>
      <div className="card">
        <h2>接続テスト</h2>
        <ul className="plain">
          {results.map(([k, v], i) => <li key={i}><span>{k}</span><span style={{ textAlign: 'right' }}>{v}</span></li>)}
        </ul>
      </div>
      <div className="card">
        <h2>シフトが入っている月</h2>
        <ul className="plain">
          {months.map(([k, v], i) => <li key={i}><span>{k}</span><span style={{ textAlign: 'right' }}>{v}</span></li>)}
        </ul>
      </div>
    </div>
  );
}
