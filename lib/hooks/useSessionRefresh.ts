'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

/**
 * WebView 앱에서 백그라운드 복귀 시 Supabase 세션을 자동 갱신하는 훅
 *
 * 문제: 앱이 백그라운드에서 1시간+ 있다가 복귀하면 JWT Access Token이 만료됨
 * 해결: visibilitychange 이벤트로 포그라운드 복귀 감지 → refreshSession() 호출
 *
 * @example
 * // layout.tsx 또는 루트 컴포넌트에서
 * function RootLayout() {
 *   useSessionRefresh();
 *   return <>{children}</>;
 * }
 */
export function useSessionRefresh() {
  const lastRefreshRef = useRef<number>(0);

  useEffect(() => {
    const supabase = createClient();

    const handleVisibilityChange = async () => {
      if (document.visibilityState !== 'visible') return;

      // 너무 잦은 갱신 방지 (최소 30초 간격)
      const now = Date.now();
      if (now - lastRefreshRef.current < 30_000) return;

      lastRefreshRef.current = now;

      try {
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          console.warn('[SessionRefresh] Failed to refresh:', error.message);
        }
      } catch (e) {
        // 네트워크 오류 등은 무시 (다음 API 호출에서 처리됨)
        console.warn('[SessionRefresh] Error:', e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
