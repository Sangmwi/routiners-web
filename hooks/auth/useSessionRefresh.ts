'use client';

import { useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useDocumentEventListener } from '@/hooks/common/useEventListener';

// ============================================================================
// Constants
// ============================================================================

const REFRESH_COOLDOWN_MS = 5 * 60 * 1000; // 5분
const REFRESH_THRESHOLD_MS = 10 * 60 * 1000; // 만료 10분 전

// ============================================================================
// Hook
// ============================================================================

/**
 * WebView 앱에서 백그라운드 복귀 시 Supabase 세션을 자동 갱신하는 훅
 *
 * 문제: 앱이 백그라운드에서 1시간+ 있다가 복귀하면 JWT Access Token이 만료됨
 * 해결: visibilitychange 이벤트로 포그라운드 복귀 감지 → refreshSession() 호출
 *
 * 최적화:
 * - 세션이 있을 때만 갱신 시도
 * - 만료 10분 전에만 갱신 (불필요한 호출 방지)
 * - 5분 쿨다운 (잦은 탭 전환 시 중복 방지)
 */
export function useSessionRefresh() {
  const lastRefreshRef = useRef<number>(0);
  const supabaseRef = useRef(createClient());

  useDocumentEventListener('visibilitychange', async () => {
    if (document.visibilityState !== 'visible') return;

    const now = Date.now();
    if (now - lastRefreshRef.current < REFRESH_COOLDOWN_MS) return;

    try {
      const { data: { session } } = await supabaseRef.current.auth.getSession();

      if (!session?.expires_at) return;

      const expiresAt = session.expires_at * 1000;
      if (expiresAt - now > REFRESH_THRESHOLD_MS) return;

      lastRefreshRef.current = now;
      await supabaseRef.current.auth.refreshSession();
    } catch {
      // 조용히 실패 (다음 복귀 시 재시도)
    }
  });
}
