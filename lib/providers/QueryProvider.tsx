'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, createContext, useContext } from 'react';

/**
 * Query Client 설정
 *
 * 캐싱 전략:
 * - staleTime: 데이터가 "신선"한 것으로 간주되는 시간
 * - gcTime: 사용되지 않는 데이터가 캐시에 유지되는 시간
 * - refetchOnWindowFocus: 창 포커스 시 리패치 여부
 *
 * WebView 최적화:
 * - offlineFirst: 네트워크 불안정 상황 대비
 * - 긴 staleTime: 불필요한 리패치 최소화
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // 캐싱 시간 설정
        staleTime: 30 * 1000,     // 30초: 테스트용 (원래 5분)
        gcTime: 60 * 1000,        // 1분: 테스트용 (원래 10분)

        // 리패치 정책
        refetchOnWindowFocus: false,  // WebView에서 불필요한 리패치 방지
        refetchOnReconnect: true,     // 네트워크 재연결 시 리패치

        // 재시도 정책
        retry: 1,                      // 실패 시 1회 재시도
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),

        // 네트워크 모드
        networkMode: 'offlineFirst',   // 오프라인 우선 (캐시 먼저 사용)
      },
      mutations: {
        retry: 0,                      // 뮤테이션은 재시도 안함
        networkMode: 'online',         // 뮤테이션은 온라인 필수
      },
    },
  });
}

// QueryClient 접근을 위한 Context (선택적 사용)
const QueryClientContext = createContext<QueryClient | null>(null);

/**
 * QueryClient 인스턴스에 직접 접근
 *
 * @example
 * const queryClient = useQueryClientInstance();
 * invalidateCurrentUser(queryClient);
 */
export function useQueryClientInstance() {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error('useQueryClientInstance must be used within QueryProvider');
  }
  return client;
}

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientContext.Provider value={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </QueryClientContext.Provider>
  );
}
