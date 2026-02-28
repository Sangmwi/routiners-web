/**
 * Community Query Hooks
 *
 * 커뮤니티 데이터 조회용 React Query 훅
 */

import {
  useSuspenseQuery,
  useSuspenseInfiniteQuery,
  useQuery,
} from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME } from '@/hooks/common';
import {
  fetchCommunityPosts,
  fetchCommunityPost,
  fetchPostComments,
} from '@/lib/api/community';
import type { PostFilters, PostCategory } from '@/lib/types/community';

/**
 * 게시글 목록 조회 (Suspense)
 */
export function useCommunityPosts(filters: PostFilters = {}) {
  return useSuspenseQuery({
    queryKey: queryKeys.post.list(filters),
    queryFn: () => fetchCommunityPosts(filters),
    staleTime: STALE_TIME.medium,
  });
}

/**
 * 게시글 목록 무한스크롤 (Suspense)
 *
 * 첫 페이지 로드 시 suspend → 부모 <Suspense> fallback 표시
 * 추가 페이지(fetchNextPage)는 suspend 없이 isFetchingNextPage로 처리
 */
export function useInfiniteCommunityPosts(
  category?: PostCategory | 'all',
  limit: number = 20,
  search?: string,
  dateRange?: 'all' | 'today' | 'week' | 'month'
) {
  const effectiveSearch = search || undefined;
  const effectiveDateRange =
    dateRange && dateRange !== 'all' ? dateRange : undefined;

  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.post.list({
      category,
      limit,
      search: effectiveSearch,
      dateRange: effectiveDateRange,
    }),
    queryFn: ({ pageParam = 1 }) =>
      fetchCommunityPosts({
        category,
        limit,
        page: pageParam,
        search: effectiveSearch,
        dateRange: effectiveDateRange,
      }),
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      return lastPage.page + 1;
    },
    initialPageParam: 1,
    staleTime: STALE_TIME.medium,
  });
}

/**
 * 게시글 상세 조회 (Suspense)
 */
export function useCommunityPost(postId: string) {
  return useSuspenseQuery({
    queryKey: queryKeys.post.detail(postId),
    queryFn: () => fetchCommunityPost(postId),
    staleTime: STALE_TIME.medium,
  });
}

/**
 * 게시글 상세 조회 (Non-Suspense)
 */
export function useCommunityPostQuery(postId: string | null) {
  return useQuery({
    queryKey: queryKeys.post.detail(postId ?? ''),
    queryFn: () => fetchCommunityPost(postId!),
    enabled: !!postId,
    staleTime: STALE_TIME.medium,
  });
}

/**
 * 댓글 목록 조회
 */
export function usePostComments(postId: string) {
  return useQuery({
    queryKey: queryKeys.post.comments(postId),
    queryFn: () => fetchPostComments(postId),
    enabled: !!postId,
    staleTime: STALE_TIME.short,
  });
}
