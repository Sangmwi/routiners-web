/**
 * Coach Chat SSE Callback Factory
 *
 * SSE 스트리밍 콜백을 생성하여 리듀서와 연결
 * Phase 9: 트랜지언트 UI는 메시지로 저장되므로 즉시 invalidate
 */

import type { Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { AIToolName } from '@/lib/types/fitness';
import type { ChatStreamCallbacks } from '@/lib/api/conversation';
import type { CoachChatAction } from './coachReducer';
import { queryKeys } from '@/lib/constants/queryKeys';

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

export function createCoachCallbacks(ctx: CoachCallbackContext): ChatStreamCallbacks {
  return {
    onMessage: (chunk) => {
      ctx.dispatch({ type: 'APPEND_STREAMING', chunk });
    },

    onComplete: async () => {
      ctx.dispatch({ type: 'COMPLETE_STREAMING' });

      // 메시지 + 대화 캐시 무효화 (서버 메시지 반영)
      await Promise.all([
        ctx.queryClient.invalidateQueries({
          queryKey: queryKeys.coach.messages(ctx.conversationId),
        }),
        ctx.queryClient.invalidateQueries({
          queryKey: queryKeys.coach.conversation(ctx.conversationId),
        }),
      ]);

      // 서버 메시지 로드 완료 → 스트리밍 플레이스홀더 제거
      ctx.dispatch({ type: 'CLEAR_STREAMING_CONTENT' });

      // 실제 메시지 로드 완료 → 낙관적 메시지 제거
      ctx.dispatch({ type: 'CLEAR_PENDING_USER_MESSAGE' });

      // 요약 체크 (non-blocking)
      ctx.onStreamComplete?.(ctx.conversationId);
    },

    onError: (err) => {
      ctx.dispatch({ type: 'SET_ERROR', error: err.message });
    },

    onToolStart: (event) => {
      ctx.dispatch({
        type: 'TOOL_START',
        toolCallId: event.toolCallId,
        name: event.name as AIToolName,
      });
    },

    onToolDone: (event) => {
      ctx.dispatch({
        type: 'TOOL_DONE',
        toolCallId: event.toolCallId,
        success: event.success ?? true,
      });
    },

    onInputRequest: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      await ctx.queryClient.invalidateQueries({
        queryKey: queryKeys.coach.messages(ctx.conversationId),
      });
    },

    onRoutinePreview: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      await ctx.queryClient.invalidateQueries({
        queryKey: queryKeys.coach.messages(ctx.conversationId),
      });
    },

    onRoutineApplied: (event) => {
      ctx.dispatch({ type: 'SET_APPLIED_ROUTINE', event });
    },

    onRoutineProgress: (event) => {
      ctx.dispatch({ type: 'SET_ROUTINE_PROGRESS', event });
    },

    onProfileConfirmation: async () => {
      // Phase 9: 서버에서 이미 메시지를 저장했으므로 즉시 쿼리 invalidate
      // → messages 배열에 포함되어 ChatMessage 컴포넌트에서 렌더링됨
      await ctx.queryClient.invalidateQueries({
        queryKey: queryKeys.coach.messages(ctx.conversationId),
      });
    },
  };
}
