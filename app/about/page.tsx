'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { MapPin, Users, Calendar, GraduationCap, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import Image from 'next/image';

export default function AboutPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<{id: string, url: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await fetch('/api/gallery');
        if (response.ok) {
          const data = await response.json();
          if (data.images && data.images.length > 0) {
            setGalleryImages(data.images);
          } else {
            // Fallback if empty
            setGalleryImages([{ id: 'fallback', url: 'https://picsum.photos/seed/djmc1/1200/600' }]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch gallery:', error);
        setGalleryImages([{ id: 'fallback', url: 'https://picsum.photos/seed/djmc1/1200/600' }]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGallery();
  }, []);

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % galleryImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 text-center px-4">
          <div className="h-24 w-24 bg-white rounded-full mx-auto mb-6 flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.1)]">
            <span className="text-black font-bold text-2xl">DjMC</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">About DjMC 35</h1>
          <p className="text-xl text-blue-400 font-bengali italic mb-8">"প্রত্যুষ্মান ৩৫"</p>
          <p className="max-w-2xl mx-auto text-zinc-400 text-lg">
            We are the 35th batch of Dinajpur Medical College. A family of future doctors, united by our passion for medicine and our bond as batchmates.
          </p>
          <div className="mt-8 flex justify-center">
            <a 
              href="https://djmc.edu.bd/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95"
            >
              <Globe className="h-4 w-4" />
              Visit Official Website
            </a>
          </div>
        </section>

        {/* Info Grid */}
        <section className="py-12 bg-zinc-900/30 border-y border-white/5">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <Users className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">200</div>
              <div className="text-sm text-zinc-400">Students</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <GraduationCap className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">1992</div>
              <div className="text-sm text-zinc-400">Established</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <Calendar className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">25-26</div>
              <div className="text-sm text-zinc-400">Session</div>
            </div>
            <div className="text-center p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <MapPin className="h-8 w-8 text-red-400 mx-auto mb-3" />
              <div className="text-2xl font-bold text-white">Dinajpur</div>
              <div className="text-sm text-zinc-400">Location</div>
            </div>
          </div>
        </section>

        {/* Batch Description Box */}
        <section className="py-20 max-w-4xl mx-auto px-4">
          <div className="bg-zinc-900/50 border border-white/10 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
            <p className="text-zinc-300 text-lg leading-relaxed">
              Welcome to the official directory of Dinajpur Medical College Batch 35. 
              We are a vibrant community of future medical professionals dedicated to excellence, 
              compassion, and lifelong learning. This platform serves as a central hub to stay 
              connected, share memories, and support each other throughout our medical journey and beyond.
            </p>
          </div>
        </section>

        {/* Gallery Slider */}
        <section className="pb-20 max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-10">Memories</h2>
          <div className="relative rounded-3xl overflow-hidden bg-zinc-900 border border-white/10 aspect-[16/9] md:aspect-[21/9] group">
            {!isLoading && galleryImages.length > 0 && (
              <Image 
                src={galleryImages[currentImageIndex].url} 
                alt={`Gallery image ${currentImageIndex + 1}`}
                fill
                className="object-cover transition-opacity duration-500"
                referrerPolicy="no-referrer"
              />
            )}
            
            {/* Slider Controls */}
            {galleryImages.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={prevImage}
                  className="h-12 w-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  onClick={nextImage}
                  className="h-12 w-12 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-sm border border-white/10 hover:bg-black/70 transition-colors"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </div>
            )}

            {/* Indicators */}
            {galleryImages.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {galleryImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`h-2 rounded-full transition-all ${idx === currentImageIndex ? 'w-8 bg-white' : 'w-2 bg-white/50'}`}
                    aria-label={`Go to image ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Class Representatives */}
        <section className="py-20 max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Class Representatives</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Placeholder for CRs */}
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
              <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl shrink-0"></div>
              <div>
                <h3 className="text-xl font-bold text-white">CR Name (Male)</h3>
                <p className="text-blue-400 text-sm font-medium mb-2">Class Representative</p>
                <p className="text-zinc-400 text-sm">Contact info will be available here.</p>
              </div>
            </div>
            <div className="flex items-center gap-6 p-6 rounded-3xl bg-zinc-900/50 border border-white/5">
              <div className="h-24 w-24 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl shrink-0"></div>
              <div>
                <h3 className="text-xl font-bold text-white">CR Name (Female)</h3>
                <p className="text-pink-400 text-sm font-medium mb-2">Class Representative</p>
                <p className="text-zinc-400 text-sm">Contact info will be available here.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Location & Get in Touch */}
        <section className="py-20 bg-zinc-900/30 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Get in Touch</h2>
              <p className="text-zinc-400 mb-8">
                Have questions or need to reach out to the batch administration? Use the links below.
              </p>
              <div className="space-y-4">
                <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" /></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Official Facebook Group</h4>
                    <p className="text-sm text-zinc-500">Join our community</p>
                  </div>
                </a>
                <a href="#" className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-900/80 border border-white/5 hover:border-white/20 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Official WhatsApp Group</h4>
                    <p className="text-sm text-zinc-500">For urgent updates</p>
                  </div>
                </a>
              </div>
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">Location</h2>
              <div className="aspect-video w-full rounded-2xl overflow-hidden border border-white/10 bg-zinc-800">
                <iframe 
                  src="https://maps.google.com/maps?q=M.%20Abdur%20Rahim%20Medical%20College,%20Dinajpur&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                ></iframe>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
