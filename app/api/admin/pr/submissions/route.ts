import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const adminPassword = request.headers.get('x-admin-password');
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('requestId');

    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch the info request to know which columns to look for
    const { data: infoRequest, error: infoReqError } = await supabaseAdmin
      .from('info_requests')
      .select('fields')
      .eq('id', requestId)
      .single();

    if (infoReqError) {
      console.error('Supabase error fetching info request:', infoReqError);
      return NextResponse.json({ error: infoReqError.message }, { status: 500 });
    }

    const targetColumns = infoRequest?.fields?.map((f: any) => f.target_column).filter(Boolean) || [];

    // Fetch from collected_info
    let query = supabaseAdmin.from('collected_info').select('*');
    
    // Only get rows where at least one target column is not null
    if (targetColumns.length > 0) {
      const orQuery = targetColumns.map((col: string) => `${col}.not.is.null`).join(',');
      query = query.or(orQuery);
    }

    const { data: submissions, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error fetching submissions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Format for the frontend
    const formattedSubmissions = submissions?.map(sub => {
      // Extract the specific fields for this request
      const requestData: any = {};
      infoRequest?.fields?.forEach((f: any) => {
        if (f.target_column && sub[f.target_column] !== undefined && sub[f.target_column] !== null) {
          requestData[f.name] = sub[f.target_column];
        }
      });

      return {
        id: sub.id,
        user_id: sub.user_id,
        created_at: sub.created_at,
        students: {
          name: sub.name,
          email: sub.email,
          phone: sub.phone,
          admission_roll: sub.admission_roll,
          class_roll: sub.class_roll
        },
        data: requestData
      };
    }) || [];

    return NextResponse.json({ submissions: formattedSubmissions });
  } catch (error) {
    console.error('Error in GET submissions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
