export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// 診断用: /api/health を開くと設定状況が見えます
export async function GET() {
  const env = {
    SUPABASE_URL: process.env.SUPABASE_URL ? 'OK (設定済み)' : 'NG (未設定)',
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK (設定済み)' : 'NG (未設定)',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? 'OK (設定済み)' : 'NG (未設定)',
  };

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ env, db: 'Vercelの環境変数が未設定です' }, { status: 500 });
  }

  const tables = {};
  for (const t of ['members', 'availability', 'fixed_rules', 'shifts']) {
    const { count, error } = await db().from(t).select('*', { count: 'exact', head: true });
    tables[t] = error ? 'エラー: ' + error.message : count + ' 件';
  }
  return NextResponse.json({ env, tables });
}
