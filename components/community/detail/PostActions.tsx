'use client';

import { HeartIcon, ChatCircleIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import type { CommunityPost } from '@/lib/types/community';

interface PostActionsProps {
  post: CommunityPost;
  onLike: () => void;
}

export default function PostActions({ post, onLike }: PostActionsProps) {
  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: 토스트로 "링크가 복사되었어요" 표시
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  };

  return (
    <div className="flex items-center gap-4 py-3 border-t border-b border-border/30">
      <button
        onClick={onLike}
        className={`flex items-center gap-1.5 transition-colors ${
          post.isLiked ? 'text-red-500' : 'text-muted-foreground hover:text-primary'
        }`}
      >
        <HeartIcon size={20} weight={post.isLiked ? 'fill' : 'regular'} />
        <span className="text-sm font-medium">{post.likesCount}</span>
      </button>

      <button className="flex items-center gap-1.5 text-muted-foreground">
        <ChatCircleIcon size={20} />
        <span className="text-sm font-medium">{post.commentsCount}</span>
      </button>

      <button
        onClick={handleShare}
        className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors ml-auto"
      >
        <ShareNetworkIcon size={20} />
      </button>
    </div>
  );
}
