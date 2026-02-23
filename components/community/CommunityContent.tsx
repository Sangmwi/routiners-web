'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PostCard from './PostCard';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { LoadingSpinner } from '@/components/ui/icons';
import { useInfiniteCommunityPosts } from '@/hooks/community/queries';
import { useToggleLike } from '@/hooks/community/mutations';
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
  const router = useRouter();
  const sentinelRef = useRef<HTMLDivElement>(null);
  const toggleLike = useToggleLike();

  const {
    data,
    isLoading,
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

  const handleNewPost = () => {
    router.push('/community/write');
  };

  const handlePostClick = (postId: string) => {
    router.push(`/community/${postId}`);
  };

  const handleLike = (postId: string) => {
    toggleLike.mutate(postId);
  };

  // 초기 로딩
  if (isLoading) {
    return <PulseLoader />;
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  return (
    <div>
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-muted-foreground mb-2">
            {search ? '검색 결과가 없어요' : '아직 게시글이 없어요'}
          </p>
          {!search && (
            <button
              onClick={handleNewPost}
              className="text-sm text-primary hover:underline"
            >
              첫 번째 글을 작성해보세요
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="divide-y divide-border/40">
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onClick={() => handlePostClick(post.id)}
                onLike={() => handleLike(post.id)}
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
    </div>
  );
}
