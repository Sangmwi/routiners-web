'use client';

import { useState, useRef, useEffect } from 'react';
import {
  aiChatApi,
  ChatStreamCallbacks,
  ToolEvent,
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import { useChatCacheSync } from './useChatCacheSync';
import {
  AI_CHAT_TIMING,
  AI_SYSTEM_MESSAGE,
  isSystemMessage,
  createInitialGreetingMessage,
} from '@/lib/constants/aiChat';
import { ChatMessage, AISessionCompat, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolName, AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { MealPlanPreviewData } from '@/lib/types/meal';

// =============================================================================
// Types
// =============================================================================

interface ChatState {
  messages: ChatMessage[];
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  activeTools: AIToolStatus[];
  pendingInput: InputRequest | null;
  /** 대기 중인 루틴 미리보기 (사용자 확인 대기) */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 루틴 적용 완료 정보 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress: RoutineProgressEvent | null;
  /** 대기 중인 식단 미리보기 (사용자 확인 대기) */
  pendingMealPreview: MealPlanPreviewData | null;
  /** 식단 적용 완료 정보 */
  appliedMealPlan: MealPlanAppliedEvent | null;
  /** 식단 생성 진행률 */
  mealProgress: MealPlanProgressEvent | null;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  /** 대화 시작 대기 상태 (시작 버튼 클릭 대기) */
  pendingStart: boolean;
}

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
// Constants & Helpers
// =============================================================================

const INITIAL_STATE: ChatState = {
  messages: [],
  streamingContent: '',
  isSending: false,
  error: null,
  activeTools: [],
  pendingInput: null,
  pendingRoutinePreview: null,
  appliedRoutine: null,
  routineProgress: null,
  pendingMealPreview: null,
  appliedMealPlan: null,
  mealProgress: null,
  pendingProfileConfirmation: null,
  pendingStart: false,
};

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

/** UI에 표시할 메시지만 필터링 (tool_call, tool_result 제외) */
function filterDisplayableMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => m.contentType === 'text' || !m.contentType);
}

// =============================================================================
// Hook
// =============================================================================

