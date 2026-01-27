/**
 * Server-Side Query Client
 *
 * SSR prefetching을 위한 QueryClient 유틸리티
 * React의 cache()로 요청당 하나의 인스턴스 보장
 *
 * @example
 * // Server Component에서 사용
 * const queryClient = getQueryClient();
 * await queryClient.prefetchQuery({
 *   queryKey: queryKeys.user.me(),
 *   queryFn: fetchUserServer,
 * });
 *
 * return (
 *   <HydrationBoundary state={dehydrate(queryClient)}>
 *     <ClientComponent />
 *   </HydrationBoundary>
 * );
 */

import { QueryClient } from '@tanstack/react-query';
import { cache } from 'react';

/**
 * 서버 사이드용 QueryClient 생성
 *
 * React cache()를 사용하여 동일 요청 내에서 같은 인스턴스 반환
 * - SSR 중 prefetch한 데이터가 동일 요청 내에서 공유됨
 * - 요청이 끝나면 자동으로 GC
 */
export const getQueryClient = cache(() => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // SSR에서는 staleTime을 길게 설정 (hydration 동안 refetch 방지)
        staleTime: 60 * 1000, // 1분
      },
    },
  });
});
