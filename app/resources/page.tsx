'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { BookOpen, Search, Loader2, Link as LinkIcon } from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const { data } = await supabase.from('resources').select('*').order('title');
      if (data) setResources(data);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const categories = ['all', 'books', 'lectures', 'slides', 'miscellaneous'];

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (res.description && res.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || res.category.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl flex items-center gap-4 justify-center md:justify-start">
            <BookOpen className="h-10 w-10 text-emerald-400" />
            Academic Resources
          </h1>
          <p className="mt-4 text-lg text-zinc-400 max-w-2xl">
            A curated collection of books, lecture notes, slides, and other study materials for DjMC 35.
          </p>
        </div>

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search resources..."
              className="w-full rounded-2xl border border-white/10 bg-zinc-900/50 py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-zinc-900/50 text-zinc-400 border border-white/5 hover:border-white/20 hover:text-white'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : filteredResources.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((res) => (
              <a 
                key={res.id} 
                href={res.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex flex-col p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 hover:bg-zinc-900/80 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-medium text-zinc-300 uppercase tracking-wider">
                    {res.category}
                  </span>
                  <LinkIcon className="h-5 w-5 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">{res.title}</h3>
                {res.description && (
                  <p className="text-sm text-zinc-400 line-clamp-3 mt-auto">{res.description}</p>
                )}
              </a>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-zinc-900/50 p-4 mb-4">
              <BookOpen className="h-8 w-8 text-zinc-500" />
            </div>
            <h3 className="text-xl font-semibold text-white">No resources found</h3>
            <p className="mt-2 text-zinc-400">
              Try adjusting your search or category filter.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
