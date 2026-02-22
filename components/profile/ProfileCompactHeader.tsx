'use client';

import { ImageWithFallback } from '@/components/ui/image';
import type { User } from '@/lib/types';

interface ProfileCompactHeaderProps {
  user: User;
}

/**
 * 소셜 프로필 상단: 원형 프로필 사진 + 닉네임 + 소개
 */
export default function ProfileCompactHeader({ user }: ProfileCompactHeaderProps) {
  return (
    <div className="flex flex-col items-center gap-3 pt-2">
      {/* 프로필 사진 (80px 원형) */}
      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-border/30">
        <ImageWithFallback
          src={user.profilePhotoUrl}
          alt={user.nickname}
          fill
          sizes="80px"
          className="object-cover"
          optimizePreset="avatarLarge"
        />
      </div>

      {/* 닉네임 */}
      <h2 className="text-lg font-bold text-foreground">{user.nickname}</h2>

      {/* 소개 */}
      {user.bio && (
        <p className="text-sm text-muted-foreground text-center px-6 line-clamp-3">
          {user.bio}
        </p>
      )}
    </div>
  );
}
