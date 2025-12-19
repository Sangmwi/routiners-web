'use client';

import { User } from '@/lib/types';
import ImageWithFallback from '@/components/ui/ImageWithFallback';
import { CheckCircle2 } from 'lucide-react';

interface ProfileHeroSectionProps {
  user: User;
}

export default function ProfileHeroSection({ user }: ProfileHeroSectionProps) {
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

  const getRankDisplay = (rank: string) => {
    return rank.split('-')[0]; // "병장-1호봉" → "병장"
  };

  return (
    <div className="relative h-[600px] rounded-[20px] overflow-hidden bg-card shadow-sm border border-border/50">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={user.profileImage}
          alt={user.nickname}
          fill
          className="object-cover"
          fallbackClassName="bg-gradient-to-br from-muted via-muted/80 to-muted/60"
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/80" />
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {/* Name and Age */}
        <div className="flex items-center gap-2 mb-3">
          <h1 className="text-2xl font-bold text-white">
            {getRankDisplay(user.rank)} {user.nickname}, {getAge(user.birthDate)}
          </h1>
          <CheckCircle2 className="w-6 h-6 text-white" fill="currentColor" />
        </div>

        {/* Interest Tag */}
        {user.interestedExercises && user.interestedExercises.length > 0 && (
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-card text-xs text-card-foreground mb-3">
            {user.interestedExercises.slice(0, 2).join('/')}
          </div>
        )}

        {/* Unit Info */}
        <div className="flex items-center gap-2 text-white text-xs">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{user.unitName}</span>
        </div>
      </div>
    </div>
  );
}
