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
      console.log('[SessionRefresh] visibilitychange:', document.visibilityState);

      if (document.visibilityState !== 'visible') return;

      // 너무 잦은 갱신 방지 (최소 30초 간격)
      const now = Date.now();
      if (now - lastRefreshRef.current < 30_000) {
        console.log('[SessionRefresh] Skipped (cooldown)');
        return;
      }

      lastRefreshRef.current = now;

      try {
        // 갱신 전 세션 상태 확인
        const { data: beforeSession } = await supabase.auth.getSession();
        console.log('[SessionRefresh] Before:', {
          hasSession: !!beforeSession.session,
          hasRefreshToken: !!beforeSession.session?.refresh_token,
          expiresAt: beforeSession.session?.expires_at,
        });

        console.log('[SessionRefresh] Refreshing session...');
        const { data, error } = await supabase.auth.refreshSession();

        if (error) {
          console.error('[SessionRefresh] Failed:', error.message, error);
        } else {
          console.log('[SessionRefresh] Success:', {
            hasSession: !!data.session,
            expiresAt: data.session?.expires_at,
          });
        }

        // 갱신 후 세션 상태 재확인
        const { data: afterSession } = await supabase.auth.getSession();
        console.log('[SessionRefresh] After:', {
          hasSession: !!afterSession.session,
          hasRefreshToken: !!afterSession.session?.refresh_token,
          expiresAt: afterSession.session?.expires_at,
        });
      } catch (e) {
        console.error('[SessionRefresh] Error:', e);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);
}
