'use client';

import Header from '@/components/Header';
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
      const { data: annData } = await supabase.from('announcements').select('*').order('date', { ascending: false });
      if (annData) {
        setAnnouncements(annData);
        if (initialId && initialType === 'announcement') {
          const item = annData.find(a => a.id === initialId);
          if (item) setSelectedItem({ ...item, type: 'announcement' });
        }
      }

      const { data: evData } = await supabase.from('events').select('*').order('date', { ascending: true });
      if (evData) {
        setEvents(evData);
        if (initialId && initialType === 'event') {
          const item = evData.find(e => e.id === initialId);
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
          {announcements.map((ann) => (
            <div 
              key={ann.id} 
              onClick={() => setSelectedItem({ ...ann, type: 'announcement' })}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <h3 className="text-xl font-bold text-white mb-2">{ann.title}</h3>
                {ann.attachment_url && <Paperclip className="h-5 w-5 text-zinc-500 shrink-0" />}
              </div>
              <p className="text-zinc-400 whitespace-pre-wrap line-clamp-2">{ann.content}</p>
              <div className="mt-4 text-sm text-zinc-500">
                {new Date(ann.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))}
          {announcements.length === 0 && (
            <div className="p-8 text-center rounded-2xl bg-zinc-900/30 border border-white/5 border-dashed">
              <p className="text-zinc-500">No announcements found.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div 
              key={event.id} 
              onClick={() => setSelectedItem({ ...event, type: 'event' })}
              className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 flex flex-col sm:flex-row gap-6 cursor-pointer hover:border-white/20 transition-all"
            >
              <div className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl bg-purple-500/10 text-purple-400 shrink-0">
                <span className="text-sm font-bold uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                <span className="text-2xl font-bold leading-none">{new Date(event.date).getDate()}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold text-white mb-2">{event.title}</h3>
                  {event.attachment_url && <Paperclip className="h-5 w-5 text-zinc-500 shrink-0" />}
                </div>
                <p className="text-zinc-400 whitespace-pre-wrap mb-4 line-clamp-2">{event.description}</p>
                <div className="flex items-center gap-4 text-sm text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {event.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
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
              <h2 className="text-2xl font-bold text-white pr-8">{selectedItem.title}</h2>
              <button 
                onClick={closeModal}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors absolute right-6 top-6"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
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
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col relative">
      <Header />
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      }>
        <AnnouncementsContent />
      </Suspense>
    </div>
  );
}
