'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Bell } from 'lucide-react';

export default function Marquee() {
  const [notice, setNotice] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    async function fetchMarquee() {
      const { data } = await supabase
        .from('announcements')
        .select('id, title')
        .eq('is_marquee', true)
        .order('date', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setNotice(data);
      }
    }
    fetchMarquee();
  }, []);

  if (!notice) return null;

  return (
    <div className="bg-red-500/10 border-b border-red-500/20 text-red-400 py-2 px-4 flex items-center overflow-hidden">
      <Bell className="h-4 w-4 mr-3 flex-shrink-0 animate-pulse" />
      <div className="whitespace-nowrap overflow-hidden flex-1 relative">
        <div className="inline-block animate-marquee hover:pause">
          <Link href={`/announcements?id=${notice.id}`} className="hover:underline font-medium">
            {notice.title}
          </Link>
        </div>
      </div>
    </div>
  );
}
