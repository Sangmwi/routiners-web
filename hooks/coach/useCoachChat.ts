'use client';

import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { queryKeys } from '@/lib/constants/queryKeys';
import { aiChatApi, conversationApi } from '@/lib/api/conversation';
import { coachContextApi } from '@/lib/api/coach';
import { shouldTriggerSummarization } from '@/lib/types/coach';
import type { ChatMessage, ProfileConfirmationRequest } from '@/lib/types/chat';
import type { AIToolStatus, AIToolName, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import type { RoutineAppliedEvent, RoutineProgressEvent } from '@/lib/api/conversation';
import type {
  ActionChip,
  CoachConversation,
  CoachMessagePage,
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
import { extractSessionMetadata } from '@/hooks/aiChat/helpers/sessionMetadata';

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
 * 코치 AI 채팅의 비즈니스 로직을 관리합니다.
 * - 스트리밍 메시지 처리
 * - 액션 칩 핸들러
 * - 컨텍스트 요약 트리거
 * - 무한스크롤 지원
 */
export function useCoachChat(initialConversationId?: string): UseCoachChatReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 대화 ID 상태
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );

  // 스트리밍 상태
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 도구/입력 상태
  const [activeTools, setActiveTools] = useState<AIToolStatus[]>([]);
  const [pendingInput, setPendingInput] = useState<InputRequest | null>(null);
  const [pendingRoutinePreview, setPendingRoutinePreview] = useState<RoutinePreviewData | null>(null);
  const [appliedRoutine, setAppliedRoutine] = useState<RoutineAppliedEvent | null>(null);
  const [routineProgress, setRoutineProgress] = useState<RoutineProgressEvent | null>(null);
  const [pendingProfileConfirmation, setPendingProfileConfirmation] =
    useState<ProfileConfirmationRequest | null>(null);

  // 낙관적 사용자 메시지 (전송 즉시 표시, refetch 후 제거)
  const [pendingUserMessage, setPendingUserMessage] = useState<ChatMessage | null>(null);

  // 요약 상태
  const [summarizationState, setSummarizationState] = useState<SummarizationState>({
    isSummarizing: false,
  });

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingProfileRef = useRef<ProfileConfirmationRequest | null>(null);

  // Queries
  const { data: conversation } = useCoachConversation(conversationId ?? undefined);
  const messagesQuery = useInfiniteCoachMessages(conversationId);
  const messages = messagesQuery.data?.pages.flatMap((p) => p.messages) ?? [];

  // Mutations
  const createConversation = useCreateCoachConversation();
  const setActivePurpose = useSetActivePurpose();
  const triggerSummarization = useTriggerSummarization();

  // 활성 목적 추출
  const activePurpose = conversation?.metadata?.activePurpose;

  // ---------------------------------------------------------------------------
  // 메시지 전송
  // ---------------------------------------------------------------------------

  const handleSend = async (content: string) => {
    if (!content.trim() || isStreaming) return;

    // 대화가 없으면 생성
    let currentId = conversationId;
    if (!currentId) {
      try {
        const newConversation = await createConversation.mutateAsync(undefined);
        currentId = newConversation.id;
        setConversationId(currentId);
        // URL 업데이트
        window.history.pushState({}, '', `/routine/coach?id=${currentId}`);
      } catch (e) {
        setError('대화 생성에 실패했습니다.');
        return;
      }
    }

    // 이전 스트림 취소
    abortControllerRef.current?.abort();

    // 낙관적 사용자 메시지 즉시 표시
    setPendingUserMessage({
      id: `pending-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      createdAt: new Date().toISOString(),
    });

    // 스트리밍 시작
    setStreamingContent('');
    setIsStreaming(true);
    setError(null);
    setActiveTools([]);

    abortControllerRef.current = aiChatApi.sendMessage(currentId, content, {
      onMessage: (chunk) => {
        setStreamingContent((prev) => prev + chunk);
      },

      onComplete: async (fullMessage) => {
        setStreamingContent('');

        // 메시지 캐시 무효화 완료 대기 (welcome screen flash 방지)
        await queryClient.invalidateQueries({
          queryKey: queryKeys.coach.messages(currentId!),
        });

        // 실제 메시지 로드 완료 → 낙관적 메시지 제거
        setPendingUserMessage(null);

        // 버퍼링된 프로필 확인 요청 적용 (messages 로드 후 → layout shift 방지)
        if (pendingProfileRef.current) {
          setPendingProfileConfirmation(pendingProfileRef.current);
          pendingProfileRef.current = null;
        }

        setIsStreaming(false);

        // 요약 체크 (non-blocking)
        checkAndSummarize(currentId!);
      },

      onError: (err) => {
        setStreamingContent('');
        setPendingUserMessage(null);
        setIsStreaming(false);
        setError(err.message);
      },

      onToolStart: (event) => {
        setActiveTools((prev) => [
          ...prev,
          { toolCallId: event.toolCallId, name: event.name as AIToolName, status: 'running' },
        ]);
      },

      onToolDone: (event) => {
        setActiveTools((prev) =>
          prev.map((t) =>
            t.toolCallId === event.toolCallId
              ? { ...t, status: event.success ? 'completed' : 'error' }
              : t
          )
        );
      },

      onInputRequest: (request) => {
        setPendingInput(request);
      },

      onRoutinePreview: (preview) => {
        setPendingRoutinePreview(preview);
        setRoutineProgress(null);
      },

      onRoutineApplied: (event) => {
        setAppliedRoutine(event);
        setPendingRoutinePreview(null);
      },

      onRoutineProgress: (event) => {
        setRoutineProgress(event);
      },

      onProfileConfirmation: (request) => {
        // 스트리밍 중에는 ref에 버퍼링 (onComplete에서 messages refetch 후 적용)
        // → 메시지보다 카드가 먼저 렌더되는 layout shift 방지
        pendingProfileRef.current = request;
      },
    });
  };

  // ---------------------------------------------------------------------------
  // 액션 칩 핸들러
  // ---------------------------------------------------------------------------

  const handleChipClick = async (chip: ActionChip) => {
    if (chip.triggersPurpose) {
      // 대화가 없으면 생성
      let currentId = conversationId;
      if (!currentId) {
        try {
          const newConversation = await createConversation.mutateAsync({
            activePurpose: {
              type: chip.triggersPurpose,
              stage: 'init',
              collectedData: {},
              startedAt: new Date().toISOString(),
            },
          });
          currentId = newConversation.id;
          setConversationId(currentId);
          window.history.pushState({}, '', `/routine/coach?id=${currentId}`);
        } catch (e) {
          setError('대화 생성에 실패했습니다.');
          return;
        }
      } else {
        // 기존 대화에 활성 목적 설정
        await setActivePurpose.mutateAsync({
          conversationId: currentId,
          data: {
            activePurpose: {
              type: chip.triggersPurpose,
              stage: 'init',
              collectedData: {},
              startedAt: new Date().toISOString(),
            },
          },
        });
      }

      // 프로세스 시작 메시지 전송
      await handleSend(`[${chip.label}] 시작`);
    } else if (chip.action) {
      // 라우팅 액션
      router.push(chip.action);
    }
  };

  // ---------------------------------------------------------------------------
  // 새 채팅 생성
  // ---------------------------------------------------------------------------

  const handleNewChat = async () => {
    try {
      const newConversation = await createConversation.mutateAsync(undefined);
      setConversationId(newConversation.id);

      // 상태 초기화
      setStreamingContent('');
      setIsStreaming(false);
      setError(null);
      setActiveTools([]);
      setPendingInput(null);
      setPendingUserMessage(null);
      setPendingRoutinePreview(null);
      setAppliedRoutine(null);
      setRoutineProgress(null);
      setPendingProfileConfirmation(null);
      pendingProfileRef.current = null;

      // URL 업데이트
      window.history.pushState({}, '', `/routine/coach?id=${newConversation.id}`);
    } catch (e) {
      setError('새 대화 생성에 실패했습니다.');
    }
  };

  // ---------------------------------------------------------------------------
  // 선택형 입력 제출
  // ---------------------------------------------------------------------------

  const submitInput = (value: string | string[]) => {
    const messageText = Array.isArray(value) ? value.join(', ') : value;
    setPendingInput(null);
    handleSend(messageText);
  };

  // ---------------------------------------------------------------------------
  // 스트리밍 취소
  // ---------------------------------------------------------------------------

  const cancelStream = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStreamingContent('');
    setPendingUserMessage(null);
    setIsStreaming(false);
  };

  // ---------------------------------------------------------------------------
  // 에러 클리어
  // ---------------------------------------------------------------------------

  const clearError = () => {
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // 프로필 확인/수정 핸들러
  // ---------------------------------------------------------------------------

  const confirmProfile = () => {
    if (!pendingProfileConfirmation) return;
    const labels = pendingProfileConfirmation.fields.map((f) => f.label).join(', ');
    setPendingProfileConfirmation(null);
    if (conversationId) {
      conversationApi.clearProfileConfirmation(conversationId).catch(console.error);
    }
    handleSend(
      `[프로필 확인 완료] ${labels} 정보를 확인했습니다. 모두 정확합니다. 다음 단계로 진행해주세요.`
    );
  };

  const requestProfileEdit = () => {
    if (!pendingProfileConfirmation) return;
    const labels = pendingProfileConfirmation.fields.map((f) => f.label).join(', ');
    setPendingProfileConfirmation(null);
    if (conversationId) {
      conversationApi.clearProfileConfirmation(conversationId).catch(console.error);
    }
    handleSend(`[프로필 수정 요청] ${labels} 중에서 수정하고 싶은 정보가 있어요.`);
  };

  // ---------------------------------------------------------------------------
  // 요약 체크 (non-blocking)
  // ---------------------------------------------------------------------------

  const checkAndSummarize = async (id: string) => {
    try {
      // 요약 상태 조회
      const status = await coachContextApi.getSummarizationStatus(id);

      if (shouldTriggerSummarization(status.messageCount, status.summarizedUntil)) {
        setSummarizationState({
          isSummarizing: true,
          message: '이전 대화를 정리하고 있어요...',
        });

        try {
          await triggerSummarization.mutateAsync(id);
          setSummarizationState({
            isSummarizing: true,
            message: '정리 완료!',
          });
          await new Promise((r) => setTimeout(r, 1500));
        } finally {
          setSummarizationState({ isSummarizing: false });
        }
      }
    } catch (e) {
      // 요약 실패는 무시 (사용자 경험에 영향 없음)
      console.error('[useCoachChat] Summarization check failed:', e);
    }
  };

  // ---------------------------------------------------------------------------
  // 메타데이터에서 프로필 확인 복원
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!conversation?.metadata) return;
    const extracted = extractSessionMetadata(conversation.metadata);
    if (extracted.pendingProfileConfirmation) {
      setPendingProfileConfirmation(extracted.pendingProfileConfirmation);
    }
  }, [conversation?.metadata]);

  // ---------------------------------------------------------------------------
  // 초기 대화 ID 동기화
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (initialConversationId && initialConversationId !== conversationId) {
      setConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  // ---------------------------------------------------------------------------
  // Cleanup
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  // 서버 메시지 + 낙관적 사용자 메시지 병합
  const allMessages = pendingUserMessage
    ? [...messages, pendingUserMessage]
    : messages;

  return {
    conversationId,
    conversation: conversation ?? null,
    messages: allMessages,
    activePurpose,
    streamingContent,
    isStreaming,
    error,
    activeTools,
    pendingInput,
    pendingRoutinePreview,
    appliedRoutine,
    routineProgress,
    pendingProfileConfirmation,
    summarizationState,
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
