export const runtime = 'edge';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user's token
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { request_id, data } = body;

    if (!request_id || !data) {
      return NextResponse.json({ error: 'Missing request_id or data' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check if request is open and published
    const { data: infoRequest, error: reqError } = await supabaseAdmin
      .from('info_requests')
      .select('is_open, is_published')
      .eq('id', request_id)
      .single();

    if (reqError || !infoRequest) {
      return NextResponse.json({ error: 'Info request not found' }, { status: 404 });
    }

    if (!infoRequest.is_published || !infoRequest.is_open) {
      return NextResponse.json({ error: 'Info request is closed or not published' }, { status: 403 });
    }

    // Fetch user profile to get identity metadata
    const { data: profile } = await supabaseAdmin
      .from('students')
      .select('name, phone, email, admission_roll, class_roll')
      .eq('user_id', user.id)
      .maybeSingle();

    // Prepare payload
    const payload: any = {
      request_id,
      user_id: user.id,
      name: profile?.name || '',
      phone: profile?.phone || '',
      email: profile?.email || user.email || '',
      admission_roll: profile?.admission_roll || '',
      class_roll: profile?.class_roll || '',
      ...data // This will map the dynamic columns like col_text_1: 'L'
    };

    // Check if user already submitted
    const { data: existingSubmission } = await supabaseAdmin
      .from('collected_info')
      .select('id')
      .eq('request_id', request_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSubmission) {
      // Update submission
      const { data: updated, error } = await supabaseAdmin
        .from('collected_info')
        .update(payload)
        .eq('id', existingSubmission.id)
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ submission: updated });
    } else {
      // Insert new submission
      const { data: inserted, error } = await supabaseAdmin
        .from('collected_info')
        .insert([payload])
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ submission: inserted });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
