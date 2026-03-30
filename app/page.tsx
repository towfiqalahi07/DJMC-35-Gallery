'use client';

import Link from 'next/link';
import { Users, Calendar, MapPin, ArrowRight, BookOpen, Bell, GraduationCap, Link as LinkIcon, LogIn } from 'lucide-react';
import Marquee from '@/components/Marquee';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    async function fetchData() {
      // Fetch announcements
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
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

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
  };

  return (
    <>
      <Marquee />

      <main className="flex-1">
        {/* Section 1: Hero */}
        <section className="relative min-h-[75vh] md:min-h-[85vh] flex flex-col items-center justify-center overflow-hidden px-4 pt-16 md:pt-24 pb-20">
          {/* Background Effects */}
          <div className="absolute inset-0 w-full h-full bg-black">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
          </div>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center max-w-4xl mx-auto text-center mt-0 md:mt-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs md:text-sm font-medium text-blue-300 mb-6 md:mb-8 backdrop-blur-sm shadow-2xl">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Batch 35 Unofficial Portal
            </div>

            {/* Logo */}
            <div className="relative group mb-6 md:mb-8">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative h-24 w-24 md:h-28 md:w-28 bg-zinc-900 border border-white/10 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-white font-bold text-2xl md:text-3xl tracking-tighter">DjMC</span>
              </div>
            </div>
            
            {/* Typography */}
            <h1 className="text-4xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 tracking-tight mb-4 md:mb-6">
              Dinajpur Medical College
            </h1>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mb-6 md:mb-8">
              <h2 className="text-2xl md:text-4xl font-bold text-blue-400">DjMC 35</h2>
              <div className="hidden md:block w-1.5 h-1.5 rounded-full bg-zinc-600"></div>
              <h2 className="text-3xl md:text-5xl font-bold text-purple-400 font-bengali" suppressHydrationWarning>প্রত্যুষ্মান ৩৫</h2>
            </div>

            <p className="text-base md:text-xl text-zinc-400 max-w-2xl mb-10 md:mb-12 leading-relaxed px-4 md:px-0">
              Welcome to the official portal for Batch 35. Stay updated with announcements, upcoming events, and access academic resources all in one place.
            </p>

            {/* CTA */}
            {!user ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <button
                  onClick={handleSignIn}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <LogIn className="h-5 w-5 relative z-10" />
                  <span className="relative z-10">Sign In to Access Profile</span>
                </button>
                <Link href="/announcements" className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-800/50 border border-white/10 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-zinc-800 hover:border-white/20 backdrop-blur-sm">
                  View Announcements
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/profile" className="group relative inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95 overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-purple-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRight className="h-4 w-4 relative z-10 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            )}
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
                {announcements.length > 0 ? announcements.map((ann) => {
                  let title = ann.title;
                  let category = 'General';
                  const match = title.match(/^\[(.*?)\]\s*(.*)$/);
                  if (match) {
                    category = match[1];
                    title = match[2];
                  }
                  return (
                    <Link key={ann.id} href={`/announcements?id=${ann.id}`} className="group relative block p-6 rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-blue-500/10 overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {ann.is_pinned && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                              Pinned
                            </span>
                          )}
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            category === 'Urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {category}
                          </span>
                        </div>
                        <span className="text-xs font-medium text-zinc-500 shrink-0">
                          {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <h4 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2 line-clamp-1">{title}</h4>
                      <p className="text-zinc-400 line-clamp-2 leading-relaxed text-sm">{ann.content}</p>
                    </Link>
                  );
                }) : (
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
                {events.length > 0 ? events.map((event) => {
                  let title = event.title;
                  let tag = 'Upcoming';
                  const match = title.match(/^\[(.*?)\]\s*(.*)$/);
                  if (match) {
                    tag = match[1];
                    title = match[2];
                  }
                  return (
                    <Link key={event.id} href={`/announcements?id=${event.id}&type=event`} className="group relative block overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-purple-500/10">
                      {event.cover_photo_url ? (
                        <div className="w-full h-48 relative overflow-hidden">
                          <img src={event.cover_photo_url} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/20 to-transparent"></div>
                          <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-12 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 relative overflow-hidden bg-gradient-to-br from-purple-900/20 to-zinc-900">
                           <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-12 h-14 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 text-white shadow-xl">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                            <span className="text-xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className={`p-6 ${event.cover_photo_url ? 'pt-2' : 'pt-4'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            tag === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            tag === 'Delayed' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                            tag === 'Past' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {tag}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors mb-2 line-clamp-1">{title}</h4>
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <MapPin className="h-4 w-4 text-purple-400/70" />
                          <span className="truncate">{event.location || 'TBA'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                }) : (
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
    </>
  );
}
