import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const adminPassword = req.headers.get('x-admin-password')?.trim();
    let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
    expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Profile ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('students')
      .update({ is_approved: true })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
