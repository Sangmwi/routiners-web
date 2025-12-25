"use client";

/**
 * WebView Core Hook
 *
 * WebView 환경 감지 및 기본 메시지 전송 기능을 제공합니다.
 * 다른 WebView 훅들의 기반이 되는 코어 훅입니다.
 */

import type { WebToAppMessage } from "@/lib/webview";

// Re-export types for convenience
export type { AppToWebMessage, WebToAppMessage } from "@/lib/webview";

// ============================================================================
// Constants
// ============================================================================

export const LOG_PREFIX = "[WebView]";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewCore = () => {
  // WebView 환경 여부 확인
  const isInWebView =
    typeof window !== "undefined" && !!window.ReactNativeWebView;

  /**
   * 웹 → 앱 메시지 전송
   */
  const sendMessage = (message: WebToAppMessage): boolean => {
    if (!window.ReactNativeWebView) return false;
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return true;
  };

  return {
    isInWebView,
    sendMessage,
  };
};
