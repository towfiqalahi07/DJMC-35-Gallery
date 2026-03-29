import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

const checkAuth = (req: Request) => {
  const adminPassword = req.headers.get('x-admin-password')?.trim();
  let expectedPassword = process.env.ADMIN_PASSWORD || 'djmc35admin';
  expectedPassword = expectedPassword.replace(/^["']|["']$/g, '').trim();
  return adminPassword === expectedPassword;
};

export async function POST(req: Request) {
  if (!checkAuth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const { url, category } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from('gallery_images')
      .insert([{ url, category: category || 'General' }])
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
