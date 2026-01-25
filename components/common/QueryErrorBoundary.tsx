'use client';

import { ReactNode } from 'react';
import { useQueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';

interface QueryErrorBoundaryProps {
  children: ReactNode;
}

/**
 * React Query 연동 ErrorBoundary
 *
 * useSuspenseBaseQuery에서 발생한 에러를 캐치하고,
 * "다시 시도" 클릭 시 React Query 에러 상태를 리셋하여 쿼리를 재실행합니다.
 *
 * @example
 * // PageLayout 내부에서 사용 (자동)
 * <PageLayout title="프로필 수정">
 *   <ProfileEditContent />
 * </PageLayout>
 *
 * @example
 * // 직접 사용
 * <QueryErrorBoundary>
 *   <Suspense fallback={<PulseLoader />}>
 *     <MyComponent />
 *   </Suspense>
 * </QueryErrorBoundary>
 */
export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();

  return (
    <ErrorBoundary
      onReset={reset}
      onError={(error) => {
        // React Query 에러 로깅 (기본 ErrorBoundary에서 이미 로깅하지만 추가 컨텍스트)
        console.error('[QueryErrorBoundary] Query error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default QueryErrorBoundary;
