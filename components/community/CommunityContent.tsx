'use client';

import { useRef, useEffect, useState } from 'react';
import PostCard from './PostCard';
import PostMoreMenu from './PostMoreMenu';
import CommentDrawer from './CommentDrawer';
import { LoadingSpinner } from '@/components/ui/icons';
import { useInfiniteCommunityPosts } from '@/hooks/community/queries';
import { useToggleLike } from '@/hooks/community/mutations';
import { useCurrentUserProfile } from '@/hooks/profile/queries';
import { useNavigate } from '@/hooks/navigation';
import AppLink from '@/components/common/AppLink';
import type { PostCategory } from '@/lib/types/community';

interface CommunityContentProps {
  category: PostCategory | 'all';
  search?: string;
  dateRange?: 'all' | 'today' | 'week' | 'month';
}

/**
 * 커뮤니티 게시글 목록 (무한스크롤)
 */
export default function CommunityContent({
  category,
  search,
  dateRange,
}: CommunityContentProps) {
  const { push, prefetch } = useNavigate();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleLike = useToggleLike();
  const { data: currentUser } = useCurrentUserProfile();

  // 댓글 드로어
  const [commentPostId, setCommentPostId] = useState<string | null>(null);

  // 더보기 메뉴
  const [moreMenuPostId, setMoreMenuPostId] = useState<string | null>(null);

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteCommunityPosts(
    category === 'all' ? undefined : category,
    20,
    search,
    dateRange
  );

  // IntersectionObserver로 무한스크롤
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId);
  };

  const handleComment = (postId: string) => {
    setCommentPostId(postId);
  };

  const handleAuthorClick = (authorId: string) => {
    push(`/profile/user/${authorId}`);
  };

  const handleMore = (postId: string) => {
    setMoreMenuPostId(postId);
  };

  const handleDeleted = () => {
    setMoreMenuPostId(null);
  };

  const posts = data.pages.flatMap((page) => page.posts);

  // 피드에 보이는 작성자 프로필 페이지 prefetch (탭 시 즉시 전환)
  useEffect(() => {
    if (!posts.length) return;
    const uniqueAuthorIds = [...new Set(posts.map((p) => p.authorId))];
    uniqueAuthorIds.forEach((id) => prefetch(`/profile/user/${id}`));
  }, [posts]);

  return (
    <div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-2">
            {search ? '검색 결과가 없어요' : '아직 게시글이 없어요'}
          </p>
          {!search && (
            <AppLink
              href="/community/write"
              className="text-sm text-primary hover:underline"
            >
              첫 번째 글을 작성해보세요
            </AppLink>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-edge-faint">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={() => handleLike(post.id)}
                onComment={() => handleComment(post.id)}
                onAuthorClick={() => handleAuthorClick(post.authorId)}
                onMore={() => handleMore(post.id)}
                showMoreButton={currentUser?.id === post.authorId}
                showFollowButton={!!currentUser && currentUser.id !== post.authorId}
              />
            ))}
          </div>

          {/* 무한스크롤 sentinel */}
          <div ref={sentinelRef} className="h-1" />

          {/* 추가 로딩 스피너 */}
          {isFetchingNextPage && (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* 모든 데이터 로드 완료 */}
          {!hasNextPage && posts.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-4">
              모든 게시글을 불러왔어요
            </p>
          )}
        </>
      )}

      {/* 댓글 드로어 */}
      <CommentDrawer
        isOpen={!!commentPostId}
        onClose={() => setCommentPostId(null)}
        postId={commentPostId ?? ''}
      />

      {/* 더보기 메뉴 */}
      <PostMoreMenu
        isOpen={!!moreMenuPostId}
        onClose={() => setMoreMenuPostId(null)}
        postId={moreMenuPostId ?? ''}
        isOwner={currentUser?.id === posts.find((p) => p.id === moreMenuPostId)?.authorId}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
