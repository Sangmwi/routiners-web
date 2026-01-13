'use client';

import { useReducer, useRef, useEffect } from 'react';
import { aiChatApi, conversationApi } from '@/lib/api/conversation';
import { useChatCacheSync } from './useChatCacheSync';
import { AI_SYSTEM_MESSAGE, isSystemMessage } from '@/lib/constants/aiChat';
import type { ChatMessage, AISessionCompat, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';
import type {
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import { createChatCallbacks } from './helpers/createChatCallbacks';
import { applyPreview } from './helpers/applyPreview';
import { filterDisplayableMessages } from './helpers/sessionStateBuilder';
import { chatReducer, INITIAL_STATE, type ChatState } from './helpers/chatReducer';

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
  const abortControllerRef = useRef<AbortController | null>(null);

  const sessionId = session?.id;
  const purpose = session?.purpose ?? 'workout';

  // 캐시 동기화 유틸리티
  const cacheSync = useChatCacheSync(purpose);
  const sessionIdRef = useRef<string | null>(null);
  const pendingUserMessageRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);

  // useReducer로 상태 관리
  const [state, dispatch] = useReducer(chatReducer, INITIAL_STATE);

  // 콜백에서 현재 상태 참조용 (closure 문제 해결)
  const stateRef = useRef<ChatState>(state);
  stateRef.current = state;

  // isSendingRef를 항상 최신 상태로 유지
  isSendingRef.current = state.isSending;

  const hasInitializedRef = useRef(false);

  // ---------------------------------------------------------------------------
  // 메시지 전송 (내부 + 외부 공용)
  // ---------------------------------------------------------------------------

  const sendMessageCore = (message: string, options: { skipGuards?: boolean; skipMessageAdd?: boolean } = {}) => {
    const { skipGuards = false, skipMessageAdd = false } = options;

    if (!sessionId) return;
    if (!skipGuards && (state.isSending || !message.trim())) return;

    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    const isSystem = isSystemMessage(message);

    // 낙관적 업데이트 (시스템 메시지 제외, skipMessageAdd면 메시지 추가 생략)
    const userMessage = !isSystem && !skipMessageAdd
      ? createMessage(sessionId, 'user', message)
      : null;

    const updatedMessages = userMessage
      ? [...state.messages, userMessage]
      : state.messages;

    // 캐시 동기화 (사용자 메시지 추가 시)
    if (userMessage) {
      cacheSync.syncMessagesAndMetadata(updatedMessages, {
        pending_input: undefined,
        pending_profile_confirmation: undefined,
      });
    }

    dispatch({
      type: 'START_SENDING',
      messages: updatedMessages,
      keepPendingInput: skipGuards,
    });

    const callbacks = createChatCallbacks({
      sessionId,
      dispatch,
      cacheSync,
      abortControllerRef,
      isSystemMessage: isSystem,
      createMessage,
      getMessages: () => stateRef.current.messages,
    });

    abortControllerRef.current = aiChatApi.sendMessage(sessionId, message, callbacks);
  };

  // 외부 API: 가드 체크 적용
  const sendMessage = (message: string) => sendMessageCore(message, {});

  // ---------------------------------------------------------------------------
  // 세션 변경 시 메시지 동기화 + 새 세션 자동 시작
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!session?.id) return;

    const isNewSession = session.id !== sessionIdRef.current;

    // 세션이 변경되면 이전 스트림 정리
    if (isNewSession && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

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
  // 대기 중인 사용자 메시지 전송 (isSending이 false가 되면)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!state.isSending && pendingUserMessageRef.current && sessionId) {
      const message = pendingUserMessageRef.current;
      pendingUserMessageRef.current = null;
      sendMessageCore(message, { skipMessageAdd: true });
    }
  }, [state.isSending, sessionId]);

  // ---------------------------------------------------------------------------
  // 선택형 입력 제출
  // ---------------------------------------------------------------------------

  const submitInput = (value: string | string[]) => {
    if (!sessionId) return;

    const messageText = Array.isArray(value) ? value.join(', ') : value;

    // 사용자 메시지를 즉시 UI에 추가 (낙관적 업데이트)
    const messagesWithAI = state.pendingInput?.message
      ? [...state.messages, createMessage(sessionId, 'assistant', state.pendingInput.message)]
      : state.messages;

    const messagesWithUser = [...messagesWithAI, createMessage(sessionId, 'user', messageText)];

    dispatch({ type: 'SUBMIT_INPUT', messages: messagesWithUser });

    // React Query 캐시 즉시 동기화 (race condition 방지)
    cacheSync.syncPendingInput(null);

    // isSendingRef를 사용하여 최신 값 확인 (closure 문제 방지)
    if (isSendingRef.current) {
      pendingUserMessageRef.current = messageText;
    } else {
      sendMessageCore(messageText, { skipMessageAdd: true });
    }
  };

  // ---------------------------------------------------------------------------
  // 미리보기 적용 / 수정 요청
  // ---------------------------------------------------------------------------

  const applyRoutineHandler = (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingRoutinePreview) return;
    applyPreview('routine', sessionId, state.pendingRoutinePreview.id, dispatch, cacheSync, forceOverwrite);
  };

  const applyMealPlanHandler = (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingMealPreview) return;
    applyPreview('meal', sessionId, state.pendingMealPreview.id, dispatch, cacheSync, forceOverwrite);
  };

  const requestRevision = (feedback: string) => {
    if (!sessionId || !state.pendingRoutinePreview) return;
    dispatch({ type: 'CLEAR_ROUTINE_PREVIEW' });
    sendMessageCore(feedback, {});
  };

  const requestMealRevision = (feedback: string) => {
    if (!sessionId || !state.pendingMealPreview) return;
    dispatch({ type: 'CLEAR_MEAL_PREVIEW' });
    sendMessageCore(feedback, {});
  };

  // ---------------------------------------------------------------------------
  // 프로필 확인 / 수정 요청 (통합 핸들러)
  // ---------------------------------------------------------------------------

  const handleProfileResponse = async (isConfirmed: boolean) => {
    if (!sessionId || !state.pendingProfileConfirmation) return;

    // 필드 라벨 추출 (상태 클리어 전에)
    const labels = state.pendingProfileConfirmation.fields
      .map((f) => f.label)
      .join(', ');

    // 로컬 상태 즉시 초기화 (UI 반응성)
    dispatch({ type: 'CLEAR_PROFILE_CONFIRMATION' });

    // DB 메타데이터 즉시 클리어 (페이지 이탈 후 복귀 시 복원 방지)
    try {
      await conversationApi.clearProfileConfirmation(sessionId);
      cacheSync.syncProfileConfirmation(null);
    } catch (e) {
      console.error('[handleProfileResponse] Failed to clear metadata:', e);
    }

    // 컨텍스트 포함 메시지 전송
    const message = isConfirmed
      ? `[프로필 확인 완료] ${labels} 정보를 확인했습니다. 모두 정확합니다. 다음 단계로 진행해주세요.`
      : `[프로필 수정 요청] ${labels} 중에서 수정하고 싶은 정보가 있어요.`;
    sendMessageCore(message, {});
  };

  const confirmProfile = () => handleProfileResponse(true);
  const requestProfileEdit = () => handleProfileResponse(false);

  // ---------------------------------------------------------------------------
  // 대화 시작 (사용자가 시작 버튼 클릭 시)
  // ---------------------------------------------------------------------------

  const startConversation = () => {
    if (!sessionId || !state.pendingStart) return;

    dispatch({ type: 'SET_PENDING_START', pending: false });
    sendMessageCore(AI_SYSTEM_MESSAGE.START, { skipGuards: true });
  };

  // ---------------------------------------------------------------------------
  // 스트리밍 취소 & 에러 초기화
  // ---------------------------------------------------------------------------

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    dispatch({ type: 'CANCEL_STREAM' });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
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
    sendMessage,
    submitInput,
    applyRoutine: applyRoutineHandler,
    requestRevision,
    applyMealPlan: applyMealPlanHandler,
    requestMealRevision,
    confirmProfile,
    requestProfileEdit,
    startConversation,
    cancelStream,
    clearError,
  };
}
