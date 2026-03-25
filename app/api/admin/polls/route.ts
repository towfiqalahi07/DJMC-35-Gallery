import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Supabase service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ polls: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, options, is_published, is_open } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('polls')
      .insert([{ title, description, options, is_published, is_open }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ poll: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, description, options, is_published, is_open } = body;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabaseAdmin
      .from('polls')
      .update({ title, description, options, is_published, is_open })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ poll: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
