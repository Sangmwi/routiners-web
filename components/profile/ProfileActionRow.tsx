'use client';

import { useUserPostCount } from '@/hooks/community/useUserPostCount';
import { useCurrentUserProfile } from '@/hooks/profile/queries';
import AppLink from '@/components/common/AppLink';

interface ProfileActionRowProps {
  userId: string;
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <span>
      <span className="font-semibold text-foreground">{value}</span>
      <span className="text-muted-foreground ml-1">{label}</span>
    </span>
  );
}

/**
 * 프로필 액션 로우: 게시글/팔로워/팔로잉 스탯 + 프로필 편집 버튼
 */
export default function ProfileActionRow({ userId }: ProfileActionRowProps) {
  const { data: postCount = 0 } = useUserPostCount(userId);
  const { data: currentUser } = useCurrentUserProfile();

  return (
    <div className="space-y-3">
      {/* 스탯 인라인 */}
      <div className="flex items-center gap-3 text-sm">
        <StatItem value={postCount} label="게시글" />
        <StatItem value={currentUser?.followersCount ?? 0} label="팔로워" />
        <StatItem value={currentUser?.followingCount ?? 0} label="팔로잉" />
      </div>

      {/* 프로필 편집 버튼 */}
      <AppLink
        href="/profile/edit"
        className="w-full border border-border rounded-xl py-2.5 text-sm font-medium text-foreground hover:bg-surface-muted transition-colors"
      >
        프로필 편집
      </AppLink>
    </div>
  );
}
