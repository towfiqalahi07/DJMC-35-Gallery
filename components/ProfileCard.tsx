import Image from 'next/image';
import { MapPin, GraduationCap, Hash, Building2, MessageCircle, Facebook } from 'lucide-react';

interface ProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  district: string;
  hscBatch: string;
  classRoll: string; // <-- Changed from admissionRoll
  bloodGroup: string;
  college: string;
  whatsapp?: string;
  facebook?: string;
}

export function ProfileCard({ profile }: { profile: ProfileProps }) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-zinc-900/80 border border-white/10 transition-all duration-300 hover:border-white/20 hover:shadow-2xl hover:shadow-black/50 hover:-translate-y-1">
      {/* Banner */}
      <div className="h-24 w-full bg-gradient-to-br from-zinc-800 to-zinc-950 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:12px_12px]"></div>
        <div className="absolute top-4 right-4 z-10">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-xs font-bold text-red-400 border border-red-500/30 backdrop-blur-md shadow-sm">
            {profile.bloodGroup}
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="px-5 pb-5 relative flex-1 flex flex-col">
        {/* Avatar */}
        <div className="relative -mt-12 mb-4 h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-zinc-900 bg-zinc-800 shadow-xl transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
          <Image
            src={profile.photoUrl}
            alt={profile.name}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Info */}
        <div className="flex-1">
          <h3 className="truncate text-xl font-bold text-white tracking-tight">
            {profile.name}
          </h3>
          
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <Building2 className="h-3.5 w-3.5" />
              </div>
              <span className="truncate font-medium">{profile.college}</span>
            </div>
            
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="truncate font-medium">{profile.district}</span>
            </div>

            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <GraduationCap className="h-3.5 w-3.5" />
              </div>
              <span className="truncate font-medium">HSC &apos;{profile.hscBatch}</span>
            </div>

            {/* Render Class Roll Instead of Admission Roll */}
            <div className="flex items-center gap-3 text-sm text-zinc-400">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-300 transition-colors group-hover:bg-white/10 group-hover:text-white">
                <Hash className="h-3.5 w-3.5" />
              </div>
              <span className="truncate font-medium font-mono text-xs">Roll: {profile.classRoll || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {(profile.whatsapp || profile.facebook) && (
          <div className="mt-6 flex items-center gap-2 pt-4 border-t border-white/5">
            {profile.whatsapp && (
              <a
                href={`https://api.whatsapp.com/send/?phone=${(() => {
                  let cleanPhone = profile.whatsapp.replace(/[^0-9]/g, '');
                  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
                    return '88' + cleanPhone;
                  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
                    return '880' + cleanPhone;
                  } else if (!cleanPhone.startsWith('88')) {
                    // Fallback if it's some other format but doesn't have country code
                    return '88' + cleanPhone;
                  }
                  return cleanPhone;
                })()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366]/10 px-3 py-2.5 text-sm font-semibold text-[#25D366] transition-all duration-300 hover:bg-[#25D366]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            )}
            {profile.facebook && (
              <a
                href={profile.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#1877F2]/10 px-3 py-2.5 text-sm font-semibold text-[#1877F2] transition-all duration-300 hover:bg-[#1877F2]/20 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
