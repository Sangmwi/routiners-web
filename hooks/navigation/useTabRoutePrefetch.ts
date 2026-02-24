'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BOTTOM_NAV } from '@/lib/config/theme';
import { useDocumentEventListener } from '@/hooks/common/useEventListener';

const TAB_ROUTES = BOTTOM_NAV.items.map((item) => item.href);
const PREFETCH_INTERVAL_MS = 4 * 60 * 1000;

function prefetchAllTabs(router: ReturnType<typeof useRouter>) {
  TAB_ROUTES.forEach((route) => {
    router.prefetch(route);
  });
}

export function useTabRoutePrefetch() {
  const router = useRouter();

  useEffect(() => {
    prefetchAllTabs(router);

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let idleCallbackId: number | undefined;

    const scheduleIdlePrefetch = () => {
      timeoutId = setTimeout(() => {
        idleCallbackId = requestIdleCallback(
          () => {
            prefetchAllTabs(router);
            scheduleIdlePrefetch();
          },
          { timeout: 10000 }
        );
      }, PREFETCH_INTERVAL_MS);
    };

    scheduleIdlePrefetch();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleCallbackId) cancelIdleCallback(idleCallbackId);
    };
  }, [router]);

  useDocumentEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      prefetchAllTabs(router);
    }
  });
}
