export const dynamic = 'force-dynamic';

import { db } from '@/lib/supabase';
import { isAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await db().from('members').select('*').order('created_at');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: '名前を入力してください' }, { status: 400 });
  const { data, error } = await db().from('members').insert({ name: name.trim() }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req) {
  if (!isAdmin()) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await req.json();
  const { error } = await db().from('members').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
