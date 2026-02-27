'use client';

import { useRef, useState, useEffect } from 'react';
import { HeartIcon, ChatCircleIcon, ShareNetworkIcon, DotsThreeVerticalIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { useThrottle } from '@/hooks/useThrottle';
import type { CommunityPost } from '@/lib/types/community';
import { formatTimeAgo } from '@/lib/types/community';
import { RANK_OPTIONS } from '@/lib/constants/military';
import PostFollowButton from './PostFollowButton';

interface PostCardProps {
  post: CommunityPost;
  onLike?: () => void;
  onComment?: () => void;
  onAuthorClick?: () => void;
  onMore?: () => void;
  showMoreButton?: boolean;
  showFollowButton?: boolean;
}

/**
 * 커뮤니티 피드 아이템 (인스타 스타일)
 *
 * - 카드 없이 full-width
 * - 이미지는 레이아웃 패딩 무시하고 화면 꽉 채움
 * - 텍스트/액션은 레이아웃 패딩 내에서 표시
 */
export default function PostCard({ post, onLike, onComment, onAuthorClick, onMore, showMoreButton, showFollowButton }: PostCardProps) {
  const { author, content, likesCount, commentsCount, imageUrls, createdAt, isLiked } = post;

  const authorName = author?.nickname ?? '알 수 없음';
  const authorAvatar = author?.profileImage;
  const authorRank = author?.rank
    ? RANK_OPTIONS.find((r) => r.value === author.rank)?.label ?? ''
    : '';
  const timeAgo = formatTimeAgo(createdAt);

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handleCommentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onComment?.();
  };

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAuthorClick?.();
  };

  const handleMoreClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMore?.();
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = content.length > 100 ? content.slice(0, 100) + '...' : content;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // 클립보드 복사 실패 시 무시
    }
  };

  return (
    <div className="py-3">
      {/* 작성자 헤더 */}
      <div className="flex items-center gap-3 py-2.5">
        <button
          onClick={handleAuthorClick}
          className="relative h-9 w-9 overflow-hidden rounded-full bg-surface-accent border border-edge-subtle"
        >
          <ImageWithFallback
            src={authorAvatar}
            alt={authorName}
            fill
            className="object-cover"
            fallbackClassName="bg-surface-accent"
            showFallbackIcon={false}
          />
          {!authorAvatar && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-primary">
              {authorName.charAt(0)}
            </div>
          )}
        </button>
        <button onClick={handleAuthorClick} className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground leading-tight">
            {authorName}
            {authorRank && (
              <span className="ml-1 text-xs font-normal text-muted-foreground">({authorRank})</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </button>
        {showFollowButton && author?.id && (
          <PostFollowButton authorId={author.id} />
        )}
        {showMoreButton && (
          <button
            onClick={handleMoreClick}
            className="p-2 rounded-full hover:bg-surface-hover transition-colors text-muted-foreground"
          >
            <DotsThreeVerticalIcon size={20} weight="bold" />
          </button>
        )}
      </div>

      {/* 이미지 캐러셀 — full bleed (레이아웃 패딩 무시) */}
      {imageUrls.length > 0 && (
        <div className="-mx-(--layout-padding-x)">
          <PostCardImages images={imageUrls} />
        </div>
      )}

      {/* 액션 바 */}
      <div className="flex items-center gap-4 py-2.5">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked ? 'text-like' : 'text-muted-foreground'
          }`}
        >
          <HeartIcon size={20} weight={isLiked ? 'fill' : 'regular'} />
          <span className="text-sm font-medium">{likesCount}</span>
        </button>
        <button
          onClick={handleCommentClick}
          className="flex items-center gap-1.5 text-muted-foreground"
        >
          <ChatCircleIcon size={20} />
          <span className="text-sm font-medium">{commentsCount}</span>
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-muted-foreground ml-auto"
        >
          <ShareNetworkIcon size={20} />
        </button>
      </div>

      {/* 본문 */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pb-1">
        {content}
      </p>
    </div>
  );
}

/**
 * 피드 이미지 캐러셀 (세로:가로 4:3 비율, full-width)
 */
function PostCardImages({ images }: { images: string[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useThrottle(() => {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(index);
  }, 100);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {images.map((url, index) => (
          <div key={index} className="w-full shrink-0 snap-center">
            <div className="relative w-full aspect-[3/4]">
              <ImageWithFallback
                src={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, idx) => (
            <span
              key={idx}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${
                idx === activeIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
