'use client';

import Link from 'next/link';
import { Users, Calendar, MapPin, ArrowRight, BookOpen, Bell, GraduationCap, Link as LinkIcon } from 'lucide-react';
import Header from '@/components/Header';
import Marquee from '@/components/Marquee';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      // Fetch announcements
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('date', { ascending: false })
        .limit(3);
      if (annData) setAnnouncements(annData);

      // Fetch events
      const { data: evData } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true })
        .limit(3);
      if (evData) setEvents(evData);
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />
      <Marquee />

      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="relative py-20 overflow-hidden flex flex-col items-center justify-center text-center px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.15),transparent_50%)]"></div>
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="h-32 w-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
              {/* Placeholder for Medical College Logo */}
              <span className="text-black font-bold text-4xl">DjMC</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
              Dinajpur Medical College
            </h1>
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-3xl md:text-5xl font-bold text-blue-400">DjMC 35</h2>
              <h2 className="text-4xl md:text-6xl font-bold text-blue-400 font-bengali mt-2">প্রত্যুষ্মান ৩৫</h2>
            </div>
          </div>
        </section>

        {/* Section 2: Info Bar */}
        <section className="py-8 border-y border-white/5 bg-zinc-900/30">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <Users className="h-8 w-8 text-blue-400 mb-2" />
                <span className="text-2xl font-bold text-white">200</span>
                <span className="text-sm text-zinc-400 uppercase tracking-wider">Students</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <GraduationCap className="h-8 w-8 text-emerald-400 mb-2" />
                <span className="text-2xl font-bold text-white">1992</span>
                <span className="text-sm text-zinc-400 uppercase tracking-wider">Established</span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900/50 border border-white/5">
                <Calendar className="h-8 w-8 text-purple-400 mb-2" />
                <span className="text-2xl font-bold text-white">25-26</span>
                <span className="text-sm text-zinc-400 uppercase tracking-wider">Session</span>
              </div>
            </div>
            
            <div className="mt-10 flex justify-center">
              <Link
                href="/about"
                className="group flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-black transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] active:scale-95"
              >
                About Our Batch
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </section>

        {/* Section 3: Announcements & Events */}
        <section className="py-20 max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Announcements (Wider) */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Bell className="h-6 w-6 text-blue-400" />
                  Announcements
                </h3>
                <Link href="/announcements" className="text-sm font-medium text-blue-400 hover:text-blue-300 flex items-center gap-1">
                  See all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {announcements.length > 0 ? announcements.map((ann) => (
                  <Link key={ann.id} href={`/announcements?id=${ann.id}`} className="block p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-colors group">
                    <h4 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">{ann.title}</h4>
                    <p className="mt-2 text-zinc-400 line-clamp-2">{ann.content}</p>
                    <div className="mt-4 text-xs text-zinc-500">
                      {new Date(ann.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </Link>
                )) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
                    <p className="text-zinc-500">No recent announcements</p>
                  </div>
                )}
              </div>
            </div>

            {/* Events */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-purple-400" />
                  Upcoming Events
                </h3>
                <Link href="/announcements?tab=events" className="text-sm font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1">
                  See all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              
              <div className="space-y-4">
                {events.length > 0 ? events.map((event) => (
                  <Link key={event.id} href={`/announcements?id=${event.id}&type=event`} className="block p-5 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                        <span className="text-xs font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-lg font-bold leading-none">{new Date(event.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white group-hover:text-purple-400 transition-colors">{event.title}</h4>
                        <div className="mt-2 flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">{event.location || 'TBA'}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )) : (
                  <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
                    <p className="text-zinc-500">No upcoming events</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Resources */}
        <section className="py-20 bg-zinc-900/30 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12">
              <div>
                <h3 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
                  <BookOpen className="h-8 w-8 text-emerald-400" />
                  Academic Resources
                </h3>
                <p className="text-zinc-400">Access class lectures, books, slides, and miscellaneous materials.</p>
              </div>
              <Link
                href="/resources"
                className="mt-6 md:mt-0 inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-zinc-700 hover:scale-105"
              >
                Browse Gallery
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['Books', 'Lectures', 'Slides', 'Miscellaneous'].map((category, i) => (
                <Link key={category} href={`/resources?category=${category.toLowerCase()}`} className="group relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/5 p-6 hover:border-white/20 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <h4 className="text-lg font-semibold text-white relative z-10 group-hover:text-emerald-400 transition-colors">{category}</h4>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
