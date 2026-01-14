"use client";

/**
 * WebView Commands Hook
 *
 * 앱에서 오는 명령(AppToWebMessage)을 중앙 집중식으로 처리합니다.
 * 선언적 핸들러 맵 방식으로 앱의 messageHandlers와 패턴을 통일합니다.
 *
 * 확장성:
 * - 외부 핸들러 등록 가능 (registerHandler)
 * - 핸들러 해제 가능 (unregisterHandler)
 * - 모든 app-command 이벤트를 단일 지점에서 관리
 */

import { useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { AppToWebMessage } from "@/lib/webview";
import { useWebViewAuth } from "./useWebViewAuth";
import { useWebViewNavigation } from "./useWebViewNavigation";
import { resetWebReadyState } from "./useWebViewLifecycle";
import { LOG_PREFIX } from "./useWebViewCore";

// ============================================================================
// Types
// ============================================================================

export type CommandHandler<T extends AppToWebMessage = AppToWebMessage> = (
  command: T
) => void | Promise<void>;

type CommandType = AppToWebMessage["type"];
type HandlerRegistry = Map<CommandType, Set<CommandHandler>>;

// 개별 메시지 타입 추출
type NavigateToMessage = Extract<AppToWebMessage, { type: "NAVIGATE_TO" }>;
type SetSessionMessage = Extract<AppToWebMessage, { type: "SET_SESSION" }>;
type LoginErrorMessage = Extract<AppToWebMessage, { type: "LOGIN_ERROR" }>;

// ============================================================================
// Global Registry (싱글톤)
// ============================================================================

const globalHandlerRegistry: HandlerRegistry = new Map();

/**
 * 외부 핸들러 등록 (컴포넌트 외부에서도 사용 가능)
 */
export const registerCommandHandler = <T extends AppToWebMessage>(
  type: T["type"],
  handler: CommandHandler<T>
): (() => void) => {
  if (!globalHandlerRegistry.has(type)) {
    globalHandlerRegistry.set(type, new Set());
  }
  globalHandlerRegistry.get(type)!.add(handler as CommandHandler);

  // cleanup 함수 반환
  return () => {
    globalHandlerRegistry.get(type)?.delete(handler as CommandHandler);
  };
};

/**
 * 핸들러 해제
 */
export const unregisterCommandHandler = <T extends AppToWebMessage>(
  type: T["type"],
  handler: CommandHandler<T>
): void => {
  globalHandlerRegistry.get(type)?.delete(handler as CommandHandler);
};

// ============================================================================
// Hook
// ============================================================================

export const useWebViewCommands = () => {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const { setSession, clearSession, notifySessionSet } = useWebViewAuth();
  const { sendRouteInfo } = useWebViewNavigation();

  // ──────────────────────────────────────────────────────────────────────────
  // 기본 핸들러 등록 (내장)
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const cleanups: (() => void)[] = [];

    // NAVIGATE_HOME
    cleanups.push(
      registerCommandHandler("NAVIGATE_HOME", () => {
        router.replace("/");
      })
    );

    // NAVIGATE_TO
    cleanups.push(
      registerCommandHandler<NavigateToMessage>("NAVIGATE_TO", (cmd) => {
        router.replace(cmd.path);
      })
    );

    // GET_ROUTE_INFO
    cleanups.push(
      registerCommandHandler("GET_ROUTE_INFO", () => {
        sendRouteInfo();
      })
    );

    // SET_SESSION
    cleanups.push(
      registerCommandHandler<SetSessionMessage>("SET_SESSION", async (cmd) => {
        const success = await setSession(cmd.access_token, cmd.refresh_token);
        notifySessionSet(success);

        // /login 또는 /app-init에서 세션 설정 시 항상 네비게이션 수행
        const currentPath = pathnameRef.current;
        if (currentPath === "/login" || currentPath === "/app-init") {
          // 상태 안정화 후 이동 (race condition 방지)
          await new Promise((resolve) => setTimeout(resolve, 50));

          if (success) {
            // 세션 설정 성공 → 홈으로
            router.replace("/");
          } else {
            // 세션 설정 실패 → 로그인 페이지로 (스플래시 해제를 위해)
            router.replace("/login");
          }
        }
      })
    );

    // CLEAR_SESSION
    cleanups.push(
      registerCommandHandler("CLEAR_SESSION", async () => {
        await clearSession();
        // WEB_READY 상태 리셋하여 재로그인 시 다시 전송되도록 함
        resetWebReadyState();
        // window.location.replace로 히스토리 완전 교체 (뒤로가기 방지)
        window.location.replace("/login");
      })
    );

    // LOGIN_ERROR
    cleanups.push(
      registerCommandHandler<LoginErrorMessage>("LOGIN_ERROR", (cmd) => {
        console.error(`${LOG_PREFIX} Login error from app:`, cmd.error);
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [router, setSession, clearSession, notifySessionSet, sendRouteInfo]);

  // ──────────────────────────────────────────────────────────────────────────
  // 중앙 이벤트 리스너
  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const handleAppCommand = async (event: CustomEvent<AppToWebMessage>) => {
      const command = event.detail;
      const handlers = globalHandlerRegistry.get(command.type);

      if (handlers && handlers.size > 0) {
        // 등록된 모든 핸들러 실행
        for (const handler of handlers) {
          try {
            await handler(command);
          } catch (error) {
            console.error(
              `${LOG_PREFIX} Handler error for ${command.type}:`,
              error
            );
          }
        }
      }
    };

    window.addEventListener("app-command", handleAppCommand);
    return () => window.removeEventListener("app-command", handleAppCommand);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // 외부 사용을 위한 API
  // ──────────────────────────────────────────────────────────────────────────

  const register = <T extends AppToWebMessage>(
    type: T["type"],
    handler: CommandHandler<T>
  ) => {
    return registerCommandHandler(type, handler);
  };

  return {
    registerHandler: register,
  };
};
