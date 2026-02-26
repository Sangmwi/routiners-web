'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { big3Api } from '@/lib/api/big3';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME, useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
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
// Infinite Query Hooks
// ============================================================================

const PAGE_SIZE = 20;

/**
 * Big3 기록 무한스크롤 목록 조회 (Suspense)
 */
export function useInfiniteBig3RecordsSuspense(liftType?: Big3LiftType) {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.big3.infinite(liftType),
    queryFn: ({ pageParam = 1 }) =>
      big3Api.fetchRecords({ liftType, page: pageParam, limit: PAGE_SIZE }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: STALE_TIME.default,
  });
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
