'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { User, ProfileUpdateData } from '@/lib/types';
import { profileApi } from '@/lib/api/profile';
import { queryKeys } from '@/lib/constants/queryKeys';

// ============================================================================
// Profile Mutations
// ============================================================================

/**
 * 프로필 업데이트 Mutation
 *
 * Features:
 * - 낙관적 업데이트 (Optimistic Update)
 * - 자동 캐시 무효화
 * - 에러 시 롤백
 *
 * @example
 * const updateProfile = useUpdateProfile();
 *
 * updateProfile.mutate({
 *   bio: '새로운 소개글',
 *   height: 180,
 * }, {
 *   onSuccess: () => {
 *     toast.success('프로필이 업데이트되었습니다');
 *   },
 * });
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: profileApi.updateProfile,

    // 낙관적 업데이트
    onMutate: async (newData: ProfileUpdateData) => {
      // 진행 중인 refetch 취소
      await queryClient.cancelQueries({ queryKey: queryKeys.user.me() });

      // 이전 값 스냅샷
      const previousUser = queryClient.getQueryData<User>(queryKeys.user.me());

      // 낙관적으로 캐시 업데이트
      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.user.me(), {
          ...previousUser,
          ...newData,
        });
      }

      // 롤백을 위한 context 반환
      return { previousUser };
    },

    // 에러 발생 시 롤백
    onError: (error, variables, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(queryKeys.user.me(), context.previousUser);
      }
    },

    // 성공 시 관련 쿼리 무효화
    onSuccess: (updatedUser) => {
      // 현재 사용자 캐시 즉시 업데이트 (깜빡임 방지)
      queryClient.setQueryData(queryKeys.user.me(), updatedUser);

      // 검색 결과 백그라운드 무효화 (refetch 지연)
      // 페이지 이동 후 처리되므로 UI에 영향 없음
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: queryKeys.user.search(),
          exact: false,
        });
      }, 100);
    },
  });
}
