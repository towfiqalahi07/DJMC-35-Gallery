import Image from 'next/image';
import { MapPin, GraduationCap, Hash, Building2, MessageCircle, Facebook } from 'lucide-react';

interface ProfileProps {
  id: string;
  name: string;
  photoUrl: string;
  district: string;
  hscBatch: string;
  admissionRoll: string;
  bloodGroup: string;
  college: string;
  whatsapp?: string;
  facebook?: string;
}

export function ProfileCard({ profile }: { profile: ProfileProps }) {
  return (
    <div className="group relative block overflow-hidden rounded-2xl bg-zinc-900/50 border border-white/5 p-4 transition-all hover:bg-zinc-800/80 hover:border-white/10 hover:shadow-xl hover:shadow-black/50">
      <div className="flex items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-zinc-800 group-hover:border-zinc-700 transition-colors">
          <Image
            src={profile.photoUrl}
            alt={profile.name}
            fill
            className="object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-lg font-semibold text-zinc-100 group-hover:text-white transition-colors">
            {profile.name}
          </h3>
          <div className="mt-2 space-y-1.5 text-sm text-zinc-400">
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">{profile.college}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">{profile.district}</span>
            </div>
            <div className="flex items-center gap-2">
              <GraduationCap className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">HSC '{profile.hscBatch}</span>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              <span className="truncate">Roll: {profile.admissionRoll}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="absolute top-4 right-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10 text-xs font-bold text-red-500 border border-red-500/20">
          {profile.bloodGroup}
        </div>
      </div>

      {(profile.whatsapp || profile.facebook) && (
        <div className="mt-4 flex items-center gap-2 border-t border-white/5 pt-4">
          {profile.whatsapp && (
            <a
              href={`https://api.whatsapp.com/send/?phone=${
                profile.whatsapp.replace(/[^0-9]/g, '').startsWith('01') && profile.whatsapp.replace(/[^0-9]/g, '').length === 11 
                  ? '+88' + profile.whatsapp.replace(/[^0-9]/g, '') 
                  : '+' + profile.whatsapp.replace(/[^0-9]/g, '')
              }`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#25D366]/10 px-3 py-2 text-sm font-medium text-[#25D366] transition-colors hover:bg-[#25D366]/20"
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
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#1877F2]/10 px-3 py-2 text-sm font-medium text-[#1877F2] transition-colors hover:bg-[#1877F2]/20"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </a>
          )}
        </div>
      )}
    </div>
  );
}
