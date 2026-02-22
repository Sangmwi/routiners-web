/**
 * Counselor Chat SSE Callback Factory
 *
 * SSE 스트리밍 콜백을 생성하여 리듀서와 연결
 *
 * Phase 13: 낙관적 업데이트 개선
 * - invalidateAll → 단일 refetchQueries
 * - 중복 refetch 제거 (onComplete에서만 1회)
 * - optimistic 메시지는 refetch로 자동 교체
 *
 * Phase 16: SSE 부분 업데이트
 * - complete 이벤트에 AI 메시지 포함 시 setQueryData로 부분 업데이트
 * - 데이터 없으면 fallback으로 refetch
 */

import type { Dispatch } from 'react';
import type { QueryClient, InfiniteData } from '@tanstack/react-query';
import type { AIToolName } from '@/lib/types/fitness';
import type { ChatStreamCallbacks } from '@/lib/api/conversation';
import type { CounselorChatAction } from './counselorReducer';
import type { CounselorMessagePage } from '@/lib/types/counselor';
import { queryKeys } from '@/lib/constants/queryKeys';
import { removeOptimisticMessages } from '../useSendCounselorMessage';
import { updateCacheWithCompleteData } from './updateMessagesCache';
import { invalidateEventLists, invalidateAfterRoutineApply } from '@/lib/utils/routineEventCacheHelper';

// AI 도구 중 운동 데이터를 변경하는 도구 목록
const WORKOUT_MUTATING_TOOLS = new Set([
  'add_exercise_to_workout',
  'remove_exercise_from_workout',
  'reorder_workout_exercises',
  'update_exercise_sets',
]);

// =============================================================================
// Types
// =============================================================================

export interface CounselorCallbackContext {
  conversationId: string;
  dispatch: Dispatch<CounselorChatAction>;
  queryClient: QueryClient;
  /** 스트리밍 완료 후 호출 (요약 체크 등) */
  onStreamComplete?: (conversationId: string) => void;
}

// =============================================================================
// Factory
// =============================================================================

/**
 * 상담 채팅 콜백 생성
 *
 * Phase 13: 낙관적 업데이트 개선
 * - 단일 refetch로 통합 (onComplete에서만)
 * - 이벤트 핸들러에서 중복 refetch 제거
 * - optimistic 메시지는 refetch로 자동 교체
 */
export function createCounselorCallbacks(ctx: CounselorCallbackContext): ChatStreamCallbacks {
  const { dispatch, queryClient, conversationId, onStreamComplete } = ctx;

  // 메시지 + 대화 캐시 동시 갱신 (단일 호출)
  const refreshCache = async () => {
    await Promise.all([
      queryClient.refetchQueries({
        queryKey: queryKeys.counselor.messages(conversationId),
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.counselor.conversation(conversationId),
      }),
    ]);
  };

  return {
    onMessage: (chunk) => {
      dispatch({ type: 'APPEND_STREAMING', chunk });
    },

    // Phase 16: data 파라미터 추가 (LSP: 기존 호출도 정상 동작)
    onComplete: async (_fullMessage, data) => {
      // 스트리밍 UI 먼저 제거 (캐시 메시지와 중복 방지)
      dispatch({ type: 'COMPLETE_STREAMING' });
      dispatch({ type: 'CLEAR_STREAMING_CONTENT' });

      // Phase 16: 부분 업데이트 또는 fallback
      if (data?.userMessage || data?.aiMessages?.length) {
        // 부분 업데이트: setQueryData로 캐시 직접 수정 (네트워크 요청 없음)
        queryClient.setQueryData<InfiniteData<CounselorMessagePage>>(
          queryKeys.counselor.messages(conversationId),
          (old) => updateCacheWithCompleteData(old, data)
        );
        // 대화 메타데이터만 갱신
        await queryClient.invalidateQueries({
          queryKey: queryKeys.counselor.conversation(conversationId),
        });
      } else {
        // Fallback: 데이터 없으면 전체 refetch
        await refreshCache();
      }

      // 요약 체크 (non-blocking)
      onStreamComplete?.(conversationId);
    },

    onError: (err) => {
      // 오류 시 optimistic 메시지 제거
      removeOptimisticMessages(queryClient, conversationId);
      dispatch({ type: 'SET_ERROR', error: err.message });
    },

    onToolStart: (event) => {
      dispatch({
        type: 'TOOL_START',
        toolCallId: event.toolCallId,
        name: event.name as AIToolName,
      });
    },

    onToolDone: (event) => {
      dispatch({
        type: 'TOOL_DONE',
        toolCallId: event.toolCallId,
        success: event.success ?? true,
      });

      // generate_routine_preview / generate_meal_plan_preview 완료 시 progress bar 클리어
      if (event.name === 'generate_routine_preview' || event.name === 'generate_meal_plan_preview') {
        dispatch({ type: 'CLEAR_ROUTINE_PROGRESS' });
      }

      // 운동 편집 도구 성공 시 routineEvent 캐시 무효화
      // (AI tool call은 서버에서 직접 DB를 수정하므로 프론트 캐시를 갱신해야 함)
      if (event.success !== false && WORKOUT_MUTATING_TOOLS.has(event.name)) {
        invalidateEventLists(queryClient);
      }
    },

    // Phase 13: 이벤트별 refetch 제거
    // → onComplete에서 통합 refetch하므로 개별 refetch 불필요
    // → 서버에서 메시지로 저장 후 onComplete의 refreshCache에서 반영
    onInputRequest: () => {
      // No-op: onComplete에서 처리
    },

    onRoutinePreview: () => {
      // 루틴 생성 완료 → 프로그래스바 제거
      dispatch({ type: 'CLEAR_ROUTINE_PROGRESS' });
      // No-op for refetch: onComplete에서 처리
    },

    onProfileConfirmation: () => {
      // No-op: onComplete에서 처리
    },

    onRoutineApplied: (event) => {
      dispatch({ type: 'SET_APPLIED_ROUTINE', event });
      // AI tool call로 루틴 적용 시 캘린더 + 루틴 목록 + 대화 캐시 무효화
      invalidateAfterRoutineApply(queryClient, conversationId);
    },

    onRoutineProgress: (event) => {
      dispatch({ type: 'SET_ROUTINE_PROGRESS', event });
    },

    onMealPreview: () => {
      // 식단 생성 완료 → 프로그래스바 제거
      dispatch({ type: 'CLEAR_ROUTINE_PROGRESS' });
    },

    onMealPlanApplied: () => {
      // 식단 적용 완료 → 캘린더 + 이벤트 캐시 무효화
      invalidateAfterRoutineApply(queryClient, conversationId);
    },
  };
}
