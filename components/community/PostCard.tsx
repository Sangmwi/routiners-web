'use client';

import { HeartIcon, ChatCircleIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import type { CommunityPost } from '@/lib/types/community';
import { formatTimeAgo } from '@/lib/types/community';
import { RANK_OPTIONS } from '@/lib/constants/military';

interface PostCardProps {
  post: CommunityPost;
  onClick?: () => void;
  onLike?: () => void;
}

/**
 * 커뮤니티 게시글 카드
 */
export default function PostCard({ post, onClick, onLike }: PostCardProps) {
  const { author, content, likesCount, commentsCount, imageUrls, createdAt, isLiked } = post;

  // 작성자 정보
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

  return (
    <div
      onClick={onClick}
      className="rounded-xl bg-card p-4 shadow-sm border border-border/50 hover:bg-primary/5 transition-colors cursor-pointer"
    >
      {/* 작성자 정보 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-primary/10 border-2 border-primary/20">
          <ImageWithFallback
            src={authorAvatar}
            alt={authorName}
            fill
            className="object-cover"
            fallbackClassName="bg-primary/10"
            showFallbackIcon={false}
          />
          {!authorAvatar && (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
              {authorName.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-card-foreground">
            {authorName}
            {authorRank && (
              <span className="ml-1 text-xs text-muted-foreground">({authorRank})</span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* 게시글 내용 */}
      <p className="text-sm text-foreground mb-3 leading-relaxed whitespace-pre-wrap">
        {content}
      </p>

      {/* 이미지 (있는 경우) */}
      {imageUrls.length > 0 && (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {imageUrls.slice(0, 4).map((url, index) => (
            <div
              key={index}
              className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg"
            >
              <ImageWithFallback
                src={url}
                alt={`이미지 ${index + 1}`}
                fill
                className="object-cover"
              />
              {index === 3 && imageUrls.length > 4 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-sm font-medium">
                  +{imageUrls.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/30">
        <button
          onClick={handleLikeClick}
          className={`flex items-center gap-1.5 transition-colors ${
            isLiked ? 'text-destructive' : 'text-muted-foreground hover:text-primary'
          }`}
        >
          <HeartIcon size={16} weight={isLiked ? 'fill' : 'regular'} />
          <span className="text-xs font-medium">{likesCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <ChatCircleIcon size={16} />
          <span className="text-xs font-medium">{commentsCount}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors ml-auto">
          <ShareNetworkIcon size={16} />
        </button>
      </div>
    </div>
  );
}
