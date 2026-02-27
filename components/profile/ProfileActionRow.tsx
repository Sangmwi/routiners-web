'use client';

import { useRouter } from 'next/navigation';
import { useUserPostCount } from '@/hooks/community/useUserPostCount';
import { useCurrentUserProfile } from '@/hooks/profile/queries';

interface ProfileActionRowProps {
  userId: string;
}

/**
 * 프로필 액션 로우: 게시글/팔로워/팔로잉 스탯 + 프로필 편집 버튼
 */
export default function ProfileActionRow({ userId }: ProfileActionRowProps) {
  const router = useRouter();
  const { data: postCount = 0 } = useUserPostCount(userId);
  const { data: currentUser } = useCurrentUserProfile();

  return (
    <div className="space-y-3">
      {/* 스탯 인라인 */}
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="font-semibold text-foreground">{postCount}</span>
          <span className="text-muted-foreground ml-1">게시글</span>
        </span>
        <span>
          <span className="font-semibold text-foreground">{currentUser?.followersCount ?? 0}</span>
          <span className="text-muted-foreground ml-1">팔로워</span>
        </span>
        <span>
          <span className="font-semibold text-foreground">{currentUser?.followingCount ?? 0}</span>
          <span className="text-muted-foreground ml-1">팔로잉</span>
        </span>
      </div>

      {/* 프로필 편집 버튼 */}
      <button
        onClick={() => router.push('/profile/edit')}
        className="w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
      >
        프로필 편집
      </button>
    </div>
  );
}
