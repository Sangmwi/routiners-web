"use client";

/**
 * WebView Lifecycle Hook
 *
 * WebView 생명주기 관련 기능을 담당합니다.
 * - 웹 준비 완료 신호
 * - 초기화 상태 관리
 */

import { useEffect } from "react";
import { useWebViewCore } from "./useWebViewCore";

// ============================================================================
// Module State (앱 전체에서 한 번만 WEB_READY 전송)
// ============================================================================

let isWebReadySent = false;

/**
 * WEB_READY 상태를 리셋합니다.
 * 로그아웃 시 호출하여 재로그인 시 WEB_READY를 다시 전송할 수 있게 합니다.
 */
export const resetWebReadyState = () => {
  isWebReadySent = false;
};

// ============================================================================
// Hook
// ============================================================================

export const useWebViewLifecycle = () => {
  const { isInWebView, sendMessage } = useWebViewCore();

  /**
   * 웹 준비 완료 신호를 앱에 전송합니다.
   * 앱 전체에서 한 번만 전송됩니다.
   */
  const sendWebReady = (): boolean => {
    if (isWebReadySent) return false;
    isWebReadySent = true;
    return sendMessage({ type: "WEB_READY" });
  };

  // 최초 마운트 시 준비 완료 신호 전송 (한 번만)
  useEffect(() => {
    if (isInWebView && !isWebReadySent) {
      const timer = setTimeout(() => sendWebReady(), 100);
      return () => clearTimeout(timer);
    }
  }, [isInWebView]);

  return {
    sendWebReady,
    isReady: isWebReadySent,
  };
};
