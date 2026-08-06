import { createClient } from '@supabase/supabase-js';

// 環境変数の値に空白・改行・引用符・末尾スラッシュが混ざっていても動くように正規化
export function normalizeUrl(raw) {
  if (!raw) return null;
  let u = String(raw).trim().replace(/^["']|["']$/g, '').replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
  return u;
}

export function normalizeKey(raw) {
  if (!raw) return null;
  return String(raw).trim().replace(/^["']|["']$/g, '').replace(/\s/g, '');
}

export function db() {
  const url = normalizeUrl(process.env.SUPABASE_URL);
  const key = normalizeKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  if (!url || !key) throw new Error('Vercelの環境変数 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が未設定です');
  return createClient(url, key, { auth: { persistSession: false } });
}
