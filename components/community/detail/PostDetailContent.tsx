'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DotsThreeVerticalIcon } from '@phosphor-icons/react';
import { ImageWithFallback } from '@/components/ui/image';
import { useCommunityPost } from '@/hooks/community/queries';
import { useToggleLike } from '@/hooks/community/mutations';
import { useCurrentUserProfile } from '@/hooks/profile/queries';
import { formatTimeAgo } from '@/lib/types/community';
import { RANK_OPTIONS } from '@/lib/constants/military';
import PostImageGallery from './PostImageGallery';
import PostActions from './PostActions';
import PostMoreMenu from './PostMoreMenu';
import CommentSection from '../comments/CommentSection';

interface PostDetailContentProps {
  postId: string;
}

export default function PostDetailContent({ postId }: PostDetailContentProps) {
  const router = useRouter();
  const { data: post } = useCommunityPost(postId);
  const { data: currentUser } = useCurrentUserProfile();
  const toggleLike = useToggleLike();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const author = post.author;
  const authorName = author?.nickname ?? '알 수 없음';
  const authorAvatar = author?.profileImage;
  const authorRank = author?.rank
    ? RANK_OPTIONS.find((r) => r.value === author.rank)?.label ?? ''
    : '';
  const timeAgo = formatTimeAgo(post.createdAt);
  const isOwner = currentUser?.id === post.authorId;

  const handleLike = () => {
    toggleLike.mutate(postId);
  };

  const handleDeleted = () => {
    router.replace('/community');
  };

  return (
    <div className="space-y-4">
      {/* 작성자 영역 */}
      <div className="flex items-center gap-3">
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
          <p className="text-sm font-medium text-foreground">
            {authorName}
            {authorRank && (
              <span className="ml-1 text-xs text-muted-foreground">
                ({authorRank})
              </span>
            )}
          </p>
          <p className="text-xs text-muted-foreground">{timeAgo}</p>
        </div>
        <button
          onClick={() => setShowMoreMenu(true)}
          className="p-2 rounded-full hover:bg-muted/30 transition-colors text-muted-foreground"
        >
          <DotsThreeVerticalIcon size={20} weight="bold" />
        </button>
      </div>

      {/* 본문 */}
      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {post.content}
      </p>

      {/* 이미지 갤러리 */}
      {post.imageUrls.length > 0 && (
        <PostImageGallery images={post.imageUrls} />
      )}

      {/* 액션 바 */}
      <PostActions
        post={post}
        onLike={handleLike}
      />

      {/* 댓글 섹션 */}
      <CommentSection postId={postId} commentsCount={post.commentsCount} />

      {/* 더보기 메뉴 */}
      <PostMoreMenu
        isOpen={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        postId={postId}
        isOwner={isOwner}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
