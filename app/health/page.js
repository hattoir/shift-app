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
    return { env, results };
  }

  // 1) 素のHTTP疎通
  try {
    const r = await fetch(url + '/rest/v1/', { headers: { apikey: key }, cache: 'no-store' });
    results.push(['疎通テスト', 'HTTP ' + r.status + (r.ok ? ' OK' : ' (キーが違う可能性)')]);
  } catch (e) {
    results.push(['疎通テスト', '失敗: ' + String(e.message) + ' → URLが間違っている可能性大']);
    return { env, results };
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
  return { env, results };
}

export default async function Health() {
  const { env, results } = await check();
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
    </div>
  );
}
