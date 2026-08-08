export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { json } from '@/lib/res';

// 診断用: /api/health を開くと設定状況が見えます
export async function GET() {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'OK (設定済み)' : 'NG (未設定)',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK (設定済み)' : 'NG (未設定)',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'OK (設定済み)' : 'NG (未設定)',
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return json({ env, db: 'Vercelの環境変数が未設定です' }, { status: 500 });
  }

  const tables = {};
  for (const t of ['members', 'availability', 'fixed_rules', 'shifts']) {
    const { count, error } = await db().from(t).select('*', { count: 'exact', head: true });
    tables[t] = error ? 'エラー: ' + error.message : count + ' 件';
  }

  // 追加機能用のSQL(supabase/migrations/001)が実行済みかどうか。
  // fixed_rules.kind 列があれば、同じファイル内の availability の変更も実行済み。
  const kind = await db().from('fixed_rules').select('kind', { head: true, count: 'exact' });
  const migration = {
    'supabase/migrations/001_add_off_and_rule_kind.sql': kind.error
      ? '未実行です。SupabaseのSQL Editorで実行してください (' + kind.error.message + ')'
      : 'OK (実行済み)',
  };

  return json({ env, tables, migration });
}
