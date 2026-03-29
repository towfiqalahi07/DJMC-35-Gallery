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

    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('info_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (requestsError) throw requestsError;

    const { data: submissions, error: submissionsError } = await supabaseAdmin
      .from('collected_info')
      .select('*')
      .order('created_at', { ascending: false });

    if (submissionsError) throw submissionsError;

    return NextResponse.json({ requests, submissions });
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
    const { title, description, field_type, target_column, options, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('info_requests')
      .insert([{ title, description, field_type, target_column, options, is_active }])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data });
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
    const { id, title, description, field_type, target_column, options, is_active } = body;

    const { data, error } = await supabaseAdmin
      .from('info_requests')
      .update({ title, description, field_type, target_column, options, is_active })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ request: data });
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

    const { error } = await supabaseAdmin
      .from('info_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
