'use client';

/**
 * User Post Count Hook
 *
 * 특정 사용자의 게시글 수만 가볍게 조회 (프로필 스탯 표시용)
 * limit=1로 최소 데이터만 전송받고 total 필드를 사용
 */

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME } from '@/hooks/common';
import { fetchCommunityPosts } from '@/lib/api/community';

export function useUserPostCount(userId: string) {
  return useQuery({
    queryKey: queryKeys.post.list({ authorId: userId, limit: 1 }),
    queryFn: () => fetchCommunityPosts({ authorId: userId, page: 1, limit: 1 }),
    enabled: !!userId,
    staleTime: STALE_TIME.default,
    select: (data) => data.total,
  });
}
