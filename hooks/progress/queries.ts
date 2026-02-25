'use client';

import { progressApi } from '@/lib/api/progress';
import type { UserProgressResponse } from '@/lib/api/progress';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * 운동 진행 현황 요약 조회
 */
export function useProgressSummary(months = 6, options?: { enabled?: boolean }) {
  return useBaseQuery(
    queryKeys.progress.summary(months),
    () => progressApi.getSummary(months),
    options
  );
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * 운동 진행 현황 요약 조회 (Suspense)
 */
export function useProgressSummarySuspense(months = 6) {
  return useSuspenseBaseQuery(
    queryKeys.progress.summary(months),
    () => progressApi.getSummary(months)
  );
}

/**
 * 특정 사용자의 운동 진행 현황 조회
 */
export function useUserProgressSummary(userId: string | undefined, months = 6) {
  return useConditionalQuery<UserProgressResponse, string>(
    queryKeys.progress.userSummary(userId || '', months),
    () => progressApi.getUserSummary(userId!, months),
    userId
  );
}

/**
 * 특정 사용자의 운동 진행 현황 조회 (Suspense)
 */
export function useUserProgressSummarySuspense(userId: string, months = 6) {
  return useSuspenseBaseQuery<UserProgressResponse>(
    queryKeys.progress.userSummary(userId, months),
    () => progressApi.getUserSummary(userId, months)
  );
}
