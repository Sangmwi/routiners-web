'use client';

import { fitnessProfileApi } from '@/lib/api/fitnessProfile';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useSuspenseBaseQuery } from '@/hooks/common';

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
