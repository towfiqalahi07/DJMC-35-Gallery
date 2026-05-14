import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const roll = searchParams.get('roll');
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

  if (adminPassword !== expectedPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabaseAdmin.from('students').select('*').eq('class_roll', roll).single();
  
  if (error || !data) return NextResponse.json({ error: 'Student not found with this roll' }, { status: 404 });
  return NextResponse.json({ student: data });
}

export async function POST(req: Request) {
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

  if (adminPassword !== expectedPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentId, section, gender } = await req.json();

  // Remove existing CR for this specific section and gender
  await supabaseAdmin.from('students')
    .update({ cr_section: null, cr_gender: null })
    .eq('cr_section', section)
    .eq('cr_gender', gender);

  // Assign the new CR
  const { data, error } = await supabaseAdmin.from('students')
    .update({ cr_section: section, cr_gender: gender })
    .eq('id', studentId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, student: data });
}

export async function DELETE(req: Request) {
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();

  if (adminPassword !== expectedPassword) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { studentId } = await req.json();
  const { error } = await supabaseAdmin.from('students')
    .update({ cr_section: null, cr_gender: null })
    .eq('id', studentId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
