'use client';

import { HeartIcon, ChatCircleIcon, ShareNetworkIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';

interface PostCardProps {
  author: string;
  authorAvatar?: string;
  timeAgo: string;
  content: string;
  likes?: number;
  comments?: number;
  onClick?: () => void;
}

/**
 * 커뮤니티 게시글 카드
 */
export default function PostCard({
  author,
  authorAvatar,
  timeAgo,
  content,
  likes = 0,
  comments = 0,
  onClick,
}: PostCardProps) {
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
            alt={author}
            fill
            className="object-cover"
            fallbackClassName="bg-primary/10"
            showFallbackIcon={false}
          />
          {!authorAvatar && (
            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-primary">
              {author.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-card-foreground">{author}</p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
      </div>

      {/* 게시글 내용 */}
      <p className="text-sm text-foreground mb-3 leading-relaxed">{content}</p>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-4 pt-2 border-t border-border/30">
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <HeartIcon size={16} />
          <span className="text-xs font-medium">{likes}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
          <ChatCircleIcon size={16} />
          <span className="text-xs font-medium">{comments}</span>
        </button>
        <button className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors ml-auto">
          <ShareNetworkIcon size={16} />
        </button>
      </div>
    </div>
  );
}
