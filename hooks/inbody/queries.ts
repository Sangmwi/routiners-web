'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';
import { inbodyApi } from '@/lib/api/inbody';
import { queryKeys } from '@/lib/constants/queryKeys';
import { STALE_TIME, useBaseQuery, useConditionalQuery, useSuspenseBaseQuery } from '@/hooks/common';
import { PAGINATION } from '@/lib/constants/pagination';

// ============================================================================
// Query Config Factories
// ============================================================================

function inBodyRecordsConfig(limit = 20, offset = 0) {
  return {
    queryKey: queryKeys.inbody.list(limit, offset),
    queryFn: () => inbodyApi.getRecords(limit, offset),
  };
}

function latestInBodyConfig() {
  return {
    queryKey: queryKeys.inbody.latest(),
    queryFn: inbodyApi.getLatest,
  };
}

function inBodySummaryConfig() {
  return {
    queryKey: queryKeys.inbody.summary(),
    queryFn: inbodyApi.getSummary,
  };
}

function userInBodySummaryConfig(userId: string) {
  return {
    queryKey: queryKeys.inbody.userSummary(userId),
    queryFn: () => inbodyApi.getUserSummary(userId),
  };
}

function inBodyRecordConfig(id: string) {
  return {
    queryKey: queryKeys.inbody.detail(id),
    queryFn: () => inbodyApi.getRecord(id),
  };
}

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
  const { queryKey, queryFn } = inBodyRecordsConfig(limit, offset);
  return useBaseQuery(queryKey, queryFn, options);
}

/**
 * 최신 InBody 기록 조회
 */
export function useLatestInBody() {
  const { queryKey, queryFn } = latestInBodyConfig();
  return useBaseQuery(queryKey, queryFn);
}

/**
 * InBody 요약 정보 조회 (프로필 표시용)
 */
export function useInBodySummary(options?: { enabled?: boolean }) {
  const { queryKey, queryFn } = inBodySummaryConfig();
  return useBaseQuery(queryKey, queryFn, options);
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

/**
 * InBody 기록 무한스크롤 목록 조회 (Suspense)
 */
export function useInfiniteInBodyRecordsSuspense() {
  return useSuspenseInfiniteQuery({
    queryKey: queryKeys.inbody.infinite(),
    queryFn: ({ pageParam = 1 }) =>
      inbodyApi.fetchRecords({ page: pageParam, limit: PAGINATION.DEFAULT_LIMIT }),
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
  const { queryKey, queryFn } = inBodyRecordsConfig(limit, offset);
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 최신 InBody 기록 조회 (Suspense)
 */
export function useLatestInBodySuspense() {
  const { queryKey, queryFn } = latestInBodyConfig();
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * InBody 요약 정보 조회 (Suspense)
 */
export function useInBodySummarySuspense() {
  const { queryKey, queryFn } = inBodySummaryConfig();
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 특정 사용자의 InBody 요약 정보 조회 (Suspense)
 */
export function useUserInBodySummarySuspense(userId: string) {
  const { queryKey, queryFn } = userInBodySummaryConfig(userId);
  return useSuspenseBaseQuery(queryKey, queryFn);
}

/**
 * 특정 InBody 기록 조회 (Suspense)
 *
 * @param id - 필수: 기록 ID
 */
export function useInBodyRecordSuspense(id: string) {
  const { queryKey, queryFn } = inBodyRecordConfig(id);
  return useSuspenseBaseQuery(queryKey, queryFn);
}
