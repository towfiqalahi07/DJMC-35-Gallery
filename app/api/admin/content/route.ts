import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

const checkAuth = (req: Request) => {
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();
  return adminPassword === expectedPassword;
};

const ALLOWED_TABLES = ['announcements', 'events', 'resources'];

export async function GET(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { searchParams } = new URL(req.url);
  const table = searchParams.get('table');
  
  if (!table || !ALLOWED_TABLES.includes(table)) {
    return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*')
    .order(table === 'resources' ? 'created_at' : 'date', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { table, payload } = await req.json();
    if (!table || !ALLOWED_TABLES.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .insert([payload])
      .select();

    if (error) throw error;
    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { table, id, payload } = await req.json();
    if (!table || !ALLOWED_TABLES.includes(table) || !id) {
      return NextResponse.json({ error: 'Invalid table or ID' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from(table)
      .update(payload)
      .eq('id', id)
      .select();

    if (error) throw error;
    return NextResponse.json({ data: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { table, id } = await req.json();
    if (!table || !ALLOWED_TABLES.includes(table) || !id) {
      return NextResponse.json({ error: 'Invalid table or ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
