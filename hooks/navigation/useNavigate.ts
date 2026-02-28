'use client';

import { useRouter } from 'next/navigation';
import { saveCurrentRouteWindowScroll } from '@/lib/route-state/scroll';

/**
 * 앱 내 네비게이션 훅. 이동 전 현재 라우트 스크롤 위치를 자동 저장한다.
 *
 * - push: 스크롤 저장 후 router.push (scroll: false 옵션 시 스킵)
 * - replace: 스크롤 저장 후 router.replace
 * - prefetch: 특정 href를 수동 prefetch (알려진 목적지를 렌더 시점에 prefetch할 때 사용)
 *
 * 선언형(정적 href)은 AppLink를 사용하고, AppLink도 내부적으로 이 훅을 사용한다.
 */
export function useNavigate() {
  const router = useRouter();

  const push = (href: string, options?: { scroll?: boolean }) => {
    if (options?.scroll !== false) {
      saveCurrentRouteWindowScroll();
    }
    router.push(href, options);
  };

  const replace = (href: string) => {
    saveCurrentRouteWindowScroll();
    router.replace(href);
  };

  const prefetch = (href: string) => router.prefetch(href);

  return { push, replace, prefetch };
}
