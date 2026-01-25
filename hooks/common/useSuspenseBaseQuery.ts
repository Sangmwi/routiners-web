'use client';

import {
  useSuspenseQuery,
  useQueryErrorResetBoundary,
  QueryKey,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { STALE_TIME, StaleTimeKey } from './useBaseQuery';

/**
 * Suspense Query 옵션
 */
interface UseSuspenseBaseQueryOptions {
  /**
   * staleTime 설정
   * - 숫자: 직접 ms 값 지정
   * - 문자열: STALE_TIME 프리셋 사용 ('default' | 'active' | 'search' | 'short' | 'medium')
   * - 미지정: 'default' (5분)
   */
  staleTime?: number | StaleTimeKey;
}

/**
 * Suspense 기반 공통 Query 래퍼
 *
 * React Suspense와 함께 사용하여 로딩/에러 상태 분기를 제거합니다.
 * - isPending 체크 불필요 (Suspense가 처리)
 * - error 체크 불필요 (ErrorBoundary가 처리)
 * - data는 항상 존재 보장
 *
 * @example
 * // 페이지 컴포넌트
 * function ProfileEditContent() {
 *   const { data: profile } = useSuspenseBaseQuery(
 *     queryKeys.user.me(),
 *     profileApi.getCurrentUserProfile
 *   );
 *   // data는 항상 존재 (undefined 체크 불필요)
 *   return <ProfileEditForm profile={profile} />;
 * }
 *
 * // 부모에서 Suspense/ErrorBoundary로 감싸기
 * export default function ProfileEditPage() {
 *   return (
 *     <PageLayout title="프로필 수정">
 *       <ProfileEditContent />
 *     </PageLayout>
 *   );
 * }
 *
 * @example
 * // staleTime 프리셋 사용
 * const { data } = useSuspenseBaseQuery(
 *   queryKeys.routine.events(date),
 *   () => routineApi.getEvents(date),
 *   { staleTime: 'short' }
 * );
 */
export function useSuspenseBaseQuery<TData>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: UseSuspenseBaseQueryOptions
): UseSuspenseQueryResult<TData> {
  const staleTimeOption = options?.staleTime;

  // staleTime 해석: 문자열이면 프리셋, 숫자면 직접 사용, 없으면 기본값
  const staleTime =
    typeof staleTimeOption === 'string'
      ? STALE_TIME[staleTimeOption]
      : staleTimeOption ?? STALE_TIME.default;

  return useSuspenseQuery({
    queryKey,
    queryFn,
    staleTime,
  });
}

/**
 * ErrorBoundary 리셋 훅
 *
 * ErrorBoundary와 React Query를 연동하여
 * "다시 시도" 시 쿼리를 재실행할 수 있게 합니다.
 *
 * @example
 * function QueryErrorBoundary({ children }) {
 *   const { reset } = useQueryErrorResetBoundary();
 *   return (
 *     <ErrorBoundary onReset={reset}>
 *       {children}
 *     </ErrorBoundary>
 *   );
 * }
 */
export { useQueryErrorResetBoundary };