/**
 * AI 채팅 훅
 *
 * SSE 스트리밍 기반 AI 채팅 기능 제공
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
  const pendingUserMessageRef = useRef<string | null>(null); // isSending 중 대기 메시지
  const isSendingRef = useRef(false); // 최신 isSending 값 추적 (closure 문제 해결)

  const [state, setState] = useState<ChatState>(INITIAL_STATE);

  // isSendingRef를 항상 최신 상태로 유지
  isSendingRef.current = state.isSending;

  const hasInitializedRef = useRef(false); // 초기 로드 완료 여부 (새로고침 감지용)

  // ---------------------------------------------------------------------------
  // 도구 상태 정리 스케줄러
  // ---------------------------------------------------------------------------

  const scheduleToolCleanup = (status: AIToolStatus['status'], delayMs: number) => {
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        activeTools: prev.activeTools.filter((t) => t.status !== status),
      }));
    }, delayMs);
  };

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

    setState((prev) => {
      const updatedMessages = userMessage
        ? [...prev.messages, userMessage]
        : prev.messages;

      // ✅ 캐시 동기화 (사용자 메시지 추가 시)
      if (userMessage) {
        cacheSync.syncMessagesAndMetadata(updatedMessages, {
          pending_input: undefined,
          pending_profile_confirmation: undefined,
        });
      }

      return {
        ...prev,
        messages: updatedMessages,
        streamingContent: '',
        isSending: true,
        error: null,
        activeTools: [],
        pendingInput: skipGuards ? prev.pendingInput : null, // 자동 시작 시 pendingInput 유지
      };
    });

    const callbacks: ChatStreamCallbacks = {
      onMessage: (chunk) => {
        setState((prev) => ({
          ...prev,
          streamingContent: prev.streamingContent + chunk,
        }));
      },

      onToolStart: (event: ToolEvent) => {
        setState((prev) => ({
          ...prev,
          activeTools: [
            ...prev.activeTools,
            {
              toolCallId: event.toolCallId,
              name: event.name as AIToolName,
              status: 'running',
            },
          ],
        }));
      },

      onToolDone: (event: ToolEvent) => {
        setState((prev) => ({
          ...prev,
          activeTools: prev.activeTools.map((tool) =>
            tool.toolCallId === event.toolCallId
              ? { ...tool, status: event.success ? 'completed' : 'error', error: event.error }
              : tool
          ),
        }));
      },

      onInputRequest: (request: InputRequest) => {
        setState((prev) => ({
          ...prev,
          pendingInput: request,
          isSending: false,
        }));
        // ✅ 캐시 동기화 (pending_input은 서버에서 metadata에 저장됨)
        cacheSync.syncPendingInput(request);
      },

      onRoutinePreview: (preview: RoutinePreviewData) => {
        setState((prev) => ({
          ...prev,
          pendingRoutinePreview: preview,
          pendingInput: null,  // ✅ 이전 입력 요청 정리
          routineProgress: null, // 진행률 초기화
          isSending: false,
        }));
        // ✅ 캐시 동기화 (pending_input도 함께 정리됨)
        cacheSync.syncRoutinePreview(preview);
      },

      onRoutineApplied: (event: RoutineAppliedEvent) => {
        setState((prev) => ({
          ...prev,
          appliedRoutine: event,
          pendingRoutinePreview: null, // 미리보기 상태 해제
        }));
        // ✅ 캐시 동기화
        cacheSync.syncRoutineApplied(event);
      },

      onRoutineProgress: (event: RoutineProgressEvent) => {
        setState((prev) => ({
          ...prev,
          routineProgress: event,
        }));
      },

      onMealPlanPreview: (preview: MealPlanPreviewData) => {
        setState((prev) => ({
          ...prev,
          pendingMealPreview: preview,
          pendingInput: null,  // ✅ 이전 입력 요청 정리
          mealProgress: null, // 진행률 초기화
          isSending: false,
        }));
        // ✅ 캐시 동기화 (pending_input도 함께 정리됨)
        cacheSync.syncMealPlanPreview(preview);
      },

      onMealPlanApplied: (event: MealPlanAppliedEvent) => {
        setState((prev) => ({
          ...prev,
          appliedMealPlan: event,
          pendingMealPreview: null, // 미리보기 상태 해제
        }));
        // ✅ 캐시 동기화
        cacheSync.syncMealPlanApplied(event);
      },

      onMealPlanProgress: (event: MealPlanProgressEvent) => {
        setState((prev) => ({
          ...prev,
          mealProgress: event,
        }));
      },

      onProfileConfirmation: (request: ProfileConfirmationRequest) => {
        setState((prev) => ({
          ...prev,
          pendingProfileConfirmation: request,
          isSending: false,
        }));
        // ✅ 캐시 동기화
        cacheSync.syncProfileConfirmation(request);
      },

      onComplete: (fullMessage) => {
        // ⚠️ 중요: abortControllerRef를 먼저 null로 설정해야 함
        // invalidateQueries가 캐시 업데이트 → useEffect cleanup 트리거할 수 있음
        // cleanup에서 abort() 호출 방지를 위해 먼저 null 처리
        abortControllerRef.current = null;

        // 새 메시지 생성
        const newMessage = fullMessage.trim()
          ? createMessage(sessionId, 'assistant', fullMessage)
          : null;

        setState((prev) => {
          const updatedMessages = newMessage
            ? [...prev.messages, newMessage]
            : prev.messages;

          // ✅ React Query active 캐시 동기화 (페이지 이탈 후 복귀 시 최신 데이터 유지)
          cacheSync.syncMessages(updatedMessages);

          return {
            ...prev,
            messages: updatedMessages,
            streamingContent: '',
            isSending: false,
            error: null,
            routineProgress: null, // 진행률 초기화
            mealProgress: null, // 식단 진행률 초기화
          };
        });

        // 도구 상태 정리
        scheduleToolCleanup('completed', AI_CHAT_TIMING.TOOL_COMPLETED_DISPLAY_MS);
        scheduleToolCleanup('error', AI_CHAT_TIMING.TOOL_ERROR_DISPLAY_MS);

        // 캐시 갱신 (detail만 무효화)
        // ⚠️ active 쿼리는 무효화하지 않음: 위에서 syncMessages로 직접 업데이트
        cacheSync.invalidateDetail(sessionId);
      },

      onError: (error) => {
        // AbortError는 정상적인 취소이므로 무시 (세션 전환 등)
        if (error.name === 'AbortError') {
          abortControllerRef.current = null;
          return;
        }

        setState((prev) => ({
          ...prev,
          // 에러 시 마지막 사용자 메시지 롤백 (시스템 메시지 제외)
          messages: isSystem ? prev.messages : prev.messages.slice(0, -1),
          streamingContent: '',
          isSending: false,
          error: error.message || '메시지 전송에 실패했습니다.',
        }));

        abortControllerRef.current = null;
      },
    };

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

    // 메타데이터에서 상태 추출
    const pendingPreview = session.metadata?.pending_preview ?? null;
    const appliedRoutineFromDb = session.metadata?.applied_routine ?? null;
    const pendingMealPreviewFromDb = (session.metadata as Record<string, unknown>)?.pending_meal_preview as MealPlanPreviewData | null ?? null;
    const appliedMealFromDb = (session.metadata as Record<string, unknown>)?.applied_meal_plan as MealPlanAppliedEvent | null ?? null;
    const pendingProfileConfirmationFromDb = (session.metadata as Record<string, unknown>)?.pending_profile_confirmation as ProfileConfirmationRequest | null ?? null;
    const pendingInputFromDb = (session.metadata as Record<string, unknown>)?.pending_input as InputRequest | null ?? null;

    if (isNewSession) {
      // 새 세션 또는 다른 세션으로 전환
      sessionIdRef.current = session.id;
      hasInitializedRef.current = true;

      if (hasMessages) {
        // 기존 세션 복귀: DB 메시지 + 모든 상태 복구
        setState({
          ...INITIAL_STATE,
          messages: displayMessages,
          pendingRoutinePreview: pendingPreview,
          appliedRoutine: appliedRoutineFromDb,
          pendingMealPreview: pendingMealPreviewFromDb,
          appliedMealPlan: appliedMealFromDb,
          pendingProfileConfirmation: pendingProfileConfirmationFromDb,
          pendingInput: pendingInputFromDb,
        });
      } else {
        // 새 세션: 초기 인사말 + 시작 대기 상태
        const greetingMessage = createInitialGreetingMessage(session.id, purpose);

        setState({
          ...INITIAL_STATE,
          messages: [greetingMessage],
          pendingStart: true,  // 시작 버튼 클릭 대기
        });

        // 자동 시작 제거 - 사용자가 startConversation() 호출 시 시작
      }
    } else if (hasInitializedRef.current) {
      // 동일 세션이지만 데이터 업데이트 (React Query refetch 등)
      // DB 메타데이터가 source of truth이므로 DB 값으로 동기화
      // (단, 현재 스트리밍 중이면 로컬 상태 유지)
      setState((prev) => {
        // 스트리밍 중이면 로컬 상태 유지 (SSE 이벤트가 실시간 업데이트 중)
        if (prev.isSending) return prev;

        return {
          ...prev,
          // 메시지는 로컬 상태가 더 최신일 수 있으므로 유지
          messages: prev.messages.length > 0 ? prev.messages : displayMessages,
          // 메타데이터는 DB가 source of truth (새로고침/복귀 시 복원 보장)
          pendingRoutinePreview: pendingPreview,
          appliedRoutine: appliedRoutineFromDb,
          pendingMealPreview: pendingMealPreviewFromDb,
          appliedMealPlan: appliedMealFromDb,
          pendingProfileConfirmation: pendingProfileConfirmationFromDb,
          pendingInput: pendingInputFromDb,
        };
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- purpose는 session?.purpose에서 파생되므로 session?.id 변경 시 자동 반영됨
  }, [session?.id, session?.messages, session?.metadata]);

  // ---------------------------------------------------------------------------
  // 대기 중인 사용자 메시지 전송 (isSending이 false가 되면)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    // isSending이 false이고 대기 중인 메시지가 있으면 전송
    if (!state.isSending && pendingUserMessageRef.current && sessionId) {
      const message = pendingUserMessageRef.current;
      // 먼저 ref를 null로 설정하여 중복 실행 방지
      pendingUserMessageRef.current = null;
      // 이미 submitInput에서 메시지가 추가되었으므로 skipMessageAdd
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
    setState((prev) => {
      // pendingInput.message가 있으면 AI 메시지로 저장 (대화 흐름 유지)
      const messagesWithAI = prev.pendingInput?.message
        ? [...prev.messages, createMessage(sessionId, 'assistant', prev.pendingInput.message)]
        : prev.messages;

      // 사용자 메시지 추가
      const messagesWithUser = [...messagesWithAI, createMessage(sessionId, 'user', messageText)];

      return { ...prev, messages: messagesWithUser, pendingInput: null };
    });

    // isSendingRef를 사용하여 최신 값 확인 (closure 문제 방지)
    if (isSendingRef.current) {
      pendingUserMessageRef.current = messageText;
    } else {
      // 이미 위에서 메시지를 추가했으므로 skipMessageAdd
      sendMessageCore(messageText, { skipMessageAdd: true });
    }
  };

  // ---------------------------------------------------------------------------
  // 루틴 미리보기 적용 / 수정 요청
  // ---------------------------------------------------------------------------

  const applyRoutine = async (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingRoutinePreview) return;

    const previewId = state.pendingRoutinePreview.id;

    // 로딩 상태로 전환
    setState((prev) => ({
      ...prev,
      isSending: true,
      error: null,
    }));

    try {
      // 직접 API 호출 (AI 의존성 제거)
      const response = await fetch('/api/routine/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: sessionId,
          previewId,
          forceOverwrite: forceOverwrite || false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: result.error || '루틴 적용에 실패했습니다.',
        }));
        return;
      }

      // 성공: appliedRoutine 상태 업데이트, pendingRoutinePreview 제거
      setState((prev) => ({
        ...prev,
        isSending: false,
        appliedRoutine: {
          previewId: result.data.previewId,
          eventsCreated: result.data.eventsCreated,
          startDate: result.data.startDate,
        },
        pendingRoutinePreview: null,
      }));

      // 캐시 갱신: 세션 목록만 (히스토리용) - 완료 UI 유지를 위해 active 무효화 제거
      cacheSync.invalidateAll();
    } catch (error) {
      console.error('[applyRoutine] Error:', error);
      setState((prev) => ({
        ...prev,
        isSending: false,
        error: '루틴 적용 중 오류가 발생했습니다.',
      }));
    }
  };

  const requestRevision = (feedback: string) => {
    if (!sessionId || !state.pendingRoutinePreview) return;

    // 미리보기 상태 해제 후 피드백 메시지 전송
    setState((prev) => ({
      ...prev,
      pendingRoutinePreview: null,
    }));

    // 수정 요청 메시지 전송 (AI가 피드백 반영 후 다시 generate_routine_preview 호출)
    sendMessageCore(feedback, {});
  };

  // ---------------------------------------------------------------------------
  // 식단 미리보기 적용 / 수정 요청
  // ---------------------------------------------------------------------------

  const applyMealPlan = async (forceOverwrite?: boolean) => {
    if (!sessionId || !state.pendingMealPreview) return;

    const previewId = state.pendingMealPreview.id;

    // 로딩 상태로 전환
    setState((prev) => ({
      ...prev,
      isSending: true,
      error: null,
    }));

    try {
      // 직접 API 호출 (AI 의존성 제거)
      const response = await fetch('/api/meal/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: sessionId,
          previewId,
          forceOverwrite: forceOverwrite || false,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: result.error || '식단 적용에 실패했습니다.',
        }));
        return;
      }

      // 성공: appliedMealPlan 상태 업데이트, pendingMealPreview 제거
      setState((prev) => ({
        ...prev,
        isSending: false,
        appliedMealPlan: {
          previewId: result.data.previewId,
          eventsCreated: result.data.eventsCreated,
          startDate: result.data.startDate,
        },
        pendingMealPreview: null,
      }));

      // 캐시 갱신: 세션 목록만 (히스토리용) - 완료 UI 유지를 위해 active 무효화 제거
      cacheSync.invalidateAll();
    } catch (error) {
      console.error('[applyMealPlan] Error:', error);
      setState((prev) => ({
        ...prev,
        isSending: false,
        error: '식단 적용 중 오류가 발생했습니다.',
      }));
    }
  };

  const requestMealRevision = (feedback: string) => {
    if (!sessionId || !state.pendingMealPreview) return;

    // 미리보기 상태 해제 후 피드백 메시지 전송
    setState((prev) => ({
      ...prev,
      pendingMealPreview: null,
    }));

    // 수정 요청 메시지 전송 (AI가 피드백 반영 후 다시 generate_meal_plan_preview 호출)
    sendMessageCore(feedback, {});
  };

  // ---------------------------------------------------------------------------
  // 프로필 확인 / 수정 요청
  // ---------------------------------------------------------------------------

  const confirmProfile = async () => {
    if (!sessionId || !state.pendingProfileConfirmation) return;

    // 확인된 필드 라벨 추출 (상태 클리어 전에)
    const confirmedLabels = state.pendingProfileConfirmation.fields
      .map((f) => f.label)
      .join(', ');

    // 로컬 상태 즉시 초기화 (UI 반응성)
    setState((prev) => ({
      ...prev,
      pendingProfileConfirmation: null,
    }));

    // DB 메타데이터 즉시 클리어 (페이지 이탈 후 복귀 시 복원 방지)
    // API 메시지 처리보다 먼저 실행하여 race condition 방지
    try {
      await fetch(`/api/conversations/${sessionId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearProfileConfirmation: true }),
      });
    } catch (e) {
      console.error('[confirmProfile] Failed to clear metadata:', e);
    }

    // 컨텍스트 포함 확인 메시지 전송 (AI가 확인된 필드를 인식)
    const confirmationMessage = `[프로필 확인 완료] ${confirmedLabels} 정보를 확인했습니다. 모두 정확합니다. 다음 단계로 진행해주세요.`;
    sendMessageCore(confirmationMessage, {});
  };

  const requestProfileEdit = async () => {
    if (!sessionId || !state.pendingProfileConfirmation) return;

    // 수정 가능한 필드 라벨 추출 (상태 클리어 전에)
    const fieldLabels = state.pendingProfileConfirmation.fields
      .map((f) => f.label)
      .join(', ');

    // 로컬 상태 즉시 초기화 (UI 반응성)
    setState((prev) => ({
      ...prev,
      pendingProfileConfirmation: null,
    }));

    // DB 메타데이터 즉시 클리어 (페이지 이탈 후 복귀 시 복원 방지)
    try {
      await fetch(`/api/conversations/${sessionId}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clearProfileConfirmation: true }),
      });
    } catch (e) {
      console.error('[requestProfileEdit] Failed to clear metadata:', e);
    }

    // 컨텍스트 포함 수정 요청 메시지 전송
    const editMessage = `[프로필 수정 요청] ${fieldLabels} 중에서 수정하고 싶은 정보가 있어요.`;
    sendMessageCore(editMessage, {});
  };

  // ---------------------------------------------------------------------------
  // 대화 시작 (사용자가 시작 버튼 클릭 시)
  // ---------------------------------------------------------------------------

  const startConversation = () => {
    if (!sessionId || !state.pendingStart) return;

    setState((prev) => ({
      ...prev,
      pendingStart: false,
    }));

    sendMessageCore(AI_SYSTEM_MESSAGE.START, { skipGuards: true });
  };

  // ---------------------------------------------------------------------------
  // 스트리밍 취소 & 에러 초기화
  // ---------------------------------------------------------------------------

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setState((prev) => ({
      ...prev,
      streamingContent: '',
      isSending: false,
      pendingInput: null,
    }));
  };

  const clearError = () => {
    setState((prev) => ({ ...prev, error: null }));
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
    applyRoutine,
    requestRevision,
    applyMealPlan,
    requestMealRevision,
    confirmProfile,
    requestProfileEdit,
    startConversation,
    cancelStream,
    clearError,
  };
}
