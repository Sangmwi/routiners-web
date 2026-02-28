'use client';

import { useRef, useEffect, useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME } from '@/hooks/common';
import { fetchCommunityPosts } from '@/lib/api/community';
import { useToggleLike } from '@/hooks/community/mutations';
import { useCurrentUserProfile } from '@/hooks/profile/queries';
import PostCard from './PostCard';
import PostMoreMenu from './PostMoreMenu';
import CommentDrawer from './CommentDrawer';
import { LoadingSpinner } from '@/components/ui/icons';
import { useNavigate } from '@/hooks/navigation';

interface UserPostFeedProps {
  userId: string;
  startIndex: number;
}

const PAGE_SIZE = 12;

/**
 * 유저 게시글 피드 뷰 (양방향 무한스크롤)
 *
 * 프로필 그리드에서 탭한 게시글 중심으로 피드가 열리며,
 * 위로 스크롤하면 최신 게시글, 아래로 스크롤하면 과거 게시글 로드
 */
export default function UserPostFeed({ userId, startIndex }: UserPostFeedProps) {
  const { push, prefetch } = useNavigate();
  const toggleLike = useToggleLike();
  const { data: currentUser } = useCurrentUserProfile();

  // 댓글 드로어
  const [commentPostId, setCommentPostId] = useState<string | null>(null);
  // 더보기 메뉴
  const [moreMenuPostId, setMoreMenuPostId] = useState<string | null>(null);

  // startIndex에서 어떤 페이지인지 계산
  const initialPage = Math.floor(startIndex / PAGE_SIZE) + 1;
  const indexInPage = startIndex % PAGE_SIZE;

  const targetPostRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const hasScrolled = useRef(false);

  const {
    data,
    fetchNextPage,
    fetchPreviousPage,
    hasNextPage,
    hasPreviousPage,
    isFetchingNextPage,
    isFetchingPreviousPage,
  } = useInfiniteQuery({
    queryKey: [...queryKeys.post.list({ authorId: userId }), 'feed', initialPage],
    queryFn: ({ pageParam }) =>
      fetchCommunityPosts({ authorId: userId, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    getPreviousPageParam: (firstPage) =>
      firstPage.page > 1 ? firstPage.page - 1 : undefined,
    initialPageParam: initialPage,
    staleTime: STALE_TIME.default,
  });

  // 초기 로드 후 타겟 게시글로 스크롤
  useEffect(() => {
    if (hasScrolled.current || !data?.pages.length) return;

    // 약간의 딜레이 후 스크롤 (DOM 렌더링 대기)
    const timer = setTimeout(() => {
      targetPostRef.current?.scrollIntoView({ block: 'start' });
      hasScrolled.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [data?.pages.length]);

  // 하단 무한스크롤 (과거 게시글)
  useEffect(() => {
    const sentinel = bottomSentinelRef.current;
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

  // 상단 무한스크롤 (최신 게시글)
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel || !hasScrolled.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasPreviousPage && !isFetchingPreviousPage) {
          fetchPreviousPage();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasPreviousPage, isFetchingPreviousPage, fetchPreviousPage]);

  const allPosts = data?.pages.flatMap((page) => page.posts) ?? [];

  // 피드에 보이는 작성자 프로필 페이지 prefetch (탭 시 즉시 전환)
  useEffect(() => {
    if (!allPosts.length) return;
    const uniqueAuthorIds = [...new Set(allPosts.map((p) => p.authorId))];
    uniqueAuthorIds.forEach((id) => prefetch(`/profile/user/${id}`));
  }, [allPosts]);

  // initialPage의 첫 번째 페이지에서 indexInPage번째가 타겟
  // pages는 initialPage부터 시작하므로 첫 페이지의 indexInPage가 타겟
  const targetGlobalIndex = indexInPage;

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

  if (!data) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      {/* 상단 센티널 — 최신 게시글 로드 */}
      <div ref={topSentinelRef} className="h-1" />

      {isFetchingPreviousPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* 게시글 목록 */}
      <div className="divide-y divide-edge-faint">
        {allPosts.map((post, index) => (
          <div
            key={post.id}
            ref={index === targetGlobalIndex ? targetPostRef : undefined}
          >
            <PostCard
              post={post}
              onLike={() => handleLike(post.id)}
              onComment={() => handleComment(post.id)}
              onAuthorClick={() => handleAuthorClick(post.authorId)}
              onMore={() => handleMore(post.id)}
              showMoreButton={currentUser?.id === post.authorId}
              showFollowButton={!!currentUser && currentUser.id !== post.authorId}
            />
          </div>
        ))}
      </div>

      {/* 하단 센티널 — 과거 게시글 로드 */}
      <div ref={bottomSentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!hasNextPage && allPosts.length > 0 && (
        <p className="text-center text-xs text-muted-foreground py-4">
          모든 게시글을 불러왔어요
        </p>
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
        isOwner={currentUser?.id === allPosts.find((p) => p.id === moreMenuPostId)?.authorId}
        onDeleted={handleDeleted}
      />
    </div>
  );
}
