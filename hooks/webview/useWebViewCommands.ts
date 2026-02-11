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

interface UseWebViewCommandsOptions {
  resetSessionCheck: () => void;
}

export const useWebViewCommands = ({ resetSessionCheck }: UseWebViewCommandsOptions) => {
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const { setSession, clearSession, notifySessionSet } = useWebViewAuth();
  const { sendRouteInfo } = useWebViewNavigation();

  // ──────────────────────────────────────────────────────────────────────────
  // 글로벌 핸들러 (앱 전역에서 필요한 이벤트)
  //
  // 페이지 전용 이벤트는 도메인별 훅에서 처리:
  // - LOGIN_CANCELLED, LOGIN_ERROR → useLoginCommands.ts
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
    // /login에서만 리다이렉트 (홈에서 refresh 후 SET_SESSION은 리다이렉트 불필요)
    cleanups.push(
      registerCommandHandler<SetSessionMessage>("SET_SESSION", async (cmd) => {
        const success = await setSession(cmd.access_token, cmd.refresh_token);
        notifySessionSet(success);

        // /login에서 로그인 성공 시에만 홈으로 리다이렉트
        const currentPath = pathnameRef.current;
        if (currentPath === "/login" && success) {
          await new Promise<void>((resolve) => queueMicrotask(resolve));
          router.replace("/");
        }
      })
    );

    // CLEAR_SESSION
    cleanups.push(
      registerCommandHandler("CLEAR_SESSION", async () => {
        await clearSession();
        // 세션 체크 상태 리셋하여 재로그인 시 다시 전송되도록 함
        resetSessionCheck();
        // window.location.replace로 히스토리 완전 교체 (뒤로가기 방지)
        router.replace("/login");
      })
    );

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [router, setSession, clearSession, notifySessionSet, sendRouteInfo, resetSessionCheck]);

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
