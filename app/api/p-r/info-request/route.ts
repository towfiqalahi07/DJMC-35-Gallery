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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('students')
      .select('name, phone, email, class_roll, admission_roll')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found. Please complete your profile first.' }, { status: 400 });
    }

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
      name: profile.name,
      phone: profile.phone,
      email: profile.email,
      class_roll: profile.class_roll,
      admission_roll: profile.admission_roll,
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
