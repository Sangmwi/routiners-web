/**
 * Community Query Hooks
 *
 * 커뮤니티 데이터 조회용 React Query 훅
 */

import {
  useSuspenseQuery,
  useInfiniteQuery,
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
 * 게시글 목록 무한스크롤
 */
export function useInfiniteCommunityPosts(
  category?: PostCategory | 'all',
  limit: number = 20
) {
  return useInfiniteQuery({
    queryKey: queryKeys.post.list({ category, limit }),
    queryFn: ({ pageParam = 1 }) =>
      fetchCommunityPosts({ category, limit, page: pageParam }),
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
