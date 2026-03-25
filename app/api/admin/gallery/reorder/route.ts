import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

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
    const { orderedIds } = await req.json();
    if (!orderedIds || !Array.isArray(orderedIds)) {
      return NextResponse.json({ error: 'orderedIds array is required' }, { status: 400 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Update created_at to reorder items. We'll use the current time and subtract milliseconds based on the index
    // so that the first item has the oldest timestamp (or newest, depending on how it's sorted).
    // The gallery route sorts by created_at ascending.
    // So the first item should have the oldest created_at.
    const now = Date.now();
    
    const updates = orderedIds.map((id, index) => {
      // Add index * 1000 milliseconds to ensure they are sorted ascending
      const newDate = new Date(now + index * 1000).toISOString();
      return supabaseAdmin
        .from('gallery_images')
        .update({ created_at: newDate })
        .eq('id', id);
    });

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
