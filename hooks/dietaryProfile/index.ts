/**
 * Dietary Profile Hooks
 *
 * 식단 프로필 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { dietaryProfileApi } from '@/lib/api/dietaryProfile';
import { DietaryProfile, DietaryProfileUpdateData } from '@/lib/types/meal';
import { queryKeys } from '@/lib/constants/queryKeys';
import { ApiError } from '@/lib/types';

/**
 * 현재 사용자의 식단 프로필 조회
 *
 * @param options - React Query 옵션
 * @returns 식단 프로필 쿼리 결과
 */
export function useDietaryProfile(
  options?: Omit<UseQueryOptions<DietaryProfile | null, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.dietaryProfile.me(),
    queryFn: () => dietaryProfileApi.getDietaryProfile(),
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

/**
 * 현재 사용자의 식단 프로필 조회 (Suspense)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 *
 * @returns 식단 프로필 (null 가능 — 프로필 미생성 시)
 */
export function useDietaryProfileSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.dietaryProfile.me(),
    queryFn: () => dietaryProfileApi.getDietaryProfile(),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 식단 프로필 업데이트 mutation
 *
 * @returns mutation 결과와 메서드
 */
export function useUpdateDietaryProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DietaryProfileUpdateData) =>
      dietaryProfileApi.updateDietaryProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.dietaryProfile.me(), updatedProfile);
    },
  });
}

/**
 * 식단 프로필에 데이터가 있는지 확인하는 헬퍼
 *
 * @param profile - 식단 프로필
 * @returns 데이터가 있으면 true
 */
export function hasDietaryProfileData(profile: DietaryProfile | null | undefined): boolean {
  if (!profile) return false;

  return !!(
    profile.dietaryGoal ||
    profile.dietType ||
    profile.targetCalories ||
    profile.targetProtein ||
    profile.mealsPerDay ||
    (profile.foodRestrictions && profile.foodRestrictions.length > 0) ||
    (profile.availableSources && profile.availableSources.length > 0) ||
    (profile.eatingHabits && profile.eatingHabits.length > 0) ||
    (profile.preferences && profile.preferences.length > 0)
  );
}
