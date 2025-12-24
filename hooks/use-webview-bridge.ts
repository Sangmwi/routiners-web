"use client";

import { useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isTabRoute } from "@/lib/routes";
import { setAuthToken, getAuthToken } from "@/lib/utils/authFetch";

// ============================================================================
// Types
// ============================================================================

/** 앱 → 웹 메시지 (CustomEvent로 수신) */
export type AppToWebCommand =
  | { type: "NAVIGATE_HOME" }
  | { type: "NAVIGATE_TO"; path: string }
  | { type: "GET_ROUTE_INFO" }
  | { type: "SET_TOKEN"; token: string | null }
  | { type: "LOGIN_ERROR"; error: string };

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
  | { type: "LOGOUT" }
  | { type: "REQUEST_LOGIN" }
  | { type: "WEB_READY" }
  | { type: "TOKEN_RECEIVED"; success: boolean }
  | { type: "REQUEST_TOKEN_REFRESH" };

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
// Constants
// ============================================================================

const LOG_PREFIX = "[WebViewBridge]";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewBridge = () => {
  const router = useRouter();
  const pathname = usePathname();
  const isReadyRef = useRef(false);

  // WebView 환경 여부 확인
  const isInWebView = typeof window !== "undefined" && !!window.ReactNativeWebView;

  // ──────────────────────────────────────────────────────────────────────────
  // 웹 → 앱 메시지 전송 헬퍼
  // ──────────────────────────────────────────────────────────────────────────

  const sendMessage = useCallback((message: WebToAppMessage) => {
    if (!window.ReactNativeWebView) return false;
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
    return true;
  }, []);

  // 웹 → 앱: 현재 경로 정보 전송
  const sendRouteInfo = useCallback(() => {
    sendMessage({
      type: "ROUTE_INFO",
      payload: {
        path: pathname,
        isTabRoute: isTabRoute(pathname),
        isHome: pathname === "/",
        canGoBack: !isTabRoute(pathname),
      },
    });
  }, [pathname, sendMessage]);

  // 웹 → 앱: 로그아웃 알림
  const sendLogout = useCallback(() => {
    sendMessage({ type: "LOGOUT" });
  }, [sendMessage]);

  // 웹 → 앱: 로그인 요청 (네이티브 OAuth 트리거)
  const requestLogin = useCallback(() => {
    return sendMessage({ type: "REQUEST_LOGIN" });
  }, [sendMessage]);

  // 웹 → 앱: 토큰 수신 확인
  const sendTokenReceived = useCallback((success: boolean) => {
    sendMessage({ type: "TOKEN_RECEIVED", success });
    console.log(`${LOG_PREFIX} Token received confirmation sent:`, success);
  }, [sendMessage]);

  // 웹 → 앱: 준비 완료 신호
  const sendWebReady = useCallback(() => {
    if (isReadyRef.current) return; // 중복 전송 방지
    isReadyRef.current = true;

    sendMessage({ type: "WEB_READY" });
    console.log(`${LOG_PREFIX} Web ready signal sent`);

    // 저장된 토큰이 있으면 앱에 알림 (페이지 리로드 후 토큰 복원됨)
    const existingToken = getAuthToken();
    if (existingToken) {
      console.log(`${LOG_PREFIX} Existing token found after ready`);
    }
  }, [sendMessage]);

  // ──────────────────────────────────────────────────────────────────────────
  // 앱 → 웹 메시지 수신 핸들러
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleAppCommand = (event: CustomEvent<AppToWebCommand>) => {
      const command = event.detail;
      console.log(`${LOG_PREFIX} Received:`, command.type);

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
          // 토큰 저장 (sessionStorage에 영속화됨)
          setAuthToken(command.token);
          // 앱에 수신 확인 전송
          sendTokenReceived(true);
          break;

        case "LOGIN_ERROR":
          console.error(`${LOG_PREFIX} Login error from app:`, command.error);
          break;
      }
    };

    window.addEventListener("app-command", handleAppCommand);
    return () => window.removeEventListener("app-command", handleAppCommand);
  }, [router, sendRouteInfo, sendTokenReceived]);

  // ──────────────────────────────────────────────────────────────────────────
  // 초기화 및 경로 변경 처리
  // ──────────────────────────────────────────────────────────────────────────

  // 마운트 시 준비 완료 신호 전송
  useEffect(() => {
    if (isInWebView) {
      // 약간의 딜레이로 앱에서 WebView 로드 완료를 인식할 시간 확보
      const timer = setTimeout(() => {
        sendWebReady();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isInWebView, sendWebReady]);

  // 경로 변경 시 앱에 알림
  useEffect(() => {
    if (isInWebView) {
      sendRouteInfo();
    }
  }, [pathname, isInWebView, sendRouteInfo]);

  return {
    isInWebView,
    sendRouteInfo,
    sendLogout,
    requestLogin,
    sendTokenReceived,
    sendWebReady,
  };
};
