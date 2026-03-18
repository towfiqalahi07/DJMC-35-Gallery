'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import Header from '@/components/Header';

interface PollOption {
  id: string;
  text: string;
}

interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  is_published: boolean;
  is_open: boolean;
  created_at: string;
}

export default function AdminPollsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    options: [{ id: '1', text: '' }, { id: '2', text: '' }],
    is_published: false,
    is_open: true,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/polls', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      const data = await res.json();
      setPolls(data.polls);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now().toString(), text: '' }]
    }));
  };

  const handleOptionChange = (id: string, text: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const handleRemoveOption = (id: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Filter out empty options
    const validOptions = formData.options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      alert('A poll must have at least 2 options.');
      setIsLoading(false);
      return;
    }

    try {
      const method = editingPoll ? 'PUT' : 'POST';
      const body = editingPoll 
        ? { id: editingPoll.id, ...formData, options: validOptions }
        : { ...formData, options: validOptions };

      const res = await fetch('/api/admin/polls', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Failed to save poll');

      const data = await res.json();
      
      if (editingPoll) {
        setPolls(polls.map(p => p.id === editingPoll.id ? data.poll : p));
      } else {
        setPolls([data.poll, ...polls]);
      }
      
      setIsCreating(false);
      setEditingPoll(null);
      setFormData({
        title: '',
        description: '',
        options: [{ id: '1', text: '' }, { id: '2', text: '' }],
        is_published: false,
        is_open: true,
      });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (poll: Poll) => {
    setEditingPoll(poll);
    setFormData({
      title: poll.title,
      description: poll.description || '',
      options: poll.options,
      is_published: poll.is_published,
      is_open: poll.is_open,
    });
    setIsCreating(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-md bg-zinc-900/50 border border-white/10 rounded-2xl p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="h-12 w-12 bg-red-500/10 rounded-full flex items-center justify-center mb-2">
              <ShieldAlert className="h-6 w-6 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white">Admin Access - Polls</h1>
            <p className="text-zinc-400 text-sm">Enter the admin password to manage polls.</p>
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
            <h1 className="text-3xl font-bold text-white">Manage Polls</h1>
            <p className="text-zinc-400 mt-1">Create and manage polls to resolve disputes.</p>
          </div>
          {!isCreating && (
            <button
              onClick={() => {
                setEditingPoll(null);
                setFormData({
                  title: '',
                  description: '',
                  options: [{ id: '1', text: '' }, { id: '2', text: '' }],
                  is_published: false,
                  is_open: true,
                });
                setIsCreating(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
            >
              <Plus className="h-4 w-4" /> Create Poll
            </button>
          )}
        </div>

        {isCreating ? (
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
            <h2 className="text-xl font-bold text-white mb-6">{editingPoll ? 'Edit Poll' : 'Create New Poll'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Poll Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">Options</label>
                <div className="space-y-3">
                  {formData.options.map((opt, index) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      />
                      {formData.options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOption(opt.id)}
                          className="p-3 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-3 flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium"
                >
                  <Plus className="h-4 w-4" /> Add Option
                </button>
              </div>

              <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  />
                  <span className="text-sm font-medium text-white">Published (Visible to users)</span>
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_open}
                    onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
                    className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                  />
                  <span className="text-sm font-medium text-white">Open for voting</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingPoll(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Poll'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="grid gap-4">
            {polls.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl">
                <p className="text-zinc-500">No polls created yet.</p>
              </div>
            ) : (
              polls.map((poll) => (
                <div key={poll.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-white">{poll.title}</h3>
                      {poll.is_published ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">Published</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">Draft</span>
                      )}
                      {poll.is_open ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-500/10 text-blue-400">Open</span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-500/10 text-red-400">Closed</span>
                      )}
                    </div>
                    <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{poll.description}</p>
                    <div className="text-sm text-zinc-500">
                      {poll.options.length} options • Created {new Date(poll.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleEdit(poll)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-sm"
                  >
                    <Edit className="h-4 w-4" /> Edit
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
