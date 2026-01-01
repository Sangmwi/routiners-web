'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryOptions,
} from '@tanstack/react-query';
import { User, ProfileUpdateData } from '@/lib/types';
import { profileApi, profileSearchApi, ProfileSearchFilters } from '@/lib/api/profile';
import { queryKeys } from '@/lib/constants/queryKeys';

/**
 * Profile Query Hooks
 *
 * 프로필 조회 관련 React Query 훅
 */

/**
 * 현재 사용자 프로필 조회
 *
 * @example
 * const { data: user, isLoading } = useCurrentUserProfile();
 */
export function useCurrentUserProfile(
  options?: Omit<UseQueryOptions<User | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.user.me(),
    queryFn: profileApi.getCurrentUserProfile,
    staleTime: 5 * 60 * 1000, // 5분간 fresh
    ...options,
  });
}

/**
 * 특정 사용자 프로필 조회
 *
 * @param userId - 조회할 사용자 ID
 * @param options - React Query 옵션
 *
 * @example
 * const { data: user } = useUserProfile('user-123');
 */
export function useUserProfile(
  userId: string | undefined,
  options?: Omit<UseQueryOptions<User | null>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.user.detail(userId || ''),
    queryFn: () => profileApi.getUserProfile(userId!),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh
    ...options,
  });
}

/**
 * 프로필 검색
 *
 * @param filters - 검색 필터
 * @param options - React Query 옵션
 *
 * @example
 * const { data: searchResult } = useSearchProfiles({
 *   interestedExercises: ['헬스(웨이트리프팅)'],
 *   unitIds: ['unit-123'],
 * });
 */
export function useSearchProfiles(
  filters?: ProfileSearchFilters,
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.user.search(filters),
    queryFn: () => profileSearchApi.searchProfiles(filters || {}),
    staleTime: 1 * 60 * 1000, // 1분간 fresh
    ...options,
  });
}

/**
 * 추천 프로필 조회
 *
 * 현재 사용자와 유사한 프로필을 추천
 *
 * @param limit - 반환할 프로필 수 (기본 20)
 * @param options - React Query 옵션
 *
 * @example
 * const { data: recommendations } = useRecommendedProfiles(10);
 */
export function useRecommendedProfiles(
  limit: number = 20,
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.user.recommendations(limit),
    queryFn: () => profileSearchApi.getRecommendedProfiles(limit),
    staleTime: 5 * 60 * 1000, // 5분간 fresh (자주 변하지 않음)
    ...options,
  });
}

/**
 * 같은 부대 사용자 조회
 *
 * @param unitId - 부대 ID
 * @param limit - 반환할 사용자 수 (기본 20)
 * @param options - React Query 옵션
 *
 * @example
 * const { data: sameUnitUsers } = useSameUnitUsers('unit-123');
 */
export function useSameUnitUsers(
  unitId: string | undefined,
  limit: number = 20,
  options?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.user.sameUnit(unitId || '', limit),
    queryFn: () => profileSearchApi.getSameUnitUsers(unitId!, limit),
    enabled: !!unitId,
    staleTime: 3 * 60 * 1000, // 3분간 fresh
    ...options,
  });
}

/**
 * Profile Mutation Hooks
 *
 * 프로필 수정 관련 React Query 훅
 */

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

/**
 * Utility Hooks
 *
 * 유틸리티 훅들
 */

/**
 * 프로필 완성도 계산
 *
 * @param user - User 객체
 * @returns 프로필 완성도 (0-100)
 *
 * @example
 * const { data: user } = useCurrentUserProfile();
 * const progress = useProfileProgress(user);
 */
export function useProfileProgress(user: User | null | undefined): number {
  if (!user) return 0;

  const fields = [
    user.profileImages?.[0],
    user.bio,
    user.height,
    user.weight,
    user.muscleMass,
    user.bodyFatPercentage,
    user.interestedExercises?.length,
    user.interestedLocations?.length,
    user.isSmoker !== undefined,
  ];

  const filledFields = fields.filter(Boolean).length;
  const totalFields = fields.length;

  return Math.round((filledFields / totalFields) * 100);
}

/**
 * 프로필 유사도 계산 (두 사용자 간)
 *
 * @param user1 - 첫 번째 사용자
 * @param user2 - 두 번째 사용자
 * @returns 유사도 점수 (0-100)
 *
 * @example
 * const similarity = useProfileSimilarity(currentUser, targetUser);
 */
export function useProfileSimilarity(
  user1: User | null | undefined,
  user2: User | null | undefined
): number {
  if (!user1 || !user2) return 0;

  let score = 0;
  let maxScore = 0;

  // 같은 부대 (40점)
  maxScore += 40;
  if (user1.unitId === user2.unitId) {
    score += 40;
  }

  // 관심 운동 겹침 (30점)
  maxScore += 30;
  const commonExercises = user1.interestedExercises?.filter((ex) =>
    user2.interestedExercises?.includes(ex)
  ).length || 0;
  const totalExercises = Math.max(
    user1.interestedExercises?.length || 0,
    user2.interestedExercises?.length || 0
  );
  if (totalExercises > 0) {
    score += (commonExercises / totalExercises) * 30;
  }

  // 관심 장소 겹침 (20점)
  maxScore += 20;
  const commonLocations = user1.interestedLocations?.filter((loc) =>
    user2.interestedLocations?.includes(loc)
  ).length || 0;
  const totalLocations = Math.max(
    user1.interestedLocations?.length || 0,
    user2.interestedLocations?.length || 0
  );
  if (totalLocations > 0) {
    score += (commonLocations / totalLocations) * 20;
  }

  // 체격 유사도 (10점)
  maxScore += 10;
  if (user1.height && user2.height && user1.weight && user2.weight) {
    const heightDiff = Math.abs(user1.height - user2.height);
    const weightDiff = Math.abs(user1.weight - user2.weight);

    // 신장 5cm, 체중 5kg 이내면 만점
    const heightScore = Math.max(0, 5 - heightDiff) / 5 * 5;
    const weightScore = Math.max(0, 5 - weightDiff) / 5 * 5;
    score += heightScore + weightScore;
  }

  return Math.round((score / maxScore) * 100);
}
