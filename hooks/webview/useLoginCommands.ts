"use client";

/**
 * Login Commands Hook
 *
 * 로그인 페이지 전용 WebView 명령 핸들러입니다.
 * 앱에서 오는 로그인 관련 이벤트를 처리합니다.
 *
 * 처리하는 이벤트:
 * - LOGIN_CANCELLED: 사용자가 Google 로그인 취소
 * - LOGIN_ERROR: 로그인 중 에러 발생
 *
 * 앱에서의 전송:
 * - WebViewBridge.sendLoginCancelled(webViewRef)
 * - WebViewBridge.sendLoginError(webViewRef, error)
 */

import { useEffect } from "react";
import { registerCommandHandler } from "./useWebViewCommands";
import { useWebViewCore } from "./useWebViewCore";
import type { AppToWebMessage } from "@/lib/webview";

// ============================================================================
// Types
// ============================================================================

interface LoginCommandCallbacks {
  onCancelled?: () => void;
  onError?: (error: string) => void;
}

// ============================================================================
// Hook
// ============================================================================

export const useLoginCommands = (callbacks: LoginCommandCallbacks) => {
  const { isInWebView } = useWebViewCore();

  useEffect(() => {
    if (!isInWebView) return;

    const cleanups: (() => void)[] = [];

    if (callbacks.onCancelled) {
      cleanups.push(
        registerCommandHandler("LOGIN_CANCELLED", () => {
          console.log("[Login] Native login cancelled by user");
          callbacks.onCancelled!();
        })
      );
    }

    if (callbacks.onError) {
      cleanups.push(
        registerCommandHandler<Extract<AppToWebMessage, { type: "LOGIN_ERROR" }>>(
          "LOGIN_ERROR",
          (cmd) => {
            console.log("[Login] Native login error:", cmd.error);
            callbacks.onError!(cmd.error || "로그인에 실패했어요");
          }
        )
      );
    }

    return () => cleanups.forEach((cleanup) => cleanup());
  }, [isInWebView, callbacks.onCancelled, callbacks.onError]);
};
