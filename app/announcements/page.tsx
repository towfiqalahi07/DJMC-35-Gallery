'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Bell, Calendar, MapPin, Loader2, X, Paperclip } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

function AnnouncementsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'events' ? 'events' : 'announcements';
  const initialId = searchParams.get('id');
  const initialType = searchParams.get('type') || 'announcement';

  const [activeTab, setActiveTab] = useState<'announcements' | 'events'>(initialTab);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .order('is_pinned', { ascending: false, nullsFirst: false })
        .order('date', { ascending: false });
      if (annData) {
        setAnnouncements(annData);
        if (initialId && initialType === 'announcement') {
          const item = annData.find(a => a.id === initialId);
          if (item) setSelectedItem({ ...item, type: 'announcement' });
        }
      }

   const { data: evData } = await supabase.from('events').select('*');
      if (evData) {
        const now = new Date();
        const upcoming = evData
          .filter(e => new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const past = evData
          .filter(e => new Date(e.date) < now)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          
        const sortedEvents = [...upcoming, ...past];
        setEvents(sortedEvents);
        
        if (initialId && initialType === 'event') {
          const item = sortedEvents.find(e => e.id === initialId);
          if (item) setSelectedItem({ ...item, type: 'event' });
        }
      }
      setIsLoading(false);
    }
    fetchData();
  }, [initialId, initialType]);

  const closeModal = () => {
    setSelectedItem(null);
    // Optional: remove query params from URL without refreshing
    window.history.replaceState({}, '', '/announcements');
  };

  return (
    <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
      <h1 className="text-4xl font-bold text-white mb-8">Notice Board</h1>

      <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab('announcements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'announcements' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bell className="h-4 w-4" />
          Announcements
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'events' ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Calendar className="h-4 w-4" />
          Events
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : activeTab === 'announcements' ? (
        <div className="space-y-4">
          {announcements.map((ann) => {
            let title = ann.title;
            let category = 'General';
            const match = title.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              category = match[1];
              title = match[2];
            }
            return (
              <div 
                key={ann.id} 
                onClick={() => setSelectedItem({ ...ann, type: 'announcement', parsedTitle: title, parsedCategory: category })}
                className="group relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-zinc-900/40 border border-white/10 cursor-pointer hover:border-blue-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-blue-500/10"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-3 order-2 sm:order-1">
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
                  <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                    <span className="text-sm font-medium text-zinc-500 flex items-center gap-1.5">
                      <Bell className="w-4 h-4" />
                      {new Date(ann.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {ann.attachment_url && <Paperclip className="h-5 w-5 text-zinc-500 shrink-0 group-hover:text-blue-400 transition-colors" />}
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-white group-hover:text-blue-300 transition-colors mb-3">{title}</h3>
                <p className="text-zinc-400 whitespace-pre-wrap line-clamp-3 leading-relaxed">{ann.content}</p>
              </div>
            );
          })}
          {announcements.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
              <p className="text-zinc-500">No announcements found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => {
            let title = event.title;
            let tag = 'Upcoming';
            const match = title.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              tag = match[1];
              title = match[2];
            }
            return (
              <div 
                key={event.id} 
                onClick={() => setSelectedItem({ ...event, type: 'event', parsedTitle: title, parsedTag: tag })}
                className="group relative overflow-hidden rounded-3xl bg-zinc-900/40 border border-white/10 flex flex-col sm:flex-row cursor-pointer hover:border-purple-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-purple-500/10"
              >
                {event.cover_photo_url ? (
                  <div className="w-full sm:w-2/5 md:w-1/3 h-56 sm:h-auto relative overflow-hidden shrink-0">
                    <img src={event.cover_photo_url} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-zinc-900/90 sm:from-zinc-900/50 to-transparent"></div>
                    
                    <div className="absolute top-4 left-4 flex flex-col items-center justify-center w-14 h-16 rounded-2xl bg-black/50 backdrop-blur-md border border-white/10 text-white shadow-xl">
                      <span className="text-xs font-bold uppercase tracking-widest text-purple-300">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                      <span className="text-2xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                    </div>
                  </div>
                ) : (
                  <div className="hidden sm:flex flex-col items-center justify-center w-32 bg-gradient-to-br from-purple-900/20 to-zinc-900/50 border-r border-white/5 shrink-0">
                    <span className="text-sm font-bold uppercase tracking-widest text-purple-400">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                    <span className="text-4xl font-bold text-white mt-1">{new Date(event.date).getDate()}</span>
                  </div>
                )}

                <div className="p-6 sm:p-8 flex-1 flex flex-col justify-center relative">
                  {!event.cover_photo_url && (
                    <div className="sm:hidden flex items-center gap-3 mb-4">
                       <div className="flex flex-col items-center justify-center w-12 h-14 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl font-bold leading-none">{new Date(event.date).getDate()}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-start gap-4 mb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        tag === 'Cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                        tag === 'Delayed' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        tag === 'Past' ? 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {tag}
                      </span>
                    </div>
                    {event.attachment_url && <Paperclip className="h-5 w-5 text-zinc-500 shrink-0 group-hover:text-purple-400 transition-colors" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors mb-3">{title}</h3>
                  <p className="text-zinc-400 whitespace-pre-wrap mb-6 line-clamp-2 leading-relaxed">{event.description}</p>
                  
                  <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-zinc-500 mt-auto">
                    <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                      <Calendar className="h-4 w-4 text-purple-400" />
                      <span className="text-zinc-300">{new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-lg border border-white/5">
                        <MapPin className="h-4 w-4 text-purple-400" />
                        <span className="text-zinc-300">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
              <p className="text-zinc-500">No upcoming events.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl">
            <div className="sticky top-0 bg-zinc-900/90 backdrop-blur-md border-b border-white/5 p-6 flex items-start justify-between">
              <div className="flex items-center gap-3 pr-8">
                <h2 className="text-2xl font-bold text-white">{selectedItem.parsedTitle || selectedItem.title}</h2>
                {selectedItem.type === 'announcement' && selectedItem.parsedCategory && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.parsedCategory === 'Urgent' ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                  }`}>
                    {selectedItem.parsedCategory}
                  </span>
                )}
                {selectedItem.type === 'event' && selectedItem.parsedTag && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    selectedItem.parsedTag === 'Cancelled' ? 'bg-red-500/10 text-red-400' :
                    selectedItem.parsedTag === 'Delayed' ? 'bg-orange-500/10 text-orange-400' :
                    selectedItem.parsedTag === 'Past' ? 'bg-zinc-500/10 text-zinc-400' :
                    'bg-emerald-500/10 text-emerald-400'
                  }`}>
                    {selectedItem.parsedTag}
                  </span>
                )}
              </div>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors absolute right-6 top-6"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {selectedItem.type === 'event' && selectedItem.cover_photo_url && (
                <div className="w-full h-64 rounded-2xl overflow-hidden relative mb-6">
                  <img src={selectedItem.cover_photo_url} alt={selectedItem.parsedTitle || selectedItem.title} className="w-full h-full object-cover" />
                </div>
              )}
              {selectedItem.type === 'event' && (
                <div className="flex flex-wrap items-center gap-4 text-sm font-medium">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400">
                    <Calendar className="h-4 w-4" />
                    {new Date(selectedItem.date).toLocaleString('en-US', { 
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                    })}
                  </div>
                  {selectedItem.location && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                      <MapPin className="h-4 w-4" />
                      {selectedItem.location}
                    </div>
                  )}
                </div>
              )}

              {selectedItem.type === 'announcement' && (
                <div className="flex items-center gap-2 text-sm text-zinc-500">
                  <Bell className="h-4 w-4" />
                  {new Date(selectedItem.date).toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                  })}
                </div>
              )}

              <div className="prose prose-invert max-w-none">
                <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {selectedItem.content || selectedItem.description}
                </p>
              </div>

              {selectedItem.attachment_url && (
                <div className="pt-6 border-t border-white/5">
                  <h4 className="text-sm font-medium text-zinc-400 mb-3 flex items-center gap-2">
                    <Paperclip className="h-4 w-4" /> Attachments
                  </h4>
                  <a 
                    href={selectedItem.attachment_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                  >
                    View Attachment
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AnnouncementsPage() {
  return (
    <>
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }>
        <AnnouncementsContent />
      </Suspense>
    </>
  );
}
