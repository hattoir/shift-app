export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await db().from('fixed_rules').select('*, members(name)').order('weekday');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { member_id, weekday, slot } = await req.json();
  const { data, error } = await db().from('fixed_rules')
    .upsert({ member_id, weekday, slot }, { onConflict: 'member_id,weekday' }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await db().from('fixed_rules').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
