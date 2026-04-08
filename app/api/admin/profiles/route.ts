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

    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const formattedProfiles = data.map(student => ({
      id: student.id,
      name: student.name,
      photoUrl: student.photo_url,
      district: student.district,
      hscBatch: student.hsc_batch,
      admissionRoll: student.admission_roll,
      classRoll: student.class_roll, // <-- ADD THIS LINE
      bloodGroup: student.blood_group,
      college: student.college,
      phone: student.phone,
      is_approved: student.is_approved,
    }));

    return NextResponse.json({ profiles: formattedProfiles });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
