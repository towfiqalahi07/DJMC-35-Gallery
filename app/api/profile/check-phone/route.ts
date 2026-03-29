import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: 'Phone is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('phone', phone)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
