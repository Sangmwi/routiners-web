'use client';

import { useState, useReducer, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { coachContextApi } from '@/lib/api/coach';
import { shouldTriggerSummarization } from '@/lib/types/coach';
import type { ChatMessage, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type {
  ActionChip,
  CoachConversation,
  SummarizationState,
  ActivePurpose,
} from '@/lib/types/coach';
import {
  useInfiniteCoachMessages,
  useCoachConversation,
} from './queries';
import {
  useCreateCoachConversation,
  useSetActivePurpose,
  useTriggerSummarization,
} from './mutations';
import { coachReducer, INITIAL_STATE } from './helpers/coachReducer';
import { extractSessionMetadata } from './helpers/sessionMetadata';
import { useCoachMessageSender } from './useCoachMessageSender';

import { useCoachProfileConfirmation } from './useCoachProfileConfirmation';

// ============================================================================
// Types
// ============================================================================

export interface UseCoachChatReturn {
  /** 현재 대화 ID */
  conversationId: string | null;
  /** 현재 대화 정보 */
  conversation: CoachConversation | null;
  /** 메시지 목록 */
  messages: ChatMessage[];
  /** 활성 목적 */
  activePurpose: ActivePurpose | null | undefined;
  /** 스트리밍 콘텐츠 */
  streamingContent: string;
  /** 스트리밍 중 여부 */
  isStreaming: boolean;
  /** 에러 메시지 */
  error: string | null;
  /** 활성 도구 상태 */
  activeTools: AIToolStatus[];
  /** 대기 중인 입력 요청 */
  pendingInput: InputRequest | null;
  /** 루틴 미리보기 */
  pendingRoutinePreview: RoutinePreviewData | null;
  /** 적용된 루틴 */
  appliedRoutine: RoutineAppliedEvent | null;
  /** 루틴 진행률 */
  routineProgress: RoutineProgressEvent | null;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation: ProfileConfirmationRequest | null;
  /** 요약 상태 */
  summarizationState: SummarizationState;
  /** 무한스크롤 - 다음 페이지 존재 */
  hasNextPage: boolean;
  /** 무한스크롤 - 다음 페이지 로딩 중 */
  isFetchingNextPage: boolean;
  /** 메시지 초기 로딩 중 여부 */
  isMessagesLoading: boolean;

  // Actions
  /** 메시지 전송 */
  handleSend: (content: string) => Promise<void>;
  /** 액션 칩 클릭 */
  handleChipClick: (chip: ActionChip) => Promise<void>;
  /** 새 채팅 생성 */
  handleNewChat: () => Promise<void>;
  /** 다음 페이지 로드 */
  fetchNextPage: () => void;
  /** 선택형 입력 제출 */
  submitInput: (value: string | string[]) => void;
  /** 스트리밍 취소 */
  cancelStream: () => void;
  /** 에러 클리어 */
  clearError: () => void;
  /** 프로필 데이터 확인 */
  confirmProfile: () => void;
  /** 프로필 수정 요청 */
  requestProfileEdit: () => void;
}

// ============================================================================
// Hook
// ============================================================================

/**
 * 코치 채팅 훅
 *
 * useReducer로 transient UI 상태를 관리하고,
 * 서브훅으로 관심사를 분리합니다.
 * 메시지는 React Query(무한스크롤)가 관리합니다.
 */
export function useCoachChat(initialConversationId?: string): UseCoachChatReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ── 대화 ID ──
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  // ── 리듀서 ──
  const [state, dispatch] = useReducer(coachReducer, INITIAL_STATE);
  const profileBufferRef = useRef<ProfileConfirmationRequest | null>(null);

  // ── Queries ──
  const { data: conversation } = useCoachConversation(conversationId ?? undefined);
  const messagesQuery = useInfiniteCoachMessages(conversationId);
  const messages = messagesQuery.data?.pages.flatMap((p) => p.messages) ?? [];
  const activePurpose = conversation?.metadata?.activePurpose;

  // ── Mutations ──
  const createConversation = useCreateCoachConversation();
  const setActivePurpose = useSetActivePurpose();
  const triggerSummarization = useTriggerSummarization();

  // ── 요약 체크 (non-blocking) ──
  const checkAndSummarize = async (id: string) => {
    try {
      const status = await coachContextApi.getSummarizationStatus(id);
      if (shouldTriggerSummarization(status.messageCount, status.summarizedUntil)) {
        dispatch({
          type: 'SET_SUMMARIZATION',
          state: { isSummarizing: true, message: '이전 대화를 정리하고 있어요...' },
        });
        try {
          await triggerSummarization.mutateAsync(id);
          dispatch({
            type: 'SET_SUMMARIZATION',
            state: { isSummarizing: true, message: '정리 완료!' },
          });
          await new Promise((r) => setTimeout(r, 1500));
        } finally {
          dispatch({ type: 'SET_SUMMARIZATION', state: { isSummarizing: false } });
        }
      }
    } catch (e) {
      console.error('[useCoachChat] Summarization check failed:', e);
    }
  };

  // ── 서브훅 ──
  const { sendMessage, cancelStream } = useCoachMessageSender({
    conversationId,
    state,
    dispatch,
    queryClient,
    profileBufferRef,
    onStreamComplete: checkAndSummarize,
  });

  const { confirmProfile, requestProfileEdit } = useCoachProfileConfirmation({
    conversationId,
    state,
    dispatch,
    sendMessage,
  });

  // ── 대화 확보 (없으면 생성) → conversationId 반환 ──
  const ensureConversation = async (
    activePurposeData?: ActivePurpose
  ): Promise<string | null> => {
    if (conversationId) return conversationId;
    try {
      const newConversation = await createConversation.mutateAsync(
        activePurposeData ? { activePurpose: activePurposeData } : undefined
      );
      const newId = newConversation.id;
      setConversationId(newId);
      window.history.pushState({}, '', `/routine/coach?id=${newId}`);
      return newId;
    } catch {
      dispatch({ type: 'SET_ERROR', error: '대화 생성에 실패했습니다.' });
      return null;
    }
  };

  // ── 메시지 전송 ──
  const handleSend = async (content: string) => {
    if (!content.trim() || state.isStreaming) return;
    const currentId = await ensureConversation();
    if (!currentId) return;
    sendMessage(currentId, content);
  };

  // ── 액션 칩 핸들러 ──
  const handleChipClick = async (chip: ActionChip) => {
    if (chip.triggersPurpose) {
      const purposeData: ActivePurpose = {
        type: chip.triggersPurpose,
        stage: 'init',
        collectedData: {},
        startedAt: new Date().toISOString(),
      };

      let currentId = conversationId;
      if (!currentId) {
        currentId = await ensureConversation(purposeData);
        if (!currentId) return;
      } else {
        await setActivePurpose.mutateAsync({
          conversationId: currentId,
          data: { activePurpose: purposeData },
        });
      }

      // sendMessage 직접 호출 (setState 반영 전 handleSend → ensureConversation 중복 호출 방지)
      sendMessage(currentId, `[${chip.label}] 시작`);
    } else if (chip.action) {
      router.push(chip.action);
    }
  };

  // ── 새 채팅 생성 ──
  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync(undefined);
      setConversationId(newConversation.id);
      dispatch({ type: 'RESET_ALL' });
      profileBufferRef.current = null;
      window.history.pushState({}, '', `/routine/coach?id=${newConversation.id}`);
    } catch {
      dispatch({ type: 'SET_ERROR', error: '새 대화 생성에 실패했습니다.' });
    }
  };

  // ── 선택형 입력 제출 ──
  const submitInput = (value: string | string[]) => {
    if (!conversationId) return;
    const messageText = Array.isArray(value) ? value.join(', ') : value;
    dispatch({ type: 'CLEAR_PENDING_INPUT' });
    // sendMessage 직접 호출 (handleSend의 isStreaming 가드 우회 — 인풋 응답은 스트리밍 중에도 전송 가능해야 함)
    sendMessage(conversationId, messageText);
  };

  // ── 에러 클리어 ──
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // ── 메타데이터에서 세션 상태 복원 (페이지 재진입 시) ──
  useEffect(() => {
    if (!conversation?.metadata) return;
    const extracted = extractSessionMetadata(conversation.metadata);

    // 복원할 데이터가 하나라도 있으면 원자적으로 전체 복원
    const hasData =
      extracted.pendingRoutinePreview ||
      extracted.appliedRoutine ||
      extracted.pendingProfileConfirmation ||
      extracted.pendingInput;

    if (hasData) {
      dispatch({
        type: 'RESTORE_SESSION_METADATA',
        pendingRoutinePreview: extracted.pendingRoutinePreview,
        appliedRoutine: extracted.appliedRoutine,
        pendingProfileConfirmation: extracted.pendingProfileConfirmation,
        pendingInput: extracted.pendingInput,
      });
    }
  }, [conversationId, conversation?.metadata]);

  // ── 초기 대화 ID 동기화 ──
  useEffect(() => {
    const targetId = initialConversationId ?? null;
    if (targetId !== conversationId) {
      setConversationId(targetId);
      // ID가 null이면 전체 상태 리셋 (삭제 후 복귀 등)
      if (!targetId) {
        dispatch({ type: 'RESET_ALL' });
        profileBufferRef.current = null;
      }
    }
  }, [initialConversationId]);

  // ── 메시지 병합 (서버 + 낙관적, 중복 방지) ──
  const allMessages = (() => {
    if (!state.pendingUserMessage) return messages;
    // 서버에 이미 동일 메시지가 존재하면 pending 스킵 (invalidation↔dispatch 사이 중복 방지)
    const isDuplicate = messages.some(
      (m) => m.role === 'user' && m.content === state.pendingUserMessage!.content,
    );
    return isDuplicate ? messages : [...messages, state.pendingUserMessage];
  })();

  return {
    conversationId,
    conversation: conversation ?? null,
    messages: allMessages,
    activePurpose,
    streamingContent: state.streamingContent,
    isStreaming: state.isStreaming,
    error: state.error,
    activeTools: state.activeTools,
    pendingInput: state.pendingInput,
    pendingRoutinePreview: state.pendingRoutinePreview,
    appliedRoutine: state.appliedRoutine,
    routineProgress: state.routineProgress,
    pendingProfileConfirmation: state.pendingProfileConfirmation,
    summarizationState: state.summarizationState,
    hasNextPage: messagesQuery.hasNextPage ?? false,
    isFetchingNextPage: messagesQuery.isFetchingNextPage,
    isMessagesLoading: messagesQuery.isLoading,

    handleSend,
    handleChipClick,
    handleNewChat,
    fetchNextPage: messagesQuery.fetchNextPage,
    submitInput,
    cancelStream,
    clearError,
    confirmProfile,
    requestProfileEdit,
  };
}
