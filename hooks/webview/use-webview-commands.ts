"use client";

/**
 * WebView Commands Hook
 *
 * 앱에서 오는 명령(AppToWebMessage)을 처리합니다.
 * 선언적 핸들러 맵 방식으로 앱의 messageHandlers와 패턴을 통일합니다.
 */

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AppToWebMessage } from "@/lib/webview";
import { useWebViewAuth } from "./use-webview-auth";
import { useWebViewNavigation } from "./use-webview-navigation";
import { LOG_PREFIX } from "./use-webview-core";

// ============================================================================
// Types
// ============================================================================

type CommandHandler = (command: AppToWebMessage) => void | Promise<void>;
type CommandHandlerMap = Record<AppToWebMessage["type"], CommandHandler>;

// ============================================================================
// Hook
// ============================================================================

export const useWebViewCommands = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { setSession, clearSession, notifySessionSet } = useWebViewAuth();
  const { sendRouteInfo } = useWebViewNavigation();

  // 선언적 명령 핸들러 맵 (앱의 messageHandlers와 동일한 패턴)
  // React Compiler가 자동 메모이제이션 처리
  const commandHandlers: CommandHandlerMap = {
    NAVIGATE_HOME: () => {
      router.replace("/");
    },

    NAVIGATE_TO: (cmd) => {
      if (cmd.type === "NAVIGATE_TO") {
        router.replace(cmd.path);
      }
    },

    GET_ROUTE_INFO: () => {
      sendRouteInfo();
    },

    SET_SESSION: async (cmd) => {
      if (cmd.type === "SET_SESSION") {
        const success = await setSession(cmd.access_token, cmd.refresh_token);
        notifySessionSet(success);

        if (success && pathname === "/login") {
          router.replace("/");
        }
      }
    },

    CLEAR_SESSION: async () => {
      await clearSession();
      router.replace("/login");
    },

    LOGIN_ERROR: (cmd) => {
      if (cmd.type === "LOGIN_ERROR") {
        console.error(`${LOG_PREFIX} Login error from app:`, cmd.error);
      }
    },
  };

  // 앱 명령 이벤트 리스너 등록
  useEffect(() => {
    const handleAppCommand = async (event: CustomEvent<AppToWebMessage>) => {
      const command = event.detail;
      const handler = commandHandlers[command.type];

      if (handler) {
        await handler(command);
      }
    };

    window.addEventListener("app-command", handleAppCommand);
    return () => window.removeEventListener("app-command", handleAppCommand);
  });
};
