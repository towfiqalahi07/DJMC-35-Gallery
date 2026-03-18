'use client';

import Header from '@/components/Header';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Phone, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    hscBatch: '',
    college: '',
    bloodGroup: '',
    admissionRoll: '',
    district: '',
    whatsapp: '',
    facebook: '',
  });

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
        return;
      }
      setUser(session.user);
      
      // Fetch profile from API route
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      const res = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${currentSession?.access_token}`
        }
      });
      
      if (res.ok) {
        const { profile: studentData } = await res.json();
        if (studentData) {
          setProfile(studentData);
          setFormData({
            name: studentData.name || session.user.user_metadata.full_name,
            email: studentData.email || session.user.email,
            phone: studentData.phone || '',
            hscBatch: studentData.hsc_batch || '',
            college: studentData.college || '',
            bloodGroup: studentData.blood_group || '',
            admissionRoll: studentData.admission_roll || '',
            district: studentData.district || '',
            whatsapp: studentData.whatsapp || '',
            facebook: studentData.facebook || '',
          });
        } else {
          setFormData(prev => ({
            ...prev,
            name: session.user.user_metadata.full_name || '',
            email: session.user.email || '',
          }));
        }
      }
      setIsLoading(false);
    }
    fetchUser();
  }, [router]);

  const handlePhoneCheck = async () => {
    if (!formData.phone) return;
    setIsLoading(true);
    
    // Check if phone exists via API
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/profile/check-phone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`
      },
      body: JSON.stringify({ phone: formData.phone })
    });

    const { data } = await res.json();

    if (data && !data.user_id) {
      // Autofill data
      setFormData(prev => ({
        ...prev,
        hscBatch: data.hsc_batch || '',
        college: data.college || '',
        bloodGroup: data.blood_group || '',
        admissionRoll: data.admission_roll || '',
        district: data.district || '',
        whatsapp: data.whatsapp || '',
        facebook: data.facebook || '',
      }));
      setMessage({ type: 'success', text: 'Phone number found! Autofilled your information.' });
    } else if (data && data.user_id) {
      setMessage({ type: 'error', text: 'This phone number is already linked to another account.' });
    } else {
      setMessage({ type: 'error', text: 'Phone number not found in database. You will need admin approval.' });
    }
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        hscBatch: formData.hscBatch,
        college: formData.college,
        bloodGroup: formData.bloodGroup,
        admissionRoll: formData.admissionRoll,
        district: formData.district,
        whatsapp: formData.whatsapp,
        facebook: formData.facebook,
        photo_url: profile ? profile.photo_url : user.user_metadata.avatar_url,
      };

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile');
      }

      // Refresh profile state
      const profileRes = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });
      if (profileRes.ok) {
        const { profile: updatedProfile } = await profileRes.json();
        setProfile(updatedProfile);
      }

      setMessage({ type: 'success', text: 'Profile saved successfully!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <div className="mb-8 flex items-center gap-6">
          <img src={user?.user_metadata.avatar_url} alt="Profile" className="w-24 h-24 rounded-full border-4 border-zinc-800 shadow-xl" />
          <div>
            <h1 className="text-3xl font-bold text-white">{formData.name}</h1>
            <p className="text-zinc-400">{formData.email}</p>
            {profile && profile.is_approved ? (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium border border-emerald-500/20">
                <CheckCircle2 className="h-3 w-3" /> Approved
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-medium border border-amber-500/20">
                <AlertCircle className="h-3 w-3" /> Pending Approval
              </span>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border ${message.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 p-6 sm:p-8 rounded-3xl border border-white/5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  required
                />
                <button
                  type="button"
                  onClick={handlePhoneCheck}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-white font-medium hover:bg-zinc-700 transition-colors whitespace-nowrap"
                >
                  Check
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">HSC Batch</label>
              <input
                type="text"
                value={formData.hscBatch}
                onChange={(e) => setFormData({ ...formData, hscBatch: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Previous College</label>
              <input
                type="text"
                value={formData.college}
                onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Blood Group</label>
              <input
                type="text"
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">MAT Roll</label>
              <input
                type="text"
                value={formData.admissionRoll}
                onChange={(e) => setFormData({ ...formData, admissionRoll: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Home District</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">WhatsApp Number</label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
            
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Facebook Profile Link</label>
              <input
                type="url"
                value={formData.facebook}
                onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 px-4 text-white focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Profile'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
