'use client';

import { ImageWithFallback } from '@/components/ui/image';
import type { User } from '@/lib/types';

interface ProfileCompactHeaderProps {
  user: User;
}

/**
 * 소셜 프로필 상단: 닉네임+소개 좌측, 아바타 우측 가로 배치
 */
export default function ProfileCompactHeader({ user }: ProfileCompactHeaderProps) {
  return (
    <div className="flex items-start justify-between pt-2">
      {/* 닉네임 + 계급 + 소개 */}
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-xl font-bold text-foreground">{user.nickname}</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[user.rank, user.unitName, user.specialty].filter(Boolean).join(' · ')}
        </p>
        {user.bio ? (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-3">
            {user.bio}
          </p>
        ) : (
          <p className="text-sm text-hint mt-3">
            한줄소개를 작성해보세요
          </p>
        )}
      </div>

      {/* 프로필 사진 (64px 원형) */}
      <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-edge-faint flex-shrink-0">
        <ImageWithFallback
          src={user.profilePhotoUrl}
          alt={user.nickname}
          fill
          sizes="64px"
          className="object-cover"
          optimizePreset="avatarLarge"
        />
      </div>
    </div>
  );
}
