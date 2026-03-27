'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle, XCircle, ShieldAlert, Trash2, Plus, Image as ImageIcon, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface ProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  district: string;
  hscBatch: string;
  admissionRoll: string;
  bloodGroup: string;
  college: string;
  phone: string;
  is_approved: boolean;
}

interface GalleryImage {
  id: string;
  url: string;
}

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profiles, setProfiles] = useState<ProfileProps[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageCategory, setNewImageCategory] = useState('General');
  const [isGalleryLoading, setIsGalleryLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const fetchGallery = async () => {
    try {
      const res = await fetch('/api/gallery');
      if (res.ok) {
        const data = await res.json();
        setGalleryImages(data.images || []);
      }
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/profiles', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      const data = await res.json();
      setProfiles(data.profiles);
      setIsAuthenticated(true);
      fetchGallery();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch('/api/admin/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to approve');

      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this profile?')) return;
    
    try {
      const res = await fetch('/api/admin/reject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to reject');

      setProfiles(profiles.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddGalleryImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImageUrl) return;
    
    setIsGalleryLoading(true);
    try {
      const urlWithCategory = `${newImageUrl}#category=${encodeURIComponent(newImageCategory)}`;
      const res = await fetch('/api/admin/gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ url: urlWithCategory }),
      });

      if (!res.ok) throw new Error('Failed to add image');

      const data = await res.json();
      setGalleryImages([...galleryImages, data.image]);
      setNewImageUrl('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleDeleteGalleryImage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to delete image');

      setGalleryImages(galleryImages.filter(img => img.id !== id));
      setSelectedImages(selectedImages.filter(selectedId => selectedId !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    if (selectedImages.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) return;

    setIsGalleryLoading(true);
    try {
      const res = await fetch('/api/admin/gallery', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ ids: selectedImages }),
      });

      if (!res.ok) throw new Error('Failed to delete images');

      setGalleryImages(galleryImages.filter(img => !selectedImages.includes(img.id)));
      setSelectedImages([]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsGalleryLoading(false);
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(galleryImages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setGalleryImages(items);

    try {
      await fetch('/api/admin/gallery/reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ orderedIds: items.map(img => img.id) }),
      });
    } catch (err) {
      console.error('Failed to save reordered gallery:', err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access</h1>
            <p className="text-zinc-400 text-sm">Enter the admin password to manage profiles.</p>
          </div>

          <div className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              required
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-xl bg-white py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Login'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Pending Approvals</h1>
            <p className="text-zinc-400 mt-1">Review and approve new student profiles.</p>
          </div>
          <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-full text-sm">
            {profiles.length} pending
          </div>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium text-white">All caught up!</h3>
            <p className="text-zinc-500 mt-2">There are no pending profiles to review.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {profiles.map((profile) => (
              <div key={profile.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-zinc-700">
                  <Image src={profile.photoUrl} alt={profile.name} fill className="object-cover" />
                </div>
                
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="text-lg font-semibold text-white">{profile.name}</h3>
                  <div className="text-sm text-zinc-400 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                    <p>Phone: <span className="text-zinc-300">{profile.phone}</span></p>
                    <p>Roll: <span className="text-zinc-300">{profile.admissionRoll}</span></p>
                    <p>College: <span className="text-zinc-300">{profile.college}</span></p>
                    <p>District: <span className="text-zinc-300">{profile.district}</span></p>
                  </div>
                </div>

                <div className="flex w-full sm:w-auto gap-3 pt-4 sm:pt-0 border-t border-white/5 sm:border-t-0">
                  <button
                    onClick={() => handleReject(profile.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                  <button
                    onClick={() => handleApprove(profile.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors font-medium text-sm"
                  >
                    <CheckCircle className="h-4 w-4" /> Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Manage Gallery</h2>
            <div className="flex items-center gap-2">
              {galleryImages.length > 0 && (
                <button
                  onClick={() => {
                    if (selectedImages.length === galleryImages.length) {
                      setSelectedImages([]);
                    } else {
                      setSelectedImages(galleryImages.map(img => img.id));
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors font-medium text-sm"
                >
                  {selectedImages.length === galleryImages.length ? 'Deselect All' : 'Select All'}
                </button>
              )}
              {selectedImages.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={isGalleryLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors font-medium text-sm"
                >
                  {isGalleryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Delete Selected ({selectedImages.length})
                </button>
              )}
            </div>
          </div>
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <form onSubmit={handleAddGalleryImage} className="flex flex-col sm:flex-row gap-4 mb-8">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Direct Image URL (e.g., from postimages.org or imgur.com)"
                className="flex-1 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                required
              />
              <select
                value={newImageCategory}
                onChange={(e) => setNewImageCategory(e.target.value)}
                className="w-full sm:w-48 rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              >
                <option value="General">General</option>
                <option value="Events">Events</option>
                <option value="Memories">Memories</option>
                <option value="Campus">Campus</option>
              </select>
              <button
                type="submit"
                disabled={isGalleryLoading}
                className="rounded-xl bg-white px-6 py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap h-fit"
              >
                {isGalleryLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
                Add Image
              </button>
            </form>

            {galleryImages.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
                <ImageIcon className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500">No images in the gallery yet.</p>
              </div>
            ) : (
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="gallery" direction="horizontal">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="flex flex-wrap gap-4"
                    >
                      {galleryImages.map((img, index) => (
                        <Draggable key={img.id} draggableId={img.id} index={index}>
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className="group relative aspect-video w-[calc(50%-0.5rem)] sm:w-[calc(33.333%-0.667rem)] md:w-[calc(25%-0.75rem)] rounded-xl overflow-hidden border border-white/10 bg-zinc-800"
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img.url} alt="Gallery image" className="object-cover w-full h-full" />
                              
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="h-10 w-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors cursor-grab active:cursor-grabbing"
                                  title="Drag to reorder"
                                >
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <button
                                  onClick={() => handleDeleteGalleryImage(img.id)}
                                  className="h-10 w-10 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                  title="Delete image"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </div>

                              <div className="absolute top-2 left-2 z-10">
                                <input
                                  type="checkbox"
                                  checked={selectedImages.includes(img.id)}
                                  onChange={() => toggleImageSelection(img.id)}
                                  className="h-5 w-5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500/20 cursor-pointer"
                                />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}
          </div>
        </div>

        <div className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-white">Manage Content</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a href="/admin/content" className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-colors group">
              <h3 className="font-bold text-white group-hover:text-blue-400">Content Management</h3>
              <p className="text-sm text-zinc-400 mt-1">Add, edit, and delete announcements, events, and resources.</p>
            </a>
            <a href="/admin/polls" className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 hover:border-white/20 transition-colors group">
              <h3 className="font-bold text-white group-hover:text-blue-400">Manage Polls</h3>
              <p className="text-sm text-zinc-400 mt-1">Create, edit, publish, and close polls for the batch to vote on.</p>
            </a>
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5">
              <h3 className="font-bold text-white">Marquee Notice</h3>
              <p className="text-sm text-zinc-400 mt-1 mb-4">You can set an announcement as a marquee notice in the Content Management section.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
