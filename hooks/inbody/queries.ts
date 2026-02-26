'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { inbodyApi } from '@/lib/api/inbody';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME, useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';

// ============================================================================
// Standard Query Hooks
// ============================================================================

/**
 * InBody 기록 목록 조회
 */
export function useInBodyRecords(
  limit = 20,
  offset = 0,
  options?: { enabled?: boolean }
) {
  return useBaseQuery(
    queryKeys.inbody.list(limit, offset),
    () => inbodyApi.getRecords(limit, offset),
    options
  );
}

/**
 * 최신 InBody 기록 조회
 */
export function useLatestInBody() {
  return useBaseQuery(
    queryKeys.inbody.latest(),
    inbodyApi.getLatest
  );
}

/**
 * InBody 요약 정보 조회 (프로필 표시용)
 */
export function useInBodySummary(options?: { enabled?: boolean }) {
  return useBaseQuery(
    queryKeys.inbody.summary(),
    inbodyApi.getSummary,
    options
  );
}

/**
 * 특정 사용자의 InBody 요약 정보 조회
 */
export function useUserInBodySummary(userId: string | undefined, options?: { enabled?: boolean }) {
  return useConditionalQuery(
    queryKeys.inbody.userSummary(userId || ''),
    () => inbodyApi.getUserSummary(userId!),
    options?.enabled === false ? false : userId
  );
}

/**
 * 특정 InBody 기록 조회
 */
export function useInBodyRecord(id: string | undefined) {
  return useConditionalQuery(
    queryKeys.inbody.detail(id || ''),
    () => inbodyApi.getRecord(id!),
    id
  );
}

// ============================================================================
// Infinite Query Hooks
// ============================================================================

const PAGE_SIZE = 20;

/**
 * InBody 기록 무한스크롤 목록 조회 (Suspense)
 */
export function useInfiniteInBodyRecordsSuspense() {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.inbody.infinite(),
    queryFn: ({ pageParam = 1 }) =>
      inbodyApi.fetchRecords({ page: pageParam, limit: PAGE_SIZE }),
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
 * InBody 기록 목록 조회 (Suspense)
 *
 * @example
 * function InBodyListContent() {
 *   const { data: records } = useInBodyRecordsSuspense(50, 0);
 *   return <InBodyList records={records} />;
 * }
 */
export function useInBodyRecordsSuspense(limit = 20, offset = 0) {
  return useSuspenseBaseQuery(
    queryKeys.inbody.list(limit, offset),
    () => inbodyApi.getRecords(limit, offset)
  );
}

/**
 * 최신 InBody 기록 조회 (Suspense)
 */
export function useLatestInBodySuspense() {
  return useSuspenseBaseQuery(
    queryKeys.inbody.latest(),
    inbodyApi.getLatest
  );
}

/**
 * InBody 요약 정보 조회 (Suspense)
 */
export function useInBodySummarySuspense() {
  return useSuspenseBaseQuery(
    queryKeys.inbody.summary(),
    inbodyApi.getSummary
  );
}

/**
 * 특정 사용자의 InBody 요약 정보 조회 (Suspense)
 */
export function useUserInBodySummarySuspense(userId: string) {
  return useSuspenseBaseQuery(
    queryKeys.inbody.userSummary(userId),
    () => inbodyApi.getUserSummary(userId)
  );
}

/**
 * 특정 InBody 기록 조회 (Suspense)
 *
 * @param id - 필수: 기록 ID
 */
export function useInBodyRecordSuspense(id: string) {
  return useSuspenseBaseQuery(
    queryKeys.inbody.detail(id),
    () => inbodyApi.getRecord(id)
  );
}
