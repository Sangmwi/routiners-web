"use client";

/**
 * WebView Auth Hook
 *
 * WebView 환경에서의 인증 관련 기능을 담당합니다.
 * - 세션 설정/삭제 (클라이언트 사이드 Supabase 직접 호출)
 * - 로그인 요청
 * - 로그아웃 알림
 */

import { useWebViewCore, LOG_PREFIX } from "./useWebViewCore";
import { createClient } from "@/utils/supabase/client";

// ============================================================================
// Hook
// ============================================================================

export const useWebViewAuth = () => {
  const { sendMessage } = useWebViewCore();

  /**
   * 앱에서 받은 토큰으로 세션을 설정합니다.
   * 클라이언트 사이드에서 직접 Supabase setSession 호출 (서버 API 불필요)
   * @supabase/ssr이 document.cookie를 자동으로 관리합니다.
   */
  const setSession = async (
    accessToken: string,
    refreshToken: string
  ): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error(`${LOG_PREFIX} Session set failed:`, error.message);
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
   * 클라이언트 사이드에서 직접 Supabase signOut 호출
   */
  const clearSession = async (): Promise<boolean> => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut({ scope: "local" });
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
