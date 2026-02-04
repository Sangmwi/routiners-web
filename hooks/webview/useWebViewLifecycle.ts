"use client";

/**
 * WebView Lifecycle Hook
 *
 * WebView 생명주기 관련 기능을 담당합니다.
 * - 쿠키 세션 유효성 확인
 * - WEB_READY 또는 REQUEST_SESSION_REFRESH 전송
 */

import { useEffect } from "react";
import { useWebViewCore } from "./useWebViewCore";
import { createClient } from "@/utils/supabase/client";

// ============================================================================
// Module State
// ============================================================================

let isSessionCheckDone = false;

/**
 * 세션 체크 상태를 리셋합니다.
 * 로그아웃 시 호출하여 재로그인 시 다시 체크할 수 있게 합니다.
 */
export const resetWebReadyState = () => {
  isSessionCheckDone = false;
};

// ============================================================================
// Helper
// ============================================================================

/**
 * 세션이 만료되었는지 확인 (10분 버퍼)
 */
const isSessionExpired = (expiresAt: number): boolean => {
  const now = Math.floor(Date.now() / 1000);
  const buffer = 10 * 60; // 10분 버퍼
  return expiresAt - now < buffer;
};

// ============================================================================
// Hook
// ============================================================================

export const useWebViewLifecycle = () => {
  const { isInWebView, sendMessage } = useWebViewCore();

  /**
   * 웹 준비 완료 신호를 앱에 전송합니다.
   * 쿠키 세션이 유효한 경우 호출됩니다.
   */
  const sendWebReady = (): boolean => {
    return sendMessage({ type: "WEB_READY" });
  };

  /**
   * 세션 갱신 요청을 앱에 전송합니다.
   * 쿠키 세션이 없거나 만료된 경우 호출됩니다.
   */
  const requestSessionRefresh = (): boolean => {
    return sendMessage({ type: "REQUEST_SESSION_REFRESH" });
  };

  // 쿠키 세션 확인 후 조건부 메시지 전송
  useEffect(() => {
    if (!isInWebView || isSessionCheckDone) return;
    isSessionCheckDone = true;

    const checkSessionAndNotify = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.expires_at && !isSessionExpired(session.expires_at)) {
          // 쿠키 세션 유효 → WEB_READY만 전송
          console.log("[WebView] Cookie session valid, sending WEB_READY");
          sendWebReady();
        } else {
          // 쿠키 세션 없거나 만료 → 앱에 refresh 요청
          console.log("[WebView] Cookie session invalid/expired, requesting refresh");
          requestSessionRefresh();
        }
      } catch (error) {
        console.error("[WebView] Session check failed:", error);
        // 에러 시 refresh 요청 (안전하게)
        requestSessionRefresh();
      }
    };

    // DOM 커밋 후 실행
    queueMicrotask(checkSessionAndNotify);
  }, [isInWebView, sendMessage]);

  return {
    sendWebReady,
    requestSessionRefresh,
    isReady: isSessionCheckDone,
  };
};
