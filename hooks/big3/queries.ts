'use client';

import { big3Api } from '@/lib/api/big3';
import { queryKeys } from '@/lib/constants/queryKeys';
import { useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
import type { Big3LiftType } from '@/lib/types/big3';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * Big3 기록 목록 조회
 */
export function useBig3Records(
  options?: { liftType?: Big3LiftType; limit?: number; offset?: number; enabled?: boolean },
) {
  const { liftType, limit = 50, offset = 0, enabled } = options ?? {};
  return useBaseQuery(
    queryKeys.big3.list(liftType, limit, offset),
    () => big3Api.getRecords({ liftType, limit, offset }),
    { enabled },
  );
}

/**
 * Big3 요약 정보 조회
 */
export function useBig3Summary(months = 6, options?: { enabled?: boolean }) {
  return useBaseQuery(
    queryKeys.big3.summary(months),
    () => big3Api.getSummary(months),
    options,
  );
}

/**
 * 특정 사용자의 Big3 요약 정보 조회
 */
export function useUserBig3Summary(userId: string | undefined, months = 6) {
  return useConditionalQuery(
    queryKeys.big3.userSummary(userId || '', months),
    () => big3Api.getUserSummary(userId!, months),
    userId,
  );
}

// ============================================================================
// Suspense Query Hooks
// ============================================================================

/**
 * Big3 기록 목록 조회 (Suspense)
 */
export function useBig3RecordsSuspense(
  options?: { liftType?: Big3LiftType; limit?: number; offset?: number },
) {
  const { liftType, limit = 50, offset = 0 } = options ?? {};
  return useSuspenseBaseQuery(
    queryKeys.big3.list(liftType, limit, offset),
    () => big3Api.getRecords({ liftType, limit, offset }),
  );
}

/**
 * Big3 요약 정보 조회 (Suspense)
 */
export function useBig3SummarySuspense(months = 6) {
  return useSuspenseBaseQuery(
    queryKeys.big3.summary(months),
    () => big3Api.getSummary(months),
  );
}

/**
 * 특정 사용자의 Big3 요약 정보 조회 (Suspense)
 */
export function useUserBig3SummarySuspense(userId: string, months = 6) {
  return useSuspenseBaseQuery(
    queryKeys.big3.userSummary(userId, months),
    () => big3Api.getUserSummary(userId, months),
  );
}
