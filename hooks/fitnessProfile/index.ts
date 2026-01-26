/**
 * Fitness Profile Hooks
 *
 * 피트니스 프로필 관련 React Query 훅
 */

import { useQuery, useMutation, useQueryClient, UseQueryOptions, useSuspenseQuery } from '@tanstack/react-query';
import { fitnessProfileApi } from '@/lib/api/fitnessProfile';
import { FitnessProfile, FitnessProfileUpdateData } from '@/lib/types/fitness';
import { queryKeys } from '@/lib/constants/queryKeys';
import { ApiError } from '@/lib/types';

/**
 * 현재 사용자의 피트니스 프로필 조회
 *
 * @param options - React Query 옵션
 * @returns 피트니스 프로필 쿼리 결과
 */
export function useFitnessProfile(
  options?: Omit<UseQueryOptions<FitnessProfile, ApiError>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.fitnessProfile.me(),
    queryFn: () => fitnessProfileApi.getFitnessProfile(),
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

/**
 * 현재 사용자의 피트니스 프로필 조회 (Suspense)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 * data는 항상 존재합니다 (Suspense가 로딩 처리).
 *
 * @returns 피트니스 프로필 (항상 존재)
 */
export function useFitnessProfileSuspense() {
  return useSuspenseQuery({
    queryKey: queryKeys.fitnessProfile.me(),
    queryFn: () => fitnessProfileApi.getFitnessProfile(),
    staleTime: 5 * 60 * 1000, // 5분
  });
}

/**
 * 피트니스 프로필 업데이트 mutation
 *
 * @returns mutation 결과와 메서드
 */
export function useUpdateFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FitnessProfileUpdateData) =>
      fitnessProfileApi.updateFitnessProfile(data),
    onSuccess: (updatedProfile) => {
      // 캐시 업데이트
      queryClient.setQueryData(queryKeys.fitnessProfile.me(), updatedProfile);
    },
  });
}

/**
 * 피트니스 프로필 전체 교체 mutation
 *
 * @returns mutation 결과와 메서드
 */
export function useReplaceFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: FitnessProfileUpdateData) =>
      fitnessProfileApi.replaceFitnessProfile(data),
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(queryKeys.fitnessProfile.me(), updatedProfile);
    },
  });
}

/**
 * 피트니스 프로필 삭제 mutation
 *
 * @returns mutation 결과와 메서드
 */
export function useDeleteFitnessProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => fitnessProfileApi.deleteFitnessProfile(),
    onSuccess: () => {
      // 캐시 초기화
      queryClient.invalidateQueries({ queryKey: queryKeys.fitnessProfile.all });
    },
  });
}

/**
 * 피트니스 프로필에 데이터가 있는지 확인하는 헬퍼
 *
 * @param profile - 피트니스 프로필
 * @returns 데이터가 있으면 true
 */
export function hasFitnessProfileData(profile: FitnessProfile | undefined): boolean {
  if (!profile) return false;

  return !!(
    profile.fitnessGoal ||
    profile.experienceLevel ||
    profile.preferredDaysPerWeek ||
    profile.sessionDurationMinutes ||
    profile.equipmentAccess ||
    (profile.focusAreas && profile.focusAreas.length > 0) ||
    (profile.injuries && profile.injuries.length > 0) ||
    (profile.preferences && profile.preferences.length > 0) ||
    (profile.restrictions && profile.restrictions.length > 0)
  );
}
