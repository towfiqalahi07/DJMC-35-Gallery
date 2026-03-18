import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ profile: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    
    const payload = {
      user_id: user.id,
      name: body.name,
      email: body.email,
      phone: body.phone,
      hsc_batch: body.hscBatch,
      college: body.college,
      blood_group: body.bloodGroup,
      admission_roll: body.admissionRoll,
      district: body.district,
      whatsapp: body.whatsapp,
      facebook: body.facebook,
      photo_url: body.photo_url,
    };

    // Check if profile exists for this user
    const { data: existingProfile } = await supabaseAdmin
      .from('students')
      .select('id, is_approved')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      const { error } = await supabaseAdmin.from('students').update({
        ...payload,
        is_approved: existingProfile.is_approved // preserve approval status
      }).eq('id', existingProfile.id);
      if (error) throw error;
    } else {
      // Check if phone exists
      const { data: existingPhone } = await supabaseAdmin
        .from('students')
        .select('id, user_id, is_approved')
        .eq('phone', payload.phone)
        .maybeSingle();

      if (existingPhone) {
         if (existingPhone.user_id && existingPhone.user_id !== user.id) {
           return NextResponse.json({ error: 'This phone number is already linked to another account.' }, { status: 400 });
         }
         const { error } = await supabaseAdmin.from('students').update({
            ...payload,
            is_approved: existingPhone.is_approved
         }).eq('id', existingPhone.id);
         if (error) throw error;
      } else {
         const { error } = await supabaseAdmin.from('students').insert([{
            ...payload,
            is_approved: false
         }]);
         if (error) throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
