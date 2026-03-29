import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the user's token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { poll_id, option_id } = body;

    if (!poll_id || !option_id) {
      return NextResponse.json({ error: 'Missing poll_id or option_id' }, { status: 400 });
    }

    // Check if poll is open and published
    const { data: poll, error: pollError } = await supabaseAdmin
      .from('polls')
      .select('is_open, is_published')
      .eq('id', poll_id)
      .single();

    if (pollError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (!poll.is_published || !poll.is_open) {
      return NextResponse.json({ error: 'Poll is closed or not published' }, { status: 403 });
    }

    // Check if user already voted
    const { data: existingVote } = await supabaseAdmin
      .from('votes')
      .select('id')
      .eq('poll_id', poll_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingVote) {
      // Update vote
      const { data, error } = await supabaseAdmin
        .from('votes')
        .update({ option_id })
        .eq('id', existingVote.id)
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ vote: data });
    } else {
      // Insert new vote
      const { data, error } = await supabaseAdmin
        .from('votes')
        .insert([{ poll_id, user_id: user.id, option_id }])
        .select()
        .single();
        
      if (error) throw error;
      return NextResponse.json({ vote: data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
