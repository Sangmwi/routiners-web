'use client';

import { progressApi } from '@/lib/api/progress';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useSuspenseBaseQuery } from '@/hooks/common';

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
