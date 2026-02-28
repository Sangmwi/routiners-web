'use client';

import { useSuspenseFollowStatus, useToggleFollow } from '@/hooks/community/useFollow';
import { useModalStore } from '@/lib/stores/modalStore';

interface ProfileFollowButtonProps {
  targetUserId: string;
}

/**
 * 다른 유저 프로필 페이지 팔로우 버튼
 *
 * - 프로필 편집 버튼과 동일한 full-width 스타일
 * - "팔로우" → 채워진 버튼 (bg-foreground text-background)
 * - "팔로잉" → 아웃라인 버튼 (border-border, 프로필 편집과 동일)
 * - 팔로잉 취소 시 confirm 모달
 * - useSuspenseFollowStatus 사용 → 부모가 <Suspense>로 감싸야 함
 *   (피드에서 캐시된 경우 suspend 없이 즉시 반환)
 */
export default function ProfileFollowButton({ targetUserId }: ProfileFollowButtonProps) {
  const { data } = useSuspenseFollowStatus(targetUserId);
  const toggleFollow = useToggleFollow();
  const openModal = useModalStore((state) => state.openModal);

  const isFollowing = data.isFollowing;

  const handleClick = () => {
    if (isFollowing) {
      openModal('confirm', {
        title: '팔로잉 취소',
        message: '팔로잉을 취소하시겠어요?',
        confirmText: '취소',
        cancelText: '닫기',
        variant: 'danger',
        onConfirm: () => toggleFollow.mutate(targetUserId),
      });
    } else {
      toggleFollow.mutate(targetUserId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className={`w-full rounded-xl py-2.5 text-sm font-medium transition-colors ${
        isFollowing
          ? 'border border-border text-foreground hover:bg-surface-muted'
          : 'bg-foreground text-background hover:opacity-90'
      }`}
    >
      {isFollowing ? '팔로잉' : '팔로우'}
    </button>
  );
}
