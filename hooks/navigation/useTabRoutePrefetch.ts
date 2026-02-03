'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BOTTOM_NAV } from '@/lib/config/theme';

// ============================================================================
// Constants
// ============================================================================

const TAB_ROUTES = BOTTOM_NAV.items.map((item) => item.href);

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
 * - 탭 전환(pathname 변경) 시 모든 탭 prefetch 갱신
 *   → 첫 클릭은 지연될 수 있지만, 이후 전환은 빠름
 *   → 뒤로가기 후 정상작동하는 것과 동일한 원리
 * - interval 없이 사용자 상호작용 기반 갱신
 */
export function useTabRoutePrefetch() {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  const prefetchAllTabs = useCallback(() => {
    TAB_ROUTES.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  // 마운트 시 prefetch
  useEffect(() => {
    prefetchAllTabs();
  }, [prefetchAllTabs]);

  // 탭 전환 시 prefetch 갱신 (첫 마운트 제외)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    // 탭 라우트로 이동했을 때만 갱신 (하위 페이지 이동 시 불필요)
    if ((TAB_ROUTES as readonly string[]).includes(pathname)) {
      prefetchAllTabs();
    }
  }, [pathname, prefetchAllTabs]);

  // 백그라운드 복귀 시 prefetch 갱신
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
  }, [prefetchAllTabs]);
}
