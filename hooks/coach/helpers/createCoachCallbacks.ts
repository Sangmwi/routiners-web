/**
 * Coach Chat SSE Callback Factory
 *
 * SSE 스트리밍 콜백을 생성하여 리듀서와 연결
 * 프로필 확인 버퍼링으로 layout shift 방지
 */

import type { Dispatch, MutableRefObject } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { ProfileConfirmationRequest } from '@/lib/types/chat';
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
  profileBufferRef: MutableRefObject<ProfileConfirmationRequest | null>;
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

      // 메시지 + 대화 캐시 무효화 (대화 메타데이터 업데이트 반영 — 뒤로가기 시 상태 복원용)
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

      // 버퍼링된 프로필 확인 요청 적용 (messages 로드 후 → layout shift 방지)
      if (ctx.profileBufferRef.current) {
        ctx.dispatch({ type: 'APPLY_BUFFERED_PROFILE_CONFIRMATION' });
        ctx.profileBufferRef.current = null;
      }

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

    onInputRequest: (request) => {
      ctx.dispatch({ type: 'SET_PENDING_INPUT', request });
    },

    onRoutinePreview: (preview) => {
      ctx.dispatch({ type: 'SET_ROUTINE_PREVIEW', preview });
    },

    onRoutineApplied: (event) => {
      ctx.dispatch({ type: 'SET_APPLIED_ROUTINE', event });
    },

    onRoutineProgress: (event) => {
      ctx.dispatch({ type: 'SET_ROUTINE_PROGRESS', event });
    },

    onProfileConfirmation: (request) => {
      // 스트리밍 중에는 ref에 버퍼링 (onComplete에서 messages refetch 후 적용)
      // → 메시지보다 카드가 먼저 렌더되는 layout shift 방지
      ctx.profileBufferRef.current = request;
      ctx.dispatch({ type: 'BUFFER_PROFILE_CONFIRMATION', request });
    },
  };
}
