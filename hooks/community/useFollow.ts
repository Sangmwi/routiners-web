'use client';

/**
 * Follow Hooks
 *
 * 팔로우/언팔로우 상태 관리 및 토글 기능
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/constants/queryKeys';
import { api } from '@/lib/api/client';
import { STALE_TIME } from '@/hooks/common';

interface FollowStatus {
  isFollowing: boolean;
}

async function fetchFollowStatus(userId: string): Promise<FollowStatus> {
  return api.getOrThrow<FollowStatus>(`/api/user/${userId}/follow-status`);
}

async function toggleFollow(userId: string): Promise<FollowStatus> {
  return api.post<FollowStatus>(`/api/user/${userId}/follow`, {});
}

/**
 * 특정 사용자에 대한 팔로우 상태 조회
 *
 * React Query deduplication으로 동일 userId는 1회만 fetch
 */
export function useFollowStatus(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.follow.status(userId ?? ''),
    queryFn: () => fetchFollowStatus(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME.default,
  });
}

/**
 * 팔로우 토글 뮤테이션 (낙관적 업데이트)
 */
export function useToggleFollow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => toggleFollow(userId),
    onMutate: async (userId) => {
      const queryKey = queryKeys.follow.status(userId);

      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey });

      // 이전 상태 저장
      const prev = queryClient.getQueryData<FollowStatus>(queryKey);

      // 낙관적 업데이트
      queryClient.setQueryData<FollowStatus>(queryKey, (old) => ({
        isFollowing: !old?.isFollowing,
      }));

      return { prev, userId };
    },
    onError: (_err, userId, context) => {
      // 에러 시 롤백
      if (context?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.follow.status(userId), context.prev);
      }
    },
    onSettled: (_data, _err, userId) => {
      // 서버 데이터와 최종 재동기화
      queryClient.invalidateQueries({ queryKey: queryKeys.follow.status(userId) });
      // 해당 유저 프로필(팔로워 수) 업데이트
      queryClient.invalidateQueries({ queryKey: queryKeys.user.detail(userId) });
    },
  });
}
