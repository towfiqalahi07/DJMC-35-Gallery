import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const checkAuth = (req: Request) => {
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();
  return adminPassword === expectedPassword;
};

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabaseAdmin
      .from('gallery_images')
      .insert([{ url }])
      .select();

    if (error) throw error;
    return NextResponse.json({ image: data[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, ids } = await req.json();
    if (!id && (!ids || !Array.isArray(ids) || ids.length === 0)) {
      return NextResponse.json({ error: 'ID or IDs array is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    let error;
    if (ids && Array.isArray(ids)) {
      const { error: bulkError } = await supabaseAdmin
        .from('gallery_images')
        .delete()
        .in('id', ids);
      error = bulkError;
    } else {
      const { error: singleError } = await supabaseAdmin
        .from('gallery_images')
        .delete()
        .eq('id', id);
      error = singleError;
    }

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
