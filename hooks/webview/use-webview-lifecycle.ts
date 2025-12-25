"use client";

/**
 * WebView Lifecycle Hook
 *
 * WebView 생명주기 관련 기능을 담당합니다.
 * - 웹 준비 완료 신호
 * - 초기화 상태 관리
 */

import { useEffect, useRef } from "react";
import { useWebViewCore } from "./use-webview-core";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewLifecycle = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const isReadyRef = useRef(false);

  /**
   * 웹 준비 완료 신호를 앱에 전송합니다.
   * 한 번만 전송됩니다.
   */
  const sendWebReady = (): boolean => {
    if (isReadyRef.current) return false;
    isReadyRef.current = true;
    return sendMessage({ type: "WEB_READY" });
  };

  // 마운트 시 준비 완료 신호 전송
  useEffect(() => {
    if (isInWebView) {
      const timer = setTimeout(() => sendWebReady(), 100);
      return () => clearTimeout(timer);
    }
  }, [isInWebView]);

  return {
    sendWebReady,
    isReady: isReadyRef.current,
  };
};
