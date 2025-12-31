"use client";

/**
 * Logout Hook
 *
 * WebView 환경과 일반 웹 환경의 로그아웃 로직을 추상화합니다.
 *
 * - WebView: 앱에 LOGOUT 메시지 전송 → 앱이 세션 정리 및 리다이렉트 처리
 * - Web: Supabase signOut → 로그인 페이지 리다이렉트
 */

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useWebViewCore } from "./useWebViewCore";
import { useWebViewAuth } from "./useWebViewAuth";

// ============================================================================
// Types
// ============================================================================

interface UseLogoutResult {
  /** 로그아웃 실행 함수 */
  logout: () => Promise<void>;
  /** 로그아웃 진행 중 여부 */
  isLoggingOut: boolean;
}

// ============================================================================
// Hook
// ============================================================================

export function useLogout(): UseLogoutResult {
  const supabase = createClient();
  const { isInWebView } = useWebViewCore();
  const { sendLogout } = useWebViewAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    setIsLoggingOut(true);

    try {
      if (isInWebView) {
        sendLogout();
        return;
      }

      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.error("[useLogout] SignOut error:", error);
      }

      window.location.replace("/login");
    } catch (error) {
      console.error("[useLogout] Logout failed:", error);
      window.location.replace("/login");
    }
  };

  return {
    logout,
    isLoggingOut,
  };
}
