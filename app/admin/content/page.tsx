'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, ShieldAlert, Bell, Calendar, BookOpen, X, XCircle } from 'lucide-react';
import Image from 'next/image';
import Header from '@/components/Header';

type ContentType = 'announcements' | 'events' | 'resources' | 'info_requests';

export default function AdminContentPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<ContentType>('announcements');
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  const [formData, setFormData] = useState<any>({});
  
  const [viewingSubmissionsFor, setViewingSubmissionsFor] = useState<string | null>(null);
  const [submissionsData, setSubmissionsData] = useState<any[]>([]);
  const [isFetchingSubmissions, setIsFetchingSubmissions] = useState(false);

  const handleViewSubmissions = async (id: string) => {
    setViewingSubmissionsFor(id);
    setIsFetchingSubmissions(true);
    try {
      const res = await fetch(`/api/admin/pr/submissions?requestId=${id}`, {
        headers: { 'x-admin-password': password }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionsData(data.submissions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingSubmissions(false);
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
      alert(err.message);
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
      setFormData({ title: '', content: '', attachment_url: '', is_marquee: false, category: 'General' });
    } else if (activeTab === 'events') {
      setFormData({ title: '', description: '', date: new Date().toISOString().slice(0, 16), location: '', attachment_url: '', tag: 'Upcoming' });
    } else if (activeTab === 'resources') {
      setFormData({ title: '', description: '', category: 'Books', url: '' });
    } else if (activeTab === 'info_requests') {
      setFormData({ title: '', description: '', fields: [{ name: '', type: 'text' }], is_active: true });
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
    if (!confirm('Are you sure you want to delete this item?')) return;
    
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
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
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

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || 'Failed to save');
      }

      const savedItem = responseData.data;
      
      if (editingItem) {
        setData(data.map(item => item.id === editingItem.id ? savedItem : item));
      } else {
        setData([savedItem, ...data]);
      }
      
      setIsCreating(false);
      setEditingItem(null);
      setFormData({});
    } catch (err: any) {
      alert(err.message);
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
    <div className="min-h-screen bg-black text-zinc-300 flex flex-col">
      <Header />
      
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
            <button
              onClick={() => setActiveTab('info_requests')}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'info_requests' ? 'bg-orange-500/10 text-orange-400' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Bell className="h-4 w-4" />
              Info Requests
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
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Attachment URL (Optional)</label>
                    <input
                      type="url"
                      value={formData.attachment_url || ''}
                      onChange={(e) => setFormData({ ...formData, attachment_url: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
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
                </>
              )}

              {activeTab === 'info_requests' && (
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
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Fields</label>
                    <div className="space-y-3">
                      {(formData.fields || []).map((field: any, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => {
                              const newFields = [...formData.fields];
                              newFields[index].name = e.target.value;
                              setFormData({ ...formData, fields: newFields });
                            }}
                            placeholder="Field Name (e.g., Phone Number)"
                            className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                            required
                          />
                          <select
                            value={field.type}
                            onChange={(e) => {
                              const newFields = [...formData.fields];
                              newFields[index].type = e.target.value;
                              setFormData({ ...formData, fields: newFields });
                            }}
                            className="w-32 rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="image">Image</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => {
                              const newFields = formData.fields.filter((_: any, i: number) => i !== index);
                              setFormData({ ...formData, fields: newFields });
                            }}
                            className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, fields: [...(formData.fields || []), { name: '', type: 'text' }] })}
                      className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      <Plus className="h-4 w-4" /> Add Field
                    </button>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer pt-4">
                    <input
                      type="checkbox"
                      checked={formData.is_active ?? true}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Active (Visible to users)</span>
                  </label>
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
                    {activeTab === 'info_requests' && (
                      <button
                        onClick={() => handleViewSubmissions(item.id)}
                        className="px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                      >
                        View Submissions
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
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

      {viewingSubmissionsFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Submissions</h2>
              <button
                onClick={() => setViewingSubmissionsFor(null)}
                className="text-zinc-400 hover:text-white"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {isFetchingSubmissions ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
                </div>
              ) : submissionsData.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  No submissions yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {submissionsData.map((sub) => (
                    <div key={sub.id} className="bg-black/50 border border-white/5 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4 pb-4 border-b border-white/5">
                        <div>
                          <p className="font-medium text-white">{sub.profiles?.name || 'Unknown User'}</p>
                          <p className="text-sm text-zinc-500">Roll: {sub.profiles?.admission_roll || 'N/A'}</p>
                        </div>
                        <div className="text-sm text-zinc-500">
                          {new Date(sub.created_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {Object.entries(sub.data || {}).map(([key, value]) => (
                          <div key={key}>
                            <p className="text-xs text-zinc-500 mb-1">{key}</p>
                            {typeof value === 'string' && value.startsWith('data:image/') ? (
                              <div className="mt-2 relative h-32 w-full max-w-xs rounded-lg overflow-hidden border border-white/10">
                                <Image src={value} alt={key} fill className="object-cover" />
                              </div>
                            ) : typeof value === 'string' && value.startsWith('http') ? (
                              <a href={value} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline text-sm break-all">
                                {value}
                              </a>
                            ) : (
                              <p className="text-sm text-zinc-300 break-words">{String(value)}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
