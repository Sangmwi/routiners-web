/**
 * Coach Chat SSE Callback Factory
 *
 * SSE 스트리밍 콜백을 생성하여 리듀서와 연결
 * Phase 9: 트랜지언트 UI는 메시지로 저장되므로 즉시 invalidate
 *
 * SOLID 원칙 적용:
 * - SRP: 스트리밍 상태와 서버 동기화를 핸들러로 분리
 * - DIP: 인터페이스에 의존, 구체 구현은 핸들러에서
 */

import type { Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AIToolName } from '@/lib/types/fitness';
import type { ChatStreamCallbacks } from '@/lib/api/conversation';
import type { CoachChatAction } from './coachReducer';
import type { StreamingStateDispatcher } from '../interfaces/streamingStateDispatcher';
import type { ServerDataSync } from '../interfaces/serverDataSync';
import { DispatchStreamingStateHandler } from './streamingStateHandler';
import { QueryClientServerDataSyncHandler } from './serverDataSyncHandler';

// =============================================================================
// Types
// =============================================================================

export interface CoachCallbackContext {
  conversationId: string;
  dispatch: Dispatch<CoachChatAction>;
  queryClient: QueryClient;
  /** 스트리밍 완료 후 호출 (요약 체크 등) */
  onStreamComplete?: (conversationId: string) => void;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * 코치 채팅 콜백 생성
 *
 * 스트리밍 상태 관리와 서버 데이터 동기화를 핸들러로 분리 (SRP)
 * 인터페이스에 의존하여 테스트 및 확장 가능 (DIP)
 */
export function createCoachCallbacks(ctx: CoachCallbackContext): ChatStreamCallbacks {
  // 핸들러 생성 (인터페이스 구현)
  const stateHandler: StreamingStateDispatcher = new DispatchStreamingStateHandler(ctx.dispatch);
  const syncHandler: ServerDataSync = new QueryClientServerDataSyncHandler(ctx.queryClient);

  return {
    onMessage: (chunk) => {
      stateHandler.appendChunk(chunk);
    },

    onComplete: async () => {
      stateHandler.completeStreaming();

      // 메시지 + 대화 캐시 무효화 (서버 메시지 반영)
      await syncHandler.invalidateAll(ctx.conversationId);

      // 서버 메시지 로드 완료 → 스트리밍 플레이스홀더 제거
      stateHandler.clearStreamingContent();

      // 실제 메시지 로드 완료 → 낙관적 메시지 제거
      stateHandler.clearPendingUserMessage();

      // 요약 체크 (non-blocking)
      ctx.onStreamComplete?.(ctx.conversationId);
    },

    onError: (err) => {
      stateHandler.setError(err.message);
    },

    onToolStart: (event) => {
      stateHandler.toolStart(event.toolCallId, event.name as AIToolName);
    },

    onToolDone: (event) => {
      stateHandler.toolDone(event.toolCallId, event.success ?? true);
    },

    onInputRequest: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      await syncHandler.invalidateMessages(ctx.conversationId);
    },

    onRoutinePreview: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      await syncHandler.invalidateMessages(ctx.conversationId);
    },

    onRoutineApplied: (event) => {
      stateHandler.setAppliedRoutine(event);
    },

    onRoutineProgress: (event) => {
      stateHandler.setRoutineProgress(event);
    },

    onProfileConfirmation: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      // → messages 배열에 포함되어 ChatMessage 컴포넌트에서 렌더링됨
      await syncHandler.invalidateMessages(ctx.conversationId);
    },
  };
}
