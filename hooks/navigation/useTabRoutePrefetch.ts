'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BOTTOM_NAV } from '@/lib/config/theme';

// ============================================================================
// Constants
// ============================================================================

const TAB_ROUTES = BOTTOM_NAV.items.map((item) => item.href);
const PREFETCH_INTERVAL_MS = 4 * 60 * 1000; // 4분 (Next.js 캐시 만료 전 갱신)

// ============================================================================
// Hook
// ============================================================================

/**
 * 탭 라우트 중앙 집중식 Prefetch 관리
 *
 * 문제:
 * - Next.js prefetch 캐시가 30초~5분 후 만료됨
 * - foreground에서 가만히 있어도 캐시 만료
 * - 캐시 만료 후 탭 전환 시 번들 로딩으로 지연 발생
 *
 * 해결:
 * - 마운트 시 모든 탭 라우트 prefetch
 * - requestIdleCallback으로 유휴 시간에만 갱신 (리소스 낭비 최소화)
 * - 백그라운드 복귀 시 즉시 갱신
 */
export function useTabRoutePrefetch() {
  const router = useRouter();

  const prefetchAllTabs = () => {
    TAB_ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  };

  // 마운트 시 prefetch + 유휴 시간에 주기적 갱신
  useEffect(() => {
    prefetchAllTabs();

    let timeoutId: ReturnType<typeof setTimeout>;
    let idleCallbackId: number;

    const scheduleIdlePrefetch = () => {
      timeoutId = setTimeout(() => {
        // 브라우저가 유휴 상태일 때만 prefetch (스크롤, 입력 중엔 안 함)
        idleCallbackId = requestIdleCallback(
          () => {
            prefetchAllTabs();
            scheduleIdlePrefetch();
          },
          { timeout: 10000 }
        );
      }, PREFETCH_INTERVAL_MS);
    };

    scheduleIdlePrefetch();

    return () => {
      clearTimeout(timeoutId);
      if (idleCallbackId) cancelIdleCallback(idleCallbackId);
    };
  }, []);

  // 백그라운드 복귀 시 즉시 갱신
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        prefetchAllTabs();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
