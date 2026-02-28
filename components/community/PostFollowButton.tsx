'use client';

import { useFollowStatus, useToggleFollow } from '@/hooks/community/useFollow';
import { useModalStore } from '@/lib/stores/modalStore';

interface PostFollowButtonProps {
  authorId: string;
  initialIsFollowing?: boolean;
}

/**
 * 피드 카드 헤더 인라인 팔로우 버튼
 *
 * - 배경/보더 없는 텍스트 버튼
 * - "팔로우" → primary 색상 / "팔로잉" → muted 색상
 * - 팔로잉 취소 시 confirm 모달
 * - initialIsFollowing: 피드 API에서 embed된 초기값 (flash 방지)
 */
export default function PostFollowButton({ authorId, initialIsFollowing }: PostFollowButtonProps) {
  const { data } = useFollowStatus(authorId, initialIsFollowing);
  const toggleFollow = useToggleFollow();
  const openModal = useModalStore((state) => state.openModal);

  const isFollowing = data?.isFollowing ?? false;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isFollowing) {
      openModal('confirm', {
        title: '팔로잉 취소',
        message: '팔로잉을 취소하시겠어요?',
        confirmText: '취소',
        cancelText: '닫기',
        variant: 'danger',
        onConfirm: () => toggleFollow.mutate(authorId),
      });
    } else {
      toggleFollow.mutate(authorId);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={toggleFollow.isPending}
      className={`text-sm font-medium transition-colors ${
        isFollowing
          ? 'text-muted-foreground'
          : 'text-primary'
      }`}
    >
      {isFollowing ? '팔로잉' : '팔로우'}
    </button>
  );
}
