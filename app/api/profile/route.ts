import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const body = await req.json();
    
    // Notice we removed photo_url from here. We will set it conditionally below.
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
      class_roll: body.classRoll,
    };

    // Check if profile exists for this user (Added photo_url to select)
    const { data: existingProfile } = await supabaseAdmin
      .from('students')
      .select('id, is_approved, photo_url')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingProfile) {
      const { error } = await supabaseAdmin.from('students').update({
        ...payload,
        photo_url: existingProfile.photo_url || body.photo_url, // Keep existing or fallback to Google
        is_approved: existingProfile.is_approved // preserve approval status
      }).eq('id', existingProfile.id);
      if (error) throw error;
    } else {
      // Check if phone exists (Added photo_url to select)
      const { data: existingPhone } = await supabaseAdmin
        .from('students')
        .select('id, user_id, is_approved, photo_url')
        .eq('phone', payload.phone)
        .maybeSingle();

      if (existingPhone) {
         if (existingPhone.user_id && existingPhone.user_id !== user.id) {
           return NextResponse.json({ error: 'This phone number is already linked to another account.' }, { status: 400 });
         }
         const { error } = await supabaseAdmin.from('students').update({
            ...payload,
            photo_url: existingPhone.photo_url || body.photo_url, // Keep existing or fallback to Google
            is_approved: existingPhone.is_approved
         }).eq('id', existingPhone.id);
         if (error) throw error;
      } else {
         const { error } = await supabaseAdmin.from('students').insert([{
            ...payload,
            photo_url: body.photo_url, // No existing record, use Google photo
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
