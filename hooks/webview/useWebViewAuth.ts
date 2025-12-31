"use client";

/**
 * WebView Auth Hook
 *
 * WebView 환경에서의 인증 관련 기능을 담당합니다.
 * - 세션 설정/삭제
 * - 로그인 요청
 * - 로그아웃 알림
 */

import { useWebViewCore, LOG_PREFIX } from "./useWebViewCore";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewAuth = () => {
  const { sendMessage } = useWebViewCore();

  /**
   * 앱에서 받은 토큰으로 쿠키 세션을 설정합니다.
   */
  const setSession = async (
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          refresh_token: refreshToken,
        }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error(`${LOG_PREFIX} Session set failed:`, error);
        return false;
      }

      return true;
    } catch (e) {
      console.error(`${LOG_PREFIX} Session set error:`, e);
      return false;
    }
  };

  /**
   * 세션을 삭제합니다.
   */
  const clearSession = async (): Promise<boolean> => {
    try {
      await fetch("/api/auth/session", {
        method: "DELETE",
        credentials: "include",
      });
      return true;
    } catch (e) {
      console.error(`${LOG_PREFIX} Session clear error:`, e);
      return false;
    }
  };

  /**
   * 앱에 네이티브 로그인 요청을 전송합니다.
   */
  const requestLogin = (): boolean => {
    return sendMessage({ type: "REQUEST_LOGIN" });
  };

  /**
   * 앱에 로그아웃 알림을 전송합니다.
   */
  const sendLogout = (): boolean => {
    return sendMessage({ type: "LOGOUT" });
  };

  /**
   * 세션 설정 결과를 앱에 알립니다.
   */
  const notifySessionSet = (success: boolean): boolean => {
    return sendMessage({ type: "SESSION_SET", success });
  };

  return {
    setSession,
    clearSession,
    requestLogin,
    sendLogout,
    notifySessionSet,
  };
};
