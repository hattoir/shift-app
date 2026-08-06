export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

// POST { date, slot, member_id | null }  手動指定は locked=true
export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { date, slot, member_id } = await req.json();
  const s = db();
  if (!member_id) {
    const { error } = await s.from('shifts').delete().eq('date', date).eq('slot', slot);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }
  const { error } = await s.from('shifts')
    .upsert({ date, slot, member_id, locked: true }, { onConflict: 'date,slot' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
