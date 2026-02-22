'use client';

import { useRouter } from 'next/navigation';
import { useModalStore } from '@/lib/stores/modalStore';

/**
 * 프로필 액션 로우: 팔로워 / 팔로잉 / 프로필 편집
 */
export default function ProfileActionRow() {
  const router = useRouter();
  const openModal = useModalStore((state) => state.openModal);

  const handleComingSoon = () => {
    openModal('alert', {
      title: '준비 중',
      message: '팔로워/팔로잉 기능을 준비하고 있어요!',
      buttonText: '확인',
    });
  };

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-3 flex items-center">
      {/* 팔로워 */}
      <button
        onClick={handleComingSoon}
        className="flex-1 flex flex-col items-center gap-0.5 py-1"
      >
        <span className="text-base font-bold text-foreground">0</span>
        <span className="text-xs text-muted-foreground">팔로워</span>
      </button>

      <div className="w-px h-8 bg-border/30" />

      {/* 팔로잉 */}
      <button
        onClick={handleComingSoon}
        className="flex-1 flex flex-col items-center gap-0.5 py-1"
      >
        <span className="text-base font-bold text-foreground">0</span>
        <span className="text-xs text-muted-foreground">팔로잉</span>
      </button>

      <div className="w-px h-8 bg-border/30" />

      {/* 프로필 편집 */}
      <button
        onClick={() => router.push('/profile/edit')}
        className="flex-1 flex items-center justify-center py-2"
      >
        <span className="text-sm font-medium text-primary">프로필 편집</span>
      </button>
    </div>
  );
}
