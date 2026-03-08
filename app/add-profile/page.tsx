'use client';

import { useState, useRef } from 'react';
import { ArrowLeft, Upload, CheckCircle2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function AddProfilePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Profile Form State
  const [photoUrl, setPhotoUrl] = useState('');
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('');
  const [hscBatch, setHscBatch] = useState('');
  const [admissionRoll, setAdmissionRoll] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [college, setCollege] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [facebook, setFacebook] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setStep(2);
      // For demo purposes, if API key is missing, it returns simulatedOtp
      if (data.simulatedOtp) {
        console.log('Simulated OTP:', data.simulatedOtp);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate OTP verification
    setTimeout(() => {
      if (otp.length === 4) {
        setStep(3);
      } else {
        setError('Invalid OTP. Please enter 4 digits.');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image is too large. Please select an image under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 0.7 quality to ensure < 1MB
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')) {
        throw new Error('Supabase credentials are not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment variables.');
      }

      // 1. Upload image to Supabase Storage
      const base64Data = photoUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const fileName = `${phone}-${Date.now()}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) throw new Error('Failed to upload image: ' + uploadError.message);

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(fileName);

      // 2. Save profile to Supabase Database
      const { error: dbError } = await supabase
        .from('students')
        .insert([
          {
            phone,
            name,
            photo_url: publicUrl,
            district,
            hsc_batch: hscBatch,
            admission_roll: admissionRoll,
            blood_group: bloodGroup,
            college,
            whatsapp: whatsapp || null,
            facebook: facebook || null,
          }
        ]);

      if (dbError) {
        if (dbError.code === '23505') { // Unique constraint violation
          throw new Error('A profile with this phone number or admission roll already exists.');
        }
        throw new Error('Failed to save profile: ' + dbError.message);
      }

      setSuccess('Profile successfully submitted! It will appear in the directory once approved by an admin. Redirecting...');
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } catch (err: any) {
      console.error('Profile submission error:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 selection:bg-zinc-800 selection:text-white flex flex-col">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Directory</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/50 p-6 sm:p-8 shadow-2xl">
          {/* Step Indicators */}
          <div className="mb-8 flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    step >= s
                      ? 'bg-white text-black'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && (
                  <div
                    className={`h-1 w-12 sm:w-24 mx-2 rounded-full transition-colors ${
                      step > s ? 'bg-white' : 'bg-zinc-800'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {error && (
            <div className="mb-6 rounded-xl bg-red-500/10 p-4 text-sm text-red-500 border border-red-500/20">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              {success}
            </div>
          )}

          {/* Step 1: Phone Number */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-white">Verify Phone</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Enter your Bangladeshi phone number to get started. One number can upload one profile max.
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 017XXXXXXXX"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || !phone}
                className="w-full rounded-xl bg-white py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Send OTP'}
              </button>
            </form>
          )}

          {/* Step 2: OTP */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-white">Enter OTP</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  We've sent a 4-digit code to {phone}
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">4-Digit Code</label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="XXXX"
                  className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-center text-2xl tracking-[1em] text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-white/10 bg-transparent px-4 py-3 font-semibold text-white transition-colors hover:bg-white/5"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.length !== 4}
                  className="flex-1 rounded-xl bg-white py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Profile Details */}
          {step === 3 && (
            <form onSubmit={handleSubmitProfile} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <h2 className="text-2xl font-bold text-white">Complete Profile</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Add your details to the directory.
                </p>
              </div>

              {/* Photo Upload */}
              <div className="flex flex-col items-center justify-center gap-4">
                <div 
                  className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-dashed border-zinc-600 bg-black/50 hover:border-zinc-400 transition-colors cursor-pointer group flex items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                    <Upload className="h-8 w-8 text-zinc-500 group-hover:text-zinc-400" />
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                />
                <p className="text-xs text-zinc-500">Max size: 1MB (Auto-compressed)</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">College Name *</label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="e.g. Rajshahi College"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Home District *</label>
                    <select
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none"
                    >
                      <option value="" disabled>Select District</option>
                      {[
                        'Bagerhat', 'Bandarban', 'Barguna', 'Barisal', 'Bhola', 'Bogra', 'Brahmanbaria', 'Chandpur',
                        'Chapainawabganj', 'Chattogram', 'Chuadanga', 'Comilla', 'Cox\'s Bazar', 'Dhaka', 'Dinajpur',
                        'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj', 'Habiganj', 'Jamalpur', 'Jashore',
                        'Jhalokati', 'Jhenaidah', 'Joypurhat', 'Khagrachhari', 'Khulna', 'Kishoreganj', 'Kurigram',
                        'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura', 'Manikganj', 'Meherpur',
                        'Moulvibazar', 'Munshiganj', 'Mymensingh', 'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi',
                        'Natore', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna', 'Panchagarh', 'Patuakhali',
                        'Pirojpur', 'Rajbari', 'Rajshahi', 'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur',
                        'Sherpur', 'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail', 'Thakurgaon'
                      ].map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Blood Group *</label>
                    <select
                      required
                      value={bloodGroup}
                      onChange={(e) => setBloodGroup(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none"
                    >
                      <option value="" disabled>Select</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">HSC Batch *</label>
                    <input
                      type="text"
                      required
                      value={hscBatch}
                      onChange={(e) => setHscBatch(e.target.value)}
                      placeholder="e.g. 2023"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-300">Admission Roll *</label>
                    <input
                      type="text"
                      required
                      value={admissionRoll}
                      onChange={(e) => setAdmissionRoll(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="e.g. 017XXXXXXXX"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-zinc-300">Facebook Profile URL (Optional)</label>
                  <input
                    type="url"
                    value={facebook}
                    onChange={(e) => setFacebook(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 text-white placeholder-zinc-600 focus:border-white/20 focus:outline-none focus:ring-1 focus:ring-white/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !name || !district || !hscBatch || !admissionRoll || !bloodGroup || !college || !photoUrl}
                className="w-full rounded-xl bg-white py-3 font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save Profile'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
