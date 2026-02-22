'use client';

/**
 * User Posts Hook
 *
 * 특정 사용자의 게시글을 무한스크롤로 조회 (프로필 활동 그리드용)
 */

import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME } from '@/hooks/common';
import { fetchCommunityPosts } from '@/lib/api/community';

export function useUserPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.post.list({ authorId: userId }),
    queryFn: ({ pageParam = 1 }) =>
      fetchCommunityPosts({ authorId: userId, page: pageParam, limit: 12 }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!userId,
    staleTime: STALE_TIME.medium,
  });
}
