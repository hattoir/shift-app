export const dynamic = 'force-dynamic';

import { createClient } from '@supabase/supabase-js';

async function check() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const env = [
    ['SUPABASE_URL', url ? 'OK 設定済み (' + url.slice(0, 30) + '...)' : 'NG 未設定'],
    ['SUPABASE_SERVICE_ROLE_KEY', key ? 'OK 設定済み (' + key.slice(0, 12) + '...)' : 'NG 未設定'],
    ['ADMIN_PASSWORD', process.env.ADMIN_PASSWORD ? 'OK 設定済み' : 'NG 未設定'],
  ];

  if (!url || !key) return { env, tables: [['—', 'Vercelの環境変数が未設定のため接続できません']] };

  let s;
  try {
    s = createClient(url, key, { auth: { persistSession: false } });
  } catch (e) {
    return { env, tables: [['接続エラー', String(e.message)]] };
  }

  const tables = [];
  for (const t of ['members', 'availability', 'fixed_rules', 'shifts']) {
    try {
      const { count, error } = await s.from(t).select('*', { count: 'exact', head: true });
      tables.push([t, error ? 'エラー: ' + error.message : count + ' 件']);
    } catch (e) {
      tables.push([t, '例外: ' + String(e.message)]);
    }
  }
  return { env, tables };
}

export default async function Health() {
  const { env, tables } = await check();
  return (
    <div>
      <h1>接続診断</h1>
      <div className="card">
        <h2>環境変数</h2>
        <ul className="plain">
          {env.map(([k, v]) => <li key={k}><span>{k}</span><span>{v}</span></li>)}
        </ul>
      </div>
      <div className="card">
        <h2>データベースのテーブル</h2>
        <ul className="plain">
          {tables.map(([k, v]) => <li key={k}><span>{k}</span><span>{v}</span></li>)}
        </ul>
      </div>
      <p className="legend">このページは診断用です。問題が解決したら消してかまいません。</p>
    </div>
  );
}
