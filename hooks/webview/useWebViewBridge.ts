"use client";

/**
 * WebView Bridge Hook
 *
 * 앱(Expo)과 웹(Next.js) 간 통신을 관리하는 통합 훅입니다.
 * 도메인별로 분리된 훅들을 조합하여 제공합니다.
 *
 * 구성:
 * - useWebViewCore: 기본 메시지 전송 및 환경 감지
 * - useWebViewAuth: 인증 관련 (세션 설정/삭제, 로그인 요청)
 * - useWebViewNavigation: 라우팅 관련 (경로 정보 전송)
 * - useWebViewLifecycle: 생명주기 관련 (준비 완료 신호)
 * - useWebViewCommands: 앱 명령 처리 (맵 기반 핸들러)
 *
 * 인증 흐름:
 * 1. 앱에서 SET_SESSION 명령 수신 (access_token, refresh_token)
 * 2. /api/auth/session API 호출하여 쿠키 세션 설정
 * 3. SESSION_SET 응답으로 완료 알림
 */

import { useWebViewCore } from "./useWebViewCore";
import { useWebViewAuth } from "./useWebViewAuth";
import { useWebViewNavigation } from "./useWebViewNavigation";
import { useWebViewLifecycle } from "./useWebViewLifecycle";
import { useWebViewCommands } from "./useWebViewCommands";

// Re-export types for convenience
export type { AppToWebMessage, WebToAppMessage } from "@/lib/webview";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewBridge = () => {
  const { isInWebView, sendMessage } = useWebViewCore();
  const { requestLogin, sendLogout } = useWebViewAuth();
  const { sendRouteInfo } = useWebViewNavigation();
  const { sendWebReady } = useWebViewLifecycle();

  // 앱 명령 처리 (내부에서 이벤트 리스너 등록)
  useWebViewCommands();

  return {
    // Core
    isInWebView,
    sendMessage,

    // Auth
    requestLogin,
    sendLogout,

    // Navigation
    sendRouteInfo,

    // Lifecycle
    sendWebReady,
  };
};
