'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, ShieldAlert, Bell, Calendar, BookOpen, X, CheckCircle, XCircle } from 'lucide-react';

type ContentType = 'announcements' | 'events' | 'resources';

export default function AdminContentPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('announcements');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: ContentType } | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const [formData, setFormData] = useState<any>({});

  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
        }),
      });

      if (!res.ok) throw new Error('Failed to get upload URL');
      const { signedUrl, publicUrl } = await res.json();

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload file');

      setFormData({ ...formData, [field]: publicUrl });
      setMessage({ type: 'success', text: 'File uploaded successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // We can use the gallery auth endpoint just to verify password
      const res = await fetch('/api/admin/profiles', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      setIsAuthenticated(true);
      fetchData(activeTab);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchData = async (table: ContentType) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/content?table=${table}`, {
        headers: {
          'x-admin-password': password,
        },
      });
      if (!res.ok) throw new Error('Failed to fetch data');
      const { data } = await res.json();
      setData(data || []);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData(activeTab);
      setIsCreating(false);
      setEditingItem(null);
      setFormData({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isAuthenticated]);

  const handleCreateNew = () => {
    setEditingItem(null);
    if (activeTab === 'announcements') {
      setFormData({ title: '', content: '', attachment_url: '', is_marquee: false, is_pinned: false, category: 'General' });
    } else if (activeTab === 'events') {
      setFormData({ title: '', description: '', date: new Date().toISOString().slice(0, 16), location: '', attachment_url: '', tag: 'Upcoming' });
    } else if (activeTab === 'resources') {
      setFormData({ title: '', description: '', category: 'Books', url: '', author: '' });
    }
    setIsCreating(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    
    let parsedTitle = item.title;
    let parsedCategory = 'General';
    let parsedTag = 'Upcoming';

    if (activeTab === 'announcements') {
      const match = parsedTitle.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        parsedCategory = match[1];
        parsedTitle = match[2];
      }
      setFormData({ ...item, title: parsedTitle, category: parsedCategory });
    } else if (activeTab === 'events') {
      const match = parsedTitle.match(/^\[(.*?)\]\s*(.*)$/);
      if (match) {
        parsedTag = match[1];
        parsedTitle = match[2];
      }
      if (item.date) {
        setFormData({ ...item, title: parsedTitle, tag: parsedTag, date: new Date(item.date).toISOString().slice(0, 16) });
      } else {
        setFormData({ ...item, title: parsedTitle, tag: parsedTag });
      }
    } else {
      setFormData({ ...item });
    }
    
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ table: activeTab, id }),
      });

      if (!res.ok) throw new Error('Failed to delete');
      
      setData(data.filter(item => item.id !== id));
      setMessage({ type: 'success', text: 'Item deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingItem ? 'PUT' : 'POST';
      const payload = { ...formData };
      
      if (activeTab === 'announcements') {
        payload.title = `[${payload.category || 'General'}] ${payload.title}`;
        delete payload.category;
      } else if (activeTab === 'events') {
        payload.title = `[${payload.tag || 'Upcoming'}] ${payload.title}`;
        delete payload.tag;
        if (payload.date) {
          payload.date = new Date(payload.date).toISOString();
        }
      }

      const body = editingItem 
        ? { table: activeTab, id: editingItem.id, payload }
        : { table: activeTab, payload };

      const res = await fetch('/api/admin/content', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save');

      const { data: savedItem } = await res.json();
      
      if (editingItem) {
        setData(data.map(item => item.id === editingItem.id ? savedItem : item));
      } else {
        setData([savedItem, ...data]);
      }
      
      setIsCreating(false);
      setEditingItem(null);
      setFormData({});
      setMessage({ type: 'success', text: editingItem ? 'Updated successfully!' : 'Created successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
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
            <h1 className="text-2xl font-bold text-white">Admin Access - Content</h1>
            <p className="text-zinc-400 text-sm">Enter the admin password to manage content.</p>
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
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col relative">
      {message && (
        <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-2xl border flex items-center gap-3 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 ${
          message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
          <span className="font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="ml-2 hover:opacity-70">
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-sm shadow-2xl text-center">
            <div className="h-16 w-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Are you sure?</h2>
            <p className="text-zinc-400 mb-8">
              This action cannot be undone. This item will be permanently removed from {confirmDelete.type}.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Content</h1>
            <p className="text-zinc-400 mt-1">Add, edit, or remove announcements, events, and resources.</p>
          </div>
          {!isCreating && (
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4" /> Create New
            </button>
          )}
        </div>

        {!isCreating && (
          <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-4 overflow-x-auto">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'announcements' ? 'bg-blue-500/10 text-blue-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'events' ? 'bg-purple-500/10 text-purple-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Events
            </button>
            <button
              onClick={() => setActiveTab('resources')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'resources' ? 'bg-emerald-500/10 text-emerald-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              Resources
            </button>
          </div>
        )}

        {isCreating ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit' : 'Create'} {activeTab.charAt(0).toUpperCase() + activeTab.slice(1, -1)}
              </h2>
              <button onClick={() => setIsCreating(false)} className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/5">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-3">
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    required
                  />
                </div>
                {activeTab === 'announcements' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                    <select
                      value={formData.category || 'General'}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="General">General</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                )}
                {activeTab === 'events' && (
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Tag</label>
                    <select
                      value={formData.tag || 'Upcoming'}
                      onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Delayed">Delayed</option>
                      <option value="Past">Past</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              {activeTab === 'announcements' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Content</label>
                    <textarea
                      value={formData.content || ''}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[150px]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Attachment URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.attachment_url || ''}
                      onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_marquee || false}
                      onChange={(e) => setFormData({ ...formData, is_marquee: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Show in scrolling marquee on homepage</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer mt-4">
                    <input
                      type="checkbox"
                      checked={formData.is_pinned || false}
                      onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Pin this announcement (Prioritize on Home Page)</span>
                  </label>
                </>
              )}

              {activeTab === 'events' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Date & Time</label>
                      <input
                        type="datetime-local"
                        value={formData.date || ''}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Location (Optional)</label>
                      <input
                        type="text"
                        value={formData.location || ''}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Attachment URL (Optional)</label>
                      <input
                        type="url"
                        value={formData.attachment_url || ''}
                        onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Cover Photo URL (Optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={formData.cover_photo_url || ''}
                          onChange={(e) => setFormData({ ...formData, cover_photo_url: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                          placeholder="https://example.com/image.jpg"
                        />
                        <label className="flex items-center justify-center px-4 rounded-xl bg-zinc-800 text-white hover:bg-zinc-700 cursor-pointer transition-colors whitespace-nowrap">
                          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Upload'}
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => handleFileUpload(e, 'cover_photo_url')}
                            disabled={isUploading}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'resources' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Category</label>
                      <select
                        value={formData.category || 'Books'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      >
                        <option value="Books">Books</option>
                        <option value="Lectures">Lectures</option>
                        <option value="Slides">Slides</option>
                        <option value="Miscellaneous">Miscellaneous</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Resource URL</label>
                      <input
                        type="url"
                        value={formData.url || ''}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2 mt-6">Author (Optional)</label>
                    <input
                      type="text"
                      value={formData.author || ''}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      placeholder="e.g. John Doe"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid gap-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
              </div>
            ) : data.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl">
                <p className="text-zinc-500">No {activeTab} found.</p>
              </div>
            ) : (
              data.map((item) => (
                <div key={item.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{item.title}</h3>
                      {activeTab === 'announcements' && item.is_marquee && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">Marquee</span>
                      )}
                      {activeTab === 'resources' && (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">{item.category}</span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{item.content || item.description}</p>
                    <div className="text-sm text-zinc-500">
                      {activeTab === 'events' ? (
                        <span>Event Date: {new Date(item.date).toLocaleString()}</span>
                      ) : (
                        <span>Added: {new Date(item.date || item.created_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete({ id: item.id, type: activeTab })}
                      className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
