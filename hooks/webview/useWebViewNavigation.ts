"use client";

/**
 * WebView Navigation Hook
 *
 * WebView 환경에서의 라우팅/네비게이션 관련 기능을 담당합니다.
 * - 현재 경로 정보 전송
 * - 경로 변경 감지 및 알림
 */

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isTabRoute } from "@/lib/routes";
import { useWebViewCore } from "./useWebViewCore";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewNavigation = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const pathname = usePathname();

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

  // 경로 변경 시 앱에 알림
  useEffect(() => {
    if (isInWebView) {
      sendRouteInfo();
    }
  }, [pathname, isInWebView]);

  return {
    pathname,
    sendRouteInfo,
  };
};
