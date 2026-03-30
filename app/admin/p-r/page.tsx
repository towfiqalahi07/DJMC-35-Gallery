'use client';

import { useState, useEffect } from 'react';
import { Loader2, Plus, Edit, Trash2, CheckCircle, XCircle, ShieldAlert, Download } from 'lucide-react';

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
  show_results: boolean;
  created_at: string;
}

interface InfoRequest {
  id: string;
  title: string;
  description: string;
  field_type: 'text' | 'number' | 'image' | 'select';
  target_column: string;
  options?: string[];
  is_active: boolean;
  placeholder?: string;
  created_at: string;
}

export default function AdminPollsPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [requests, setRequests] = useState<InfoRequest[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [votes, setVotes] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'polls' | 'requests' | 'submissions'>('polls');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; type: 'poll' | 'request' } | null>(null);
  
  const [isCreating, setIsCreating] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [editingRequest, setEditingRequest] = useState<InfoRequest | null>(null);
  
  const [pollFormData, setPollFormData] = useState({
    title: '',
    description: '',
    options: [{ id: '1', text: '' }, { id: '2', text: '' }],
    is_published: false,
    is_open: true,
    show_results: false,
  });

  const [requestFormData, setRequestFormData] = useState({
    title: '',
    description: '',
    field_type: 'text' as 'text' | 'number' | 'image' | 'select',
    target_column: '',
    options: [] as string[],
    is_active: true,
    placeholder: '',
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/p-r', {
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) {
        throw new Error('Invalid password');
      }

      const data = await res.json();
      setPolls(data.polls);
      setVotes(data.votes || []);
      
      // Also fetch info requests
      const reqRes = await fetch('/api/admin/info-request', {
        headers: {
          'x-admin-password': password,
        },
      });
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests);
        setSubmissions(reqData.submissions);
      }
      
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOption = () => {
    setPollFormData(prev => ({
      ...prev,
      options: [...prev.options, { id: Date.now().toString(), text: '' }]
    }));
  };

  const handleOptionChange = (id: string, text: string) => {
    setPollFormData(prev => ({
      ...prev,
      options: prev.options.map(opt => opt.id === id ? { ...opt, text } : opt)
    }));
  };

  const handleRemoveOption = (id: string) => {
    setPollFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt.id !== id)
    }));
  };

  const handlePollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Filter out empty options
    const validOptions = pollFormData.options.filter(opt => opt.text.trim() !== '');
    if (validOptions.length < 2) {
      setMessage({ type: 'error', text: 'A poll must have at least 2 options.' });
      setIsLoading(false);
      return;
    }

    try {
      const method = editingPoll ? 'PUT' : 'POST';
      const body = editingPoll 
        ? { id: editingPoll.id, ...pollFormData, options: validOptions }
        : { ...pollFormData, options: validOptions };

      const res = await fetch('/api/admin/p-r', {
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
      setPollFormData({
        title: '',
        description: '',
        options: [{ id: '1', text: '' }, { id: '2', text: '' }],
        is_published: false,
        is_open: true,
        show_results: false,
      });
      setMessage({ type: 'success', text: editingPoll ? 'Poll updated successfully!' : 'Poll created successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const method = editingRequest ? 'PUT' : 'POST';
      const submissionData = {
        ...requestFormData,
        options: requestFormData.field_type === 'select' ? requestFormData.options : null
      };

      const body = editingRequest 
        ? { id: editingRequest.id, ...submissionData }
        : submissionData;

      const res = await fetch('/api/admin/info-request', {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save info request');

      if (editingRequest) {
        setRequests(requests.map(r => r.id === editingRequest.id ? data.request : r));
      } else {
        setRequests([data.request, ...requests]);
      }
      
      setIsCreating(false);
      setEditingRequest(null);
      setRequestFormData({
        title: '',
        description: '',
        field_type: 'text',
        target_column: '',
        options: [],
        is_active: true,
        placeholder: '',
      });
      setMessage({ type: 'success', text: editingRequest ? 'Request updated successfully!' : 'Request created successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePoll = async (id: string) => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/p-r?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) throw new Error('Failed to delete poll');

      setPolls(polls.filter(p => p.id !== id));
      setMessage({ type: 'success', text: 'Poll deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
    }
  };

  const handleEditPoll = (poll: Poll) => {
    setEditingPoll(poll);
    setPollFormData({
      title: poll.title,
      description: poll.description || '',
      options: poll.options,
      is_published: poll.is_published,
      is_open: poll.is_open,
      show_results: poll.show_results || false,
    });
    setIsCreating(true);
  };

  const handleEditRequest = (request: InfoRequest) => {
    setEditingRequest(request);
    setRequestFormData({
      title: request.title,
      description: request.description || '',
      field_type: request.field_type,
      target_column: request.target_column,
      options: request.options || [],
      is_active: request.is_active,
      placeholder: request.placeholder || '',
    });
    setIsCreating(true);
  };

  const calculateResults = (pollId: string, options: PollOption[]) => {
    const pollVotes = votes.filter(v => v.poll_id === pollId);
    const totalVotes = pollVotes.length;
    
    return options.map(opt => {
      const count = pollVotes.filter(v => v.option_id === opt.id).length;
      const percentage = totalVotes === 0 ? 0 : Math.round((count / totalVotes) * 100);
      return { ...opt, count, percentage };
    });
  };

  const handleDownloadCSV = () => {
    if (submissions.length === 0) return;

    const allKeys = new Set<string>();
    submissions.forEach(sub => Object.keys(sub).forEach(key => allKeys.add(key)));
    
    const metadataKeys = ['id', 'user_id', 'name', 'email', 'phone', 'class_roll', 'admission_roll', 'created_at', 'updated_at'];
    const otherKeys = Array.from(allKeys).filter(key => !metadataKeys.includes(key));
    
    // Only include class_roll and the submitted data (otherKeys)
    const header: string[] = [];
    if (allKeys.has('class_roll')) {
      header.push('class_roll');
    }
    header.push(...otherKeys);

    const csvRows = [];
    csvRows.push(header.join(','));

    submissions.forEach(sub => {
      const row = header.map(key => {
        let value = sub[key] === null || sub[key] === undefined ? '' : String(sub[key]);
        if (value.includes(',') || value.includes('\\n') || value.includes('"')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(row.join(','));
    });

    const csvString = csvRows.join('\\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `submissions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteRequest = async (id: string) => {
    setIsLoading(true);

    try {
      const res = await fetch(`/api/admin/info-request?id=${id}`, {
        method: 'DELETE',
        headers: {
          'x-admin-password': password,
        },
      });

      if (!res.ok) throw new Error('Failed to delete info request');

      setRequests(requests.filter(r => r.id !== id));
      setMessage({ type: 'success', text: 'Request deleted successfully!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
      setConfirmDelete(null);
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
            <h1 className="text-2xl font-bold text-white">Admin Access - P&R</h1>
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
    <>
      <main className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8">
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
                This action cannot be undone. All associated data will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="flex-1 px-6 py-3 rounded-xl bg-zinc-800 text-white font-bold hover:bg-zinc-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => confirmDelete.type === 'poll' ? handleDeletePoll(confirmDelete.id) : handleDeleteRequest(confirmDelete.id)}
                  className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage P&R</h1>
            <p className="text-zinc-400 mt-1">Create and manage polls and info requests.</p>
          </div>
          {!isCreating && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setEditingPoll(null);
                  setPollFormData({
                    title: '',
                    description: '',
                    options: [{ id: '1', text: '' }, { id: '2', text: '' }],
                    is_published: false,
                    is_open: true,
                    show_results: false,
                  });
                  setActiveTab('polls');
                  setIsCreating(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black hover:bg-zinc-200 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" /> Create Poll
              </button>
              <button
                onClick={() => {
                  setEditingRequest(null);
                  setRequestFormData({
                    title: '',
                    description: '',
                    field_type: 'text',
                    target_column: '',
                    options: [],
                    is_active: true,
                    placeholder: '',
                  });
                  setActiveTab('requests');
                  setIsCreating(true);
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors font-medium text-sm"
              >
                <Plus className="h-4 w-4" /> Create Request
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        {!isCreating && (
          <div className="flex border-b border-white/10 mb-8">
            <button
              onClick={() => setActiveTab('polls')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'polls' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Polls
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'requests' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Info Requests
            </button>
            <button
              onClick={() => setActiveTab('submissions')}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'submissions' ? 'border-white text-white' : 'border-transparent text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Submissions
            </button>
          </div>
        )}

        {isCreating ? (
          activeTab === 'polls' ? (
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">{editingPoll ? 'Edit Poll' : 'Create New Poll'}</h2>
              <form onSubmit={handlePollSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Poll Title</label>
                  <input
                    type="text"
                    value={pollFormData.title}
                    onChange={(e) => setPollFormData({ ...pollFormData, title: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description (Optional)</label>
                  <textarea
                    value={pollFormData.description}
                    onChange={(e) => setPollFormData({ ...pollFormData, description: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[100px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Options</label>
                  <div className="space-y-3">
                    {pollFormData.options.map((opt, index) => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt.text}
                          onChange={(e) => handleOptionChange(opt.id, e.target.value)}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                          required
                        />
                        {pollFormData.options.length > 2 && (
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

                <div className="flex items-center gap-6 pt-4 border-t border-white/5 flex-wrap">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pollFormData.is_published}
                      onChange={(e) => setPollFormData({ ...pollFormData, is_published: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Published (Visible to users)</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pollFormData.is_open}
                      onChange={(e) => setPollFormData({ ...pollFormData, is_open: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Open for voting</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pollFormData.show_results}
                      onChange={(e) => setPollFormData({ ...pollFormData, show_results: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Show results to users</span>
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
            <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 mb-8">
              <h2 className="text-xl font-bold text-white mb-6">{editingRequest ? 'Edit Info Request' : 'Create New Info Request'}</h2>
              <form onSubmit={handleRequestSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Request Title</label>
                    <input
                      type="text"
                      value={requestFormData.title}
                      onChange={(e) => setRequestFormData({ ...requestFormData, title: e.target.value })}
                      placeholder="e.g., T-Shirt Size"
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Target Database Column</label>
                    <input
                      type="text"
                      value={requestFormData.target_column}
                      onChange={(e) => setRequestFormData({ ...requestFormData, target_column: e.target.value })}
                      placeholder="e.g., t_shirt_size"
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Description</label>
                  <textarea
                    value={requestFormData.description}
                    onChange={(e) => setRequestFormData({ ...requestFormData, description: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Placeholder Text (Optional)</label>
                  <input
                    type="text"
                    value={requestFormData.placeholder}
                    onChange={(e) => setRequestFormData({ ...requestFormData, placeholder: e.target.value })}
                    placeholder="e.g., Enter your size here..."
                    className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Field Type</label>
                    <select
                      value={requestFormData.field_type}
                      onChange={(e) => setRequestFormData({ ...requestFormData, field_type: e.target.value as any })}
                      className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Select (Dropdown)</option>
                      <option value="image">Image URL</option>
                    </select>
                  </div>
                  {requestFormData.field_type === 'select' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-400 mb-2">Options (Comma separated)</label>
                      <input
                        type="text"
                        value={requestFormData.options.join(', ')}
                        onChange={(e) => setRequestFormData({ ...requestFormData, options: e.target.value.split(',').map(s => s.trim()) })}
                        placeholder="e.g., S, M, L, XL"
                        className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                        required
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requestFormData.is_active}
                      onChange={(e) => setRequestFormData({ ...requestFormData, is_active: e.target.checked })}
                      className="w-5 h-5 rounded border-white/10 bg-zinc-900 text-blue-500 focus:ring-blue-500/20"
                    />
                    <span className="text-sm font-medium text-white">Active (Visible to users)</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setEditingRequest(null);
                    }}
                    className="px-6 py-3 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-500 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Request'}
                  </button>
                </div>
              </form>
            </div>
          )
        ) : (
          <div className="grid gap-4">
            {activeTab === 'polls' && (
              polls.length === 0 ? (
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
                      
                      {/* Poll Results Preview */}
                      <div className="space-y-2 mb-4">
                        {calculateResults(poll.id, poll.options).map(opt => (
                          <div key={opt.id} className="text-xs">
                            <div className="flex justify-between mb-1">
                              <span className="text-zinc-300">{opt.text}</span>
                              <span className="text-zinc-500">{opt.count} votes ({opt.percentage}%)</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500/50 transition-all duration-500" 
                                style={{ width: `${opt.percentage}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="text-sm text-zinc-500">
                        {poll.options.length} options • Created {new Date(poll.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditPoll(poll)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-sm"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: poll.id, type: 'poll' })}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'requests' && (
              requests.length === 0 ? (
                <div className="text-center py-20 bg-zinc-900/30 border border-white/5 rounded-2xl">
                  <p className="text-zinc-500">No info requests created yet.</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div key={request.id} className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{request.title}</h3>
                        {request.is_active ? (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-emerald-500/10 text-emerald-400">Active</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-400">Inactive</span>
                        )}
                        <span className="px-2 py-1 rounded text-xs font-medium bg-zinc-800 text-zinc-300 uppercase tracking-wider">{request.field_type}</span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-4 line-clamp-2">{request.description}</p>
                      <div className="text-sm text-zinc-500">
                        Column: <span className="text-blue-400 font-mono">{request.target_column}</span> • Created {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRequest(request)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition-colors font-medium text-sm"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ id: request.id, type: 'request' })}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-4">
                <div className="flex justify-end">
                  <button
                    onClick={handleDownloadCSV}
                    disabled={submissions.length === 0}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" /> Download CSV
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Student</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Rolls</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Data</th>
                      <th className="py-4 px-4 text-xs font-bold uppercase tracking-widest text-zinc-500">Last Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-20 text-center text-zinc-500">No submissions yet.</td>
                      </tr>
                    ) : (
                      submissions.map((sub) => (
                        <tr key={sub.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-bold text-white">{sub.name}</div>
                            <div className="text-xs text-zinc-500">{sub.email}</div>
                            <div className="text-xs text-zinc-500">{sub.phone}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm text-zinc-300">Class: {sub.class_roll}</div>
                            <div className="text-sm text-zinc-300">Adm: {sub.admission_roll}</div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {/* Dynamically show non-metadata fields */}
                              {Object.entries(sub).map(([key, value]) => {
                                const isMetadata = ['id', 'user_id', 'name', 'email', 'phone', 'class_roll', 'admission_roll', 'created_at', 'updated_at'].includes(key);
                                if (!isMetadata && value) {
                                  return (
                                    <div key={key} className="text-xs">
                                      <span className="text-zinc-500 uppercase tracking-tighter mr-2">{key}:</span>
                                      <span className="text-blue-400 font-medium">{String(value)}</span>
                                    </div>
                                  );
                                }
                                return null;
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-zinc-500">
                            {new Date(sub.updated_at || sub.created_at).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
