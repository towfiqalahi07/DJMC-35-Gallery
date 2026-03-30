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

    const { request_id, value, target_column } = await req.json();

    if (!request_id || !target_column) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user profile for metadata
    const { data: profile } = await supabaseAdmin
      .from('students')
      .select('name, phone, email, class_roll, admission_roll')
      .eq('user_id', user.id)
      .maybeSingle();

    const name = profile?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Unknown';
    const email = profile?.email || user.email || 'Unknown';
    const phone = profile?.phone || null;
    const class_roll = profile?.class_roll || null;
    const admission_roll = profile?.admission_roll || null;

    // Check if a record already exists for this user in collected_info
    // We might want to update the existing record or insert a new one.
    // The user said "Store all submissions in a specific Supabase table (e.g., collected_info)".
    // Usually, one row per user is better for "pre-defined columns".
    
    const { data: existingRecord } = await supabaseAdmin
      .from('collected_info')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const submissionData: any = {
      user_id: user.id,
      name,
      phone,
      email,
      class_roll,
      [target_column]: value,
      updated_at: new Date().toISOString(),
    };

    if (existingRecord) {
      const { error: updateError } = await supabaseAdmin
        .from('collected_info')
        .update(submissionData)
        .eq('user_id', user.id);
      
      if (updateError) throw updateError;
    } else {
      const { error: insertError } = await supabaseAdmin
        .from('collected_info')
        .insert([{ ...submissionData, created_at: new Date().toISOString() }]);
      
      if (insertError) throw insertError;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Info Request Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
