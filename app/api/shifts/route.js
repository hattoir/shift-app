import { db } from '@/lib/supabase';
import { NextResponse } from 'next/server';

// GET /api/shifts?month=2026-07
export async function GET(req) {
  const month = new URL(req.url).searchParams.get('month');
  const { data, error } = await db().from('shifts').select('*, members(name)')
    .gte('date', month + '-01').lte('date', month + '-31');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
