"use client";

/**
 * WebView Navigation Hook
 *
 * WebView 환경에서의 라우팅/네비게이션 관련 기능을 담당합니다.
 * - 현재 경로 정보 전송
 * - 경로 변경 감지 및 알림
 * - 페이지 렌더링 완료 신호 전송
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { isTabRoute } from "@/lib/routes";
import { useWebViewCore } from "./useWebViewCore";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewNavigation = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const pathname = usePathname();
  const hasRenderedRef = useRef(false);

  /**
   * 현재 경로 정보를 앱에 전송합니다.
   */
  const sendRouteInfo = (): boolean => {
    return sendMessage({
      type: "ROUTE_INFO",
      payload: {
        path: pathname,
        isTabRoute: isTabRoute(pathname),
        isHome: pathname === "/",
        canGoBack: !isTabRoute(pathname),
      },
    });
  };

  /**
   * 페이지 렌더링 완료 신호를 앱에 전송합니다.
   */
  const sendPageRendered = (): boolean => {
    return sendMessage({ type: "PAGE_RENDERED" });
  };

  // 경로 변경 시 앱에 알림
  useEffect(() => {
    if (isInWebView) {
      sendRouteInfo();
    }
  }, [pathname, isInWebView]);

  // 초기 렌더링 완료 시 앱에 알림 (double RAF로 실제 페인트 후 전송)
  useEffect(() => {
    if (!isInWebView || hasRenderedRef.current) return;

    // Double requestAnimationFrame: 브라우저가 실제로 화면에 그린 후 실행
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        hasRenderedRef.current = true;
        sendPageRendered();
      });
    });
  }, [isInWebView]);

  return {
    pathname,
    sendRouteInfo,
    sendPageRendered,
  };
};
