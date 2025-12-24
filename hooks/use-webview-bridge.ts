"use client";

import { useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isTabRoute } from "@/lib/routes";
import { setAuthToken } from "@/lib/utils/authFetch";

// ============================================================================
// Types
// ============================================================================

/** 앱 → 웹 메시지 (CustomEvent로 수신) */
export type AppToWebCommand =
  | { type: "NAVIGATE_HOME" }
  | { type: "NAVIGATE_TO"; path: string }
  | { type: "GET_ROUTE_INFO" }
  | { type: "SET_TOKEN"; token: string | null };

/** 웹 → 앱 메시지 (postMessage로 전송) */
export type WebToAppMessage =
  | {
      type: "ROUTE_INFO";
      payload: {
        path: string;
        isTabRoute: boolean;
        isHome: boolean;
        canGoBack: boolean;
      };
    }
  | { type: "LOGOUT" };

// ============================================================================
// Global Type Declarations
// ============================================================================

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }

  interface WindowEventMap {
    "app-command": CustomEvent<AppToWebCommand>;
  }
}

// ============================================================================
// Hook
// ============================================================================

export const useWebViewBridge = () => {
  const router = useRouter();
  const pathname = usePathname();

  // 웹 → 앱: 현재 경로 정보 전송
  const sendRouteInfo = useCallback(() => {
    if (!window.ReactNativeWebView) return;

    const message: WebToAppMessage = {
      type: "ROUTE_INFO",
      payload: {
        path: pathname,
        isTabRoute: isTabRoute(pathname),
        isHome: pathname === "/",
        canGoBack: !isTabRoute(pathname),
      },
    };

    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }, [pathname]);

  // 앱 → 웹: CustomEvent로 명령 수신
  useEffect(() => {
    const handleAppCommand = (event: CustomEvent<AppToWebCommand>) => {
      const command = event.detail;

      switch (command.type) {
        case "NAVIGATE_HOME":
          router.replace("/");
          break;
        case "NAVIGATE_TO":
          router.replace(command.path);
          break;
        case "GET_ROUTE_INFO":
          sendRouteInfo();
          break;
        case "SET_TOKEN":
          // 앱에서 전달받은 토큰을 저장 (API 호출 시 Authorization 헤더에 사용)
          setAuthToken(command.token);
          break;
      }
    };

    window.addEventListener("app-command", handleAppCommand);
    return () => window.removeEventListener("app-command", handleAppCommand);
  }, [router, sendRouteInfo]);

  // 경로 변경 시 앱에 알림
  useEffect(() => {
    sendRouteInfo();
  }, [sendRouteInfo]);

  // 웹 → 앱: 로그아웃 알림 (WebView 리셋 트리거)
  const sendLogout = useCallback(() => {
    if (!window.ReactNativeWebView) return;
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: "LOGOUT" }));
  }, []);

  return { sendRouteInfo, sendLogout };
};

