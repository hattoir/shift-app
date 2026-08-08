export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { db } from '@/lib/supabase';
import { monthRange } from '@/lib/month';
import { json } from '@/lib/res';

// GET /api/shifts?month=2026-09
export async function GET(req) {
  const range = monthRange(new URL(req.url).searchParams.get('month'));
  if (!range) return json({ error: 'month が不正です' }, { status: 400 });

  const { data, error } = await db().from('shifts').select('*, members(name)')
    .gte('date', range.from).lte('date', range.to);
  if (error) return json({ error: error.message }, { status: 500 });
  return json(data);
}
