export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { monthRange } from '@/lib/month';
import { NextResponse } from 'next/server';

// GET /api/shifts?month=2026-09
export async function GET(req) {
  const range = monthRange(new URL(req.url).searchParams.get('month'));
  if (!range) return NextResponse.json({ error: 'month が不正です' }, { status: 400 });

  const { data, error } = await db().from('shifts').select('*, members(name)')
    .gte('date', range.from).lte('date', range.to);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
