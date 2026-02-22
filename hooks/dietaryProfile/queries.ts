'use client';

import { dietaryProfileApi } from '@/lib/api/dietaryProfile';
import { DietaryProfile } from '@/lib/types/meal';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useSuspenseBaseQuery } from '@/hooks/common';

/**
 * 현재 사용자의 식단 프로필 조회
 */
export function useDietaryProfile() {
  return useBaseQuery<DietaryProfile | null>(
    queryKeys.dietaryProfile.me(),
    dietaryProfileApi.getDietaryProfile
  );
}

/**
 * 현재 사용자의 식단 프로필 조회 (Suspense)
 *
 * Suspense boundary 내부에서 사용해야 합니다.
 * data는 null일 수 있습니다 (프로필 미생성 시).
 */
export function useDietaryProfileSuspense() {
  return useSuspenseBaseQuery<DietaryProfile | null>(
    queryKeys.dietaryProfile.me(),
    dietaryProfileApi.getDietaryProfile
  );
}
