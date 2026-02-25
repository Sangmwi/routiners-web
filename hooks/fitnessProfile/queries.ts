'use client';

import { fitnessProfileApi } from '@/lib/api/fitnessProfile';
import type { UserFitnessProfileResponse } from '@/lib/api/fitnessProfile';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';

/**
 * 현재 사용자의 피트니스 프로필 조회
 */
export function useFitnessProfile() {
  return useBaseQuery(
    queryKeys.fitnessProfile.me(),
    fitnessProfileApi.getFitnessProfile
  );
}

/**
 * 현재 사용자의 피트니스 프로필 조회 (Suspense)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 * data는 항상 존재합니다 (Suspense가 로딩 처리).
 */
export function useFitnessProfileSuspense() {
  return useSuspenseBaseQuery(
    queryKeys.fitnessProfile.me(),
    fitnessProfileApi.getFitnessProfile
  );
}

/**
 * 특정 사용자의 피트니스 프로필 조회
 */
export function useUserFitnessProfile(userId: string | undefined) {
  return useConditionalQuery<UserFitnessProfileResponse, string>(
    queryKeys.fitnessProfile.user(userId || ''),
    () => fitnessProfileApi.getUserProfile(userId!),
    userId
  );
}

/**
 * 특정 사용자의 피트니스 프로필 조회 (Suspense)
 */
export function useUserFitnessProfileSuspense(userId: string) {
  return useSuspenseBaseQuery<UserFitnessProfileResponse>(
    queryKeys.fitnessProfile.user(userId),
    () => fitnessProfileApi.getUserProfile(userId)
  );
}
