'use client';

/**
 * Follow Hooks
 *
 * 팔로우/언팔로우 상태 관리 및 토글 기능
 */

import { useQuery, useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
 *
 * @param initialIsFollowing - 피드 API에서 embed된 초기값. 캐시가 비어있을 때만 initialData로 사용.
 *   - 캐시에 데이터가 있으면 캐시 우선 (낙관적 업데이트 보존)
 *   - initialDataUpdatedAt = Date.now() → staleTime(5분) 동안 배경 refetch 없음
 */
export function useFollowStatus(userId: string | undefined, initialIsFollowing?: boolean) {
  return useQuery({
    queryKey: queryKeys.follow.status(userId ?? ''),
    queryFn: () => fetchFollowStatus(userId!),
    enabled: !!userId,
    staleTime: STALE_TIME.default,
    ...(initialIsFollowing !== undefined && {
      initialData: { isFollowing: initialIsFollowing },
      initialDataUpdatedAt: Date.now(),
    }),
  });
}

/**
 * 팔로우 상태 조회 (Suspense)
 *
 * 프로필 페이지에서 사용. 부모 컴포넌트가 <Suspense>로 감싸야 함.
 * 피드에서 이미 캐시된 경우 suspend 없이 즉시 반환.
 */
export function useSuspenseFollowStatus(userId: string) {
  return useSuspenseQuery({
    queryKey: queryKeys.follow.status(userId),
    queryFn: () => fetchFollowStatus(userId),
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
