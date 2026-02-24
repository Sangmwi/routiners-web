'use client';

import { useRouter } from 'next/navigation';
import { useModalStore } from '@/lib/stores/modalStore';
import { useUserPostCount } from '@/hooks/community/useUserPostCount';

interface ProfileActionRowProps {
  userId: string;
}

/**
 * 프로필 액션 로우: 게시글/팔로워/팔로잉 스탯 + 프로필 편집 버튼
 */
export default function ProfileActionRow({ userId }: ProfileActionRowProps) {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);
  const { data: postCount = 0 } = useUserPostCount(userId);

  const handleComingSoon = () => {
    openModal('alert', {
      title: '준비 중',
      message: '팔로워/팔로잉 기능을 준비하고 있어요!',
      buttonText: '확인',
    });
  };

  return (
    <div className="space-y-3">
      {/* 스탯 인라인 */}
      <div className="flex items-center gap-3 text-sm">
        <span>
          <span className="font-semibold text-foreground">{postCount}</span>
          <span className="text-muted-foreground ml-1">게시글</span>
        </span>
        <button onClick={handleComingSoon}>
          <span className="font-semibold text-foreground">0</span>
          <span className="text-muted-foreground ml-1">팔로워</span>
        </button>
        <button onClick={handleComingSoon}>
          <span className="font-semibold text-foreground">0</span>
          <span className="text-muted-foreground ml-1">팔로잉</span>
        </button>
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
