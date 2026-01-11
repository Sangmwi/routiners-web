'use client';

import { useQuery, UseQueryOptions, UseQueryResult, QueryKey } from '@tanstack/react-query';

/**
 * 공통 staleTime 설정
 *
 * - default: 5분 (일반 데이터)
 * - active: 30초 (활성 세션 등 자주 변경되는 데이터)
 * - search: 1분 (검색/필터 결과)
 * - short: 2분 (특정 사용자 프로필 등)
 * - medium: 3분 (같은 부대 사용자 목록 등)
 */
export const STALE_TIME = {
  default: 5 * 60 * 1000,    // 5분
  active: 30 * 1000,         // 30초
  search: 1 * 60 * 1000,     // 1분
  short: 2 * 60 * 1000,      // 2분
  medium: 3 * 60 * 1000,     // 3분
} as const;

export type StaleTimeKey = keyof typeof STALE_TIME;

type BaseQueryOptions<TData> = Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn' | 'staleTime'>;

interface UseBaseQueryOptions<TData> extends BaseQueryOptions<TData> {
  /**
   * staleTime 설정
   * - 숫자: 직접 ms 값 지정
   * - 문자열: STALE_TIME 프리셋 사용 ('default' | 'active' | 'search' | 'short' | 'medium')
   * - 미지정: 'default' (5분)
   */
  staleTime?: number | StaleTimeKey;
}

/**
 * 프로젝트 공통 useQuery 래퍼
 *
 * Features:
 * - 일관된 staleTime 관리 (프리셋 또는 직접 지정)
 * - 타입 안전한 옵션 전달
 *
 * @example
 * // 기본 사용 (5분 staleTime)
 * const { data } = useBaseQuery(
 *   queryKeys.user.me(),
 *   profileApi.getCurrentUserProfile
 * );
 *
 * @example
 * // 프리셋 사용
 * const { data } = useBaseQuery(
 *   queryKeys.aiSession.active(purpose),
 *   () => conversationApi.getActiveAIConversation(purpose),
 *   { staleTime: 'active' } // 30초
 * );
 *
 * @example
 * // 직접 지정
 * const { data } = useBaseQuery(
 *   queryKeys.user.detail(userId),
 *   () => profileApi.getUserProfile(userId),
 *   { staleTime: 2 * 60 * 1000, enabled: !!userId }
 * );
 */
export function useBaseQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseBaseQueryOptions<TData>
): UseQueryResult<TData> {
  const { staleTime: staleTimeOption, ...restOptions } = options ?? {};

  // staleTime 해석: 문자열이면 프리셋, 숫자면 직접 사용, 없으면 기본값
  const staleTime =
    typeof staleTimeOption === 'string'
      ? STALE_TIME[staleTimeOption]
      : staleTimeOption ?? STALE_TIME.default;

  return useQuery({
    queryKey,
    queryFn,
    staleTime,
    ...restOptions,
  });
}

/**
 * Conditional query용 헬퍼
 *
 * enabled 조건과 함께 사용할 때 유용
 *
 * @example
 * const { data } = useConditionalQuery(
 *   queryKeys.user.detail(userId || ''),
 *   () => profileApi.getUserProfile(userId!),
 *   userId,  // truthy일 때만 쿼리 실행
 *   { staleTime: 'short' }
 * );
 */
export function useConditionalQuery<TData, TCondition>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  condition: TCondition | undefined | null,
  options?: Omit<UseBaseQueryOptions<TData>, 'enabled'>
): UseQueryResult<TData> {
  return useBaseQuery(queryKey, queryFn, {
    ...options,
    enabled: !!condition,
  });
}
