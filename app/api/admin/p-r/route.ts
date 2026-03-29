import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: polls, error: pollsError } = await supabaseAdmin
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false });

    if (pollsError) throw pollsError;

    const { data: votes, error: votesError } = await supabaseAdmin
      .from('votes')
      .select('*');

    if (votesError) throw votesError;

    return NextResponse.json({ polls, votes });
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
    const { title, description, options, is_published, is_open, show_results } = body;

    const { data, error } = await supabaseAdmin
      .from('polls')
      .insert([{ title, description, options, is_published, is_open, show_results }])
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
    const { id, title, description, options, is_published, is_open, show_results } = body;

    const { data, error } = await supabaseAdmin
      .from('polls')
      .update({ title, description, options, is_published, is_open, show_results })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ poll: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    // Also delete associated votes
    await supabaseAdmin.from('votes').delete().eq('poll_id', id);

    const { error } = await supabaseAdmin
      .from('polls')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
