'use client';

import { Camera, Edit2 } from 'lucide-react';
import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';

interface ProfileHeaderProps {
  user: User;
  onEdit: () => void;
}

export default function ProfileHeader({ user, onEdit }: ProfileHeaderProps) {
  const getAge = (birthDate: string) => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="relative rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 p-6 border border-border/50">
      <button
        onClick={onEdit}
        className="absolute right-4 top-4 rounded-full bg-card p-2 shadow-md transition-transform hover:scale-105"
      >
        <Edit2 className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex flex-col items-center gap-4">
        {/* Profile Image */}
        <div className="group relative">
          <div className="relative h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-primary to-primary/70 ring-4 ring-card">
            <ImageWithFallback
              src={user.profileImages?.[0]}
              alt={user.nickname}
              fill
              className="object-cover"
              fallbackClassName="bg-gradient-to-br from-primary to-primary/70"
              showFallbackIcon={false}
            />
            {!user.profileImages?.[0] && (
              <div className="absolute inset-0 flex items-center justify-center text-3xl font-bold text-primary-foreground">
                {user.nickname.charAt(0)}
              </div>
            )}
          </div>
          <button className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="h-4 w-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground">{user.nickname}</h2>
          <div className="mt-1 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span>{user.gender === 'male' ? '남성' : '여성'}</span>
            <span>•</span>
            <span>{getAge(user.birthDate)}세</span>
          </div>
          {user.bio && <p className="mt-2 text-sm text-foreground/80">{user.bio}</p>}
        </div>

        {/* Military Info Badge */}
        <div className="flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm shadow-sm border border-border/50">
          <span className="font-semibold text-primary">{user.rank.replace('-', ' ')}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-foreground">{user.specialty}</span>
        </div>
      </div>
    </div>
  );
}
