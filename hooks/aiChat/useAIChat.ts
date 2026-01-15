'use client';

import { useReducer, useRef, useEffect } from 'react';
import { useChatCacheSync } from './useChatCacheSync';
import { AI_SYSTEM_MESSAGE } from '@/lib/constants/aiChat';
import type { ChatMessage, AISessionCompat, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import type {
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import { filterDisplayableMessages } from './helpers/sessionStateBuilder';
import { chatReducer, INITIAL_STATE, type ChatState } from './helpers/chatReducer';
import { useMessageSender } from './useMessageSender';
import { usePreviewActions } from './usePreviewActions';
import { useProfileConfirmation } from './useProfileConfirmation';

// =============================================================================
// Types
// =============================================================================

export interface UseAIChatReturn {
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  /** 대기 중인 루틴 미리보기 */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 루틴 적용 완료 정보 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress: RoutineProgressEvent | null;
  /** 대기 중인 식단 미리보기 */
  pendingMealPreview: MealPlanPreviewData | null;
  /** 식단 적용 완료 정보 */
  appliedMealPlan: MealPlanAppliedEvent | null;
  /** 식단 생성 진행률 */
  mealProgress: MealPlanProgressEvent | null;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  /** 대화 시작 대기 상태 */
  pendingStart: boolean;
  /** 대화 시작 (시작 버튼 클릭 시 호출) */
  startConversation: () => void;
  sendMessage: (message: string) => void;
  submitInput: (value: string | string[]) => void;
  /** 루틴 미리보기 적용 (forceOverwrite: 충돌 시 덮어쓰기) */
  applyRoutine: (forceOverwrite?: boolean) => void;
  /** 루틴 수정 요청 */
  requestRevision: (feedback: string) => void;
  /** 식단 미리보기 적용 (forceOverwrite: 충돌 시 덮어쓰기) */
  applyMealPlan: (forceOverwrite?: boolean) => void;
  /** 식단 수정 요청 */
  requestMealRevision: (feedback: string) => void;
  /** 프로필 데이터 확인 */
  confirmProfile: () => void;
  /** 프로필 수정 요청 */
  requestProfileEdit: () => void;
  cancelStream: () => void;
  clearError: () => void;
  /** 마지막 메시지 재시도 */
  retryLastMessage: () => void;
}

// =============================================================================
// Helpers
// =============================================================================

/** 메시지 생성 헬퍼 */
function createMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): ChatMessage {
  return {
    id: `${role}-${Date.now()}`,
    conversationId: sessionId,
    senderId: undefined,
    role,
    content,
    contentType: 'text',
    createdAt: new Date().toISOString(),
  };
}

// =============================================================================
// Hook
// =============================================================================

/**
 * AI 채팅 훅
 *
 * SSE 스트리밍 기반 AI 채팅 기능 제공
 * - useReducer로 상태 관리 중앙화
 * - 메시지는 DB에 저장되고 세션에서 동기화
 * - tool_call/tool_result는 UI에 표시하지 않음
 */
export function useAIChat(
  session: AISessionCompat | null | undefined
): UseAIChatReturn {
  const sessionId = session?.id;
  const purpose = session?.purpose ?? 'workout';

  // 캐시 동기화 유틸리티
  const cacheSync = useChatCacheSync(purpose);

  // useReducer로 상태 관리
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  // 콜백에서 현재 상태 참조용 (closure 문제 해결)
  const stateRef = useRef<ChatState>(state);
  stateRef.current = state;

  const sessionIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 분리된 훅들
  // ---------------------------------------------------------------------------

  const messageSender = useMessageSender({
    sessionId,
    state,
    stateRef,
    dispatch,
    cacheSync,
    createMessage,
  });

  const previewActions = usePreviewActions({
    sessionId,
    state,
    dispatch,
    cacheSync,
    sendMessage: messageSender.sendMessageWithOptions,
  });

  const profileConfirmation = useProfileConfirmation({
    sessionId,
    state,
    dispatch,
    cacheSync,
    sendMessage: messageSender.sendMessageWithOptions,
  });

  // ---------------------------------------------------------------------------
  // 세션 변경 시 메시지 동기화 + 새 세션 자동 시작
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session?.id) return;

    const isNewSession = session.id !== sessionIdRef.current;

    // DB 메시지 동기화 (tool_call, tool_result 제외)
    const displayMessages = filterDisplayableMessages(session.messages ?? []);
    const hasMessages = displayMessages.length > 0;

    if (isNewSession) {
      // 새 세션 또는 다른 세션으로 전환
      sessionIdRef.current = session.id;
      hasInitializedRef.current = true;

      if (hasMessages) {
        // 기존 세션 복귀: DB 메시지 + 메타데이터로 상태 복구
        dispatch({ type: 'RESTORE_SESSION', session, messages: displayMessages });
      } else {
        // 새 세션: 초기 인사말 + 시작 대기 상태
        dispatch({ type: 'NEW_SESSION', sessionId: session.id, purpose });
      }
    } else if (hasInitializedRef.current) {
      // 동일 세션이지만 데이터 업데이트 (React Query refetch 등)
      dispatch({ type: 'MERGE_SESSION', session, messages: displayMessages });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.id, session?.messages, session?.metadata]);

  // ---------------------------------------------------------------------------
  // 대화 시작 (사용자가 시작 버튼 클릭 시)
  // ---------------------------------------------------------------------------

  const startConversation = () => {
    if (!sessionId || !state.pendingStart) return;

    dispatch({ type: 'SET_PENDING_START', pending: false });
    messageSender.sendMessageWithOptions(AI_SYSTEM_MESSAGE.START, { skipGuards: true });
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    // 상태
    messages: state.messages,
    streamingContent: state.streamingContent,
    isStreaming: state.isSending,
    error: state.error,
    activeTools: state.activeTools,
    pendingInput: state.pendingInput,
    pendingRoutinePreview: state.pendingRoutinePreview,
    appliedRoutine: state.appliedRoutine,
    routineProgress: state.routineProgress,
    pendingMealPreview: state.pendingMealPreview,
    appliedMealPlan: state.appliedMealPlan,
    mealProgress: state.mealProgress,
    pendingProfileConfirmation: state.pendingProfileConfirmation,
    pendingStart: state.pendingStart,

    // 메시지 전송 액션
    sendMessage: messageSender.sendMessage,
    submitInput: messageSender.submitInput,
    cancelStream: messageSender.cancelStream,
    clearError: messageSender.clearError,
    retryLastMessage: messageSender.retryLastMessage,

    // 미리보기 액션
    applyRoutine: previewActions.applyRoutine,
    requestRevision: previewActions.requestRevision,
    applyMealPlan: previewActions.applyMealPlan,
    requestMealRevision: previewActions.requestMealRevision,

    // 프로필 확인 액션
    confirmProfile: profileConfirmation.confirmProfile,
    requestProfileEdit: profileConfirmation.requestProfileEdit,

    // 대화 시작
    startConversation,
  };
}
