'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import {
  ChatMessageList,
  ChatInput,
  ChatCompletedBanner,
  ChatHistoryDropdown,
} from '@/components/routine/chat';
import {
  useActiveAISession,
  useCreateAISession,
  useAISessionWithMessages,
  useAIChat,
} from '@/hooks/aiChat';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Loader2, CheckCircle, Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { conversationApi } from '@/lib/api/conversation';
import { routineEventApi } from '@/lib/api/routineEvent';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { SessionPurpose, AISessionCompat } from '@/lib/types/chat';

/**
 * AI 트레이너 채팅 페이지
 *
 * URL 파라미터:
 * - purpose: 'workout' | 'meal' - 모달에서 선택한 목적 (자동으로 해당 세션 시작/재개)
 * - session: string - 히스토리에서 선택한 세션 ID
 */
export default function AIChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [selectedPurpose, setSelectedPurpose] = useState<SessionPurpose | null>(null);
  // ⚠️ useRef 사용: useState는 비동기라 StrictMode 이중 호출 시 중복 세션 생성됨
  const purposeHandledRef = useRef(false);
  // 사용자가 의도한 세션 목적 (URL 파라미터 또는 버튼 클릭으로 설정)
  const [viewPurpose, setViewPurpose] = useState<SessionPurpose | null>(null);
  const confirmDialog = useConfirmDialog();
  // 루틴/식단 적용 완료 상태 추적 (적용 후 리다이렉트 방지)
  const hasAppliedRef = useRef(false);
  // ⚠️ 방금 생성된 세션 추적 - React Query 캐시 동기화 문제 우회
  // createSession.data가 업데이트되어도 re-render가 트리거되지 않는 문제 해결
  const [justCreatedSession, setJustCreatedSession] = useState<AISessionCompat | null>(null);

  // URL에서 파라미터 확인
  const sessionIdParam = searchParams.get('session');
  const purposeParam = searchParams.get('purpose') as SessionPurpose | null;

  // 활성 세션 조회 (workout과 meal 둘 다 확인)
  const {
    data: workoutSession,
    isLoading: isLoadingWorkout,
    refetch: refetchWorkout,
  } = useActiveAISession('workout');

  const {
    data: mealSession,
    isLoading: isLoadingMeal,
    refetch: refetchMeal,
  } = useActiveAISession('meal');

  // 페이지 진입 시 최신 세션 데이터 fetch
  // - 홈에서 돌아올 때 캐시된 오래된 데이터 대신 최신 데이터 로드
  // - ⚠️ purposeParam 있으면 스킵: 새 세션 생성 시 refetch가 mutation 결과를 덮어쓸 수 있음
  useEffect(() => {
    if (purposeParam) return; // 새 세션 생성 흐름이므로 refetch 불필요
    refetchWorkout();
    refetchMeal();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- 마운트 시 1회만 실행
  }, [purposeParam]);

  // URL 파라미터로 지정된 히스토리 세션 조회
  const {
    data: historySession,
    isLoading: isLoadingHistory,
  } = useAISessionWithMessages(sessionIdParam ?? undefined, {
    enabled: !!sessionIdParam,
  });

  // 세션 생성 (currentSession 계산 전에 선언 - createSession.data fallback용)
  const createSession = useCreateAISession();

  // 현재 표시할 세션 결정 (URL 파라미터 우선, viewPurpose 반영)
  // purposeParam이 있으면 그것을 우선 사용 (URL 정리 전), 없으면 viewPurpose 사용
  const effectivePurpose = purposeParam || viewPurpose;
  // purpose 명시 시 해당 세션 사용, 없으면 상태 기반 선택 (active 우선, 둘 다 없으면 아무거나)
  const activeSessionFromQuery = effectivePurpose === 'meal' ? mealSession :
                                  effectivePurpose === 'workout' ? workoutSession :
                                  // purpose 미지정 시: active 세션 우선, 없으면 completed 세션
                                  (workoutSession?.status === 'active' ? workoutSession :
                                   mealSession?.status === 'active' ? mealSession :
                                   workoutSession || mealSession);
  // createSession.data fallback: 캐시 동기화 전에도 생성된 세션 즉시 표시
  // justCreatedSession: 로컬 state로 확실하게 re-render 트리거
  const currentSession = sessionIdParam
    ? historySession
    : activeSessionFromQuery || justCreatedSession || createSession.data;
  // 로딩 상태: 현재 purpose에 해당하는 쿼리만 체크 (다른 purpose 로딩에 영향 받지 않도록)
  const isLoadingSession = sessionIdParam
    ? isLoadingHistory
    : effectivePurpose === 'meal' ? isLoadingMeal
    : effectivePurpose === 'workout' ? isLoadingWorkout
    : isLoadingWorkout || isLoadingMeal;
  const sessionError = null; // 에러는 개별적으로 처리

  // 히스토리 모드인지 확인 (URL 파라미터가 있고, 활성 세션이 아닌 경우)
  const isHistoryMode = !!(
    sessionIdParam &&
    historySession &&
    historySession.status !== 'active'
  );

  // purpose 파라미터 처리 (모달에서 선택 시)
  useEffect(() => {
    // 이미 처리했거나, 로딩 중이거나, purpose가 없으면 스킵
    // ⚠️ ref는 동기적으로 업데이트되어 StrictMode 이중 호출 방지
    if (purposeHandledRef.current || isLoadingWorkout || isLoadingMeal || !purposeParam || createSession.isPending) {
      return;
    }

    // session 파라미터가 있으면 히스토리 모드이므로 purpose 무시
    if (sessionIdParam) {
      purposeHandledRef.current = true;
      return;
    }

    // 유효한 purpose인지 확인
    if (purposeParam !== 'workout' && purposeParam !== 'meal') {
      purposeHandledRef.current = true;
      return;
    }

    // 해당 purpose에 활성 세션이 있는지 확인
    const existingSession = purposeParam === 'workout' ? workoutSession : mealSession;

    if (existingSession?.status === 'active') {
      // 활성 세션이 있으면 해당 purpose를 기억
      // ⚠️ URL 정리하지 않음 - 새로고침 시 purpose 유지를 위해
      setViewPurpose(purposeParam);
      purposeHandledRef.current = true;
    } else {
      // 활성 세션이 없으면 새 세션 생성
      purposeHandledRef.current = true;
      setSelectedPurpose(purposeParam);
      setViewPurpose(purposeParam); // URL 변경 후에도 올바른 세션이 표시되도록
      createSession.mutate(
        { purpose: purposeParam },
        {
          // ⚠️ 로컬 state로 세션 저장 - React Query 캐시 동기화 문제 우회
          // createSession.data 업데이트가 re-render를 트리거하지 않는 문제 해결
          onSuccess: (session) => {
            setJustCreatedSession(session);
          },
        }
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- purposeHandledRef는 ref라 dependency 불필요
  }, [
    purposeParam,
    sessionIdParam,
    isLoadingWorkout,
    isLoadingMeal,
    workoutSession,
    mealSession,
    createSession,
  ]);

  // viewPurpose 자동 동기화
  // - purposeParam이 없고 viewPurpose도 없을 때, 활성 세션의 purpose로 자동 설정
  // - 세션 완료 시 캐시 업데이트와 UI 상태 동기화 보장
  useEffect(() => {
    if (!viewPurpose && !purposeParam && !isLoadingWorkout && !isLoadingMeal) {
      // 활성 세션의 purpose 감지
      const activeSession = workoutSession?.status === 'active' ? workoutSession :
                            mealSession?.status === 'active' ? mealSession : null;
      if (activeSession) {
        setViewPurpose(activeSession.purpose);
      }
    }
  }, [workoutSession, mealSession, viewPurpose, purposeParam, isLoadingWorkout, isLoadingMeal]);

  // 활성 세션이 없고 히스토리도 없는 경우 - /routine으로 리다이렉트
  // (purpose 선택은 AISelectionModal에서 처리)
  // ⚠️ 세션 생성 중에는 리다이렉트하지 않음 (race condition 방지)
  // ⚠️ 루틴/식단 적용 직후에는 리다이렉트하지 않음 (완료 UI 표시)
  useEffect(() => {
    const isCreating = createSession.isPending;
    if (!isLoadingSession && !currentSession && !sessionIdParam && !purposeParam && !isCreating && !hasAppliedRef.current) {
      router.replace('/routine');
    }
  }, [isLoadingSession, currentSession, sessionIdParam, purposeParam, createSession.isPending, router]);

  // 채팅 훅 (세션 객체 전체를 전달하여 캐시 동기화 문제 해결)
  const {
    messages,
    sendMessage,
    submitInput,
    isStreaming,
    streamingContent,
    activeTools,
    pendingInput,
    pendingRoutinePreview,
    appliedRoutine,
    routineProgress,
    applyRoutine,
    requestRevision,
    pendingMealPreview,
    appliedMealPlan,
    mealProgress,
    applyMealPlan,
    requestMealRevision,
    pendingProfileConfirmation,
    confirmProfile,
    requestProfileEdit,
    pendingStart,
    startConversation,
    error: chatError,
  } = useAIChat(currentSession);

  // 루틴/식단 적용 성공 시 ref 설정 (리다이렉트 방지)
  useEffect(() => {
    if (appliedRoutine || appliedMealPlan) {
      hasAppliedRef.current = true;
    }
  }, [appliedRoutine, appliedMealPlan]);

  // 대화 상태 확인
  const isCompleted = currentSession?.status === 'completed';
  const isActive = currentSession?.status === 'active';

  // 새 대화 시작 실행 (purpose 파라미터 받음)
  const executeStartNewSession = async (purpose: SessionPurpose) => {
    // 기존 활성 세션이 있으면 정리
    if (activeSessionFromQuery?.status === 'active') {
      // 기존 루틴이 저장되어 있으면 삭제
      if (activeSessionFromQuery.resultApplied) {
        try {
          await routineEventApi.deleteEventsBySession(activeSessionFromQuery.id);
        } catch (err) {
          console.error('Failed to delete existing routine:', err);
        }
      }

      // 기존 대화 삭제
      try {
        await conversationApi.deleteConversation(activeSessionFromQuery.id);
      } catch (err) {
        console.error('Failed to delete session:', err);
      }
    }

    // 히스토리 모드면 session 파라미터 제거하고 purpose 유지
    if (sessionIdParam) {
      router.replace(`/routine/chat?purpose=${purpose}`);
    }

    try {
      const newSession = await createSession.mutateAsync({ purpose });
      setJustCreatedSession(newSession);
      setSelectedPurpose(null); // 선택 초기화
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  // purpose 선택 후 세션 시작 또는 기존 세션으로 이동
  const handleSelectPurpose = (purpose: SessionPurpose) => {
    // 해당 purpose에 활성 세션이 있으면 그 세션으로 이동
    const existingSession = purpose === 'workout' ? workoutSession : mealSession;
    if (existingSession?.status === 'active') {
      // viewPurpose를 설정하여 올바른 세션이 표시되도록 함
      setViewPurpose(purpose);
      // 캐시 무효화로 화면 갱신
      queryClient.invalidateQueries({
        queryKey: queryKeys.aiSession.active(purpose),
      });
      return;
    }

    // 활성 세션이 없으면 새로 생성
    setSelectedPurpose(purpose);
    setViewPurpose(purpose);
    executeStartNewSession(purpose);
  };

  // 히스토리 세션 선택 핸들러
  const handleSelectHistorySession = (sessionId: string) => {
    router.push(`/routine/chat?session=${sessionId}`);
  };

  // 새 세션 생성 (기존 활성 세션이 있으면 확인 후 포기하고 purpose 선택 화면으로)
  const handleStartNewSession = () => {
    // 히스토리 모드에서는 바로 purpose 선택 화면으로
    if (isHistoryMode) {
      router.replace('/routine/chat');
      return;
    }

    // 활성 대화 중이면 확인 모달 표시
    if (isActive && messages.length > 0) {
      const currentPurpose = activeSessionFromQuery?.purpose || 'workout';

      confirmDialog({
        title: '새 대화 시작',
        message: '현재 대화를 종료하고 새 대화를 시작할까요?',
        confirmText: '시작하기',
        cancelText: '취소',
        onConfirm: async () => {
          // 기존 세션 정리
          if (activeSessionFromQuery) {
            if (activeSessionFromQuery.resultApplied) {
              try {
                await routineEventApi.deleteEventsBySession(activeSessionFromQuery.id);
              } catch (err) {
                console.error('Failed to delete existing routine:', err);
              }
            }
            try {
              await conversationApi.deleteConversation(activeSessionFromQuery.id);
            } catch (err) {
              console.error('Failed to delete session:', err);
            }
          }

          // 캐시를 null로 설정 (refetch 방지)
          queryClient.setQueryData(queryKeys.aiSession.active('workout'), null);
          queryClient.setQueryData(queryKeys.aiSession.active('meal'), null);

          // 같은 purpose로 새 세션 바로 생성 (/routine 리다이렉트 대신)
          try {
            setViewPurpose(currentPurpose);
            const newSession = await createSession.mutateAsync({ purpose: currentPurpose });
            setJustCreatedSession(newSession);
          } catch (err) {
            console.error('Failed to create new session:', err);
            // 실패 시 /routine으로 리다이렉트
            router.replace('/routine');
          }
        },
      });
      return;
    }
  };

  // 메시지 전송
  const handleSendMessage = (message: string) => {
    if (currentSession?.id && isActive && !isHistoryMode) {
      sendMessage(message);
    }
  };


  // 캘린더로 이동
  const handleNavigateToCalendar = () => {
    router.push('/routine');
  };

  // 완료된 대화 삭제 (확인 후 삭제)
  const handleDeleteChat = () => {
    if (!currentSession?.id) return;

    confirmDialog({
      title: '대화 삭제',
      message: '이 대화를 삭제하시겠습니까? 삭제된 대화는 히스토리에서 보이지 않습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await conversationApi.deleteConversation(currentSession.id);
          // 캐시 무효화 후 루틴 홈으로 이동
          queryClient.invalidateQueries({
            queryKey: queryKeys.aiSession.all,
          });
          router.replace('/routine');
        } catch (err) {
          console.error('Failed to delete chat:', err);
        }
      },
    });
  };

  // 로딩 상태 (세션 로딩 중 또는 세션 생성 중)
  // ⚠️ Race Condition 방지: 세션이 이미 있으면 쿼리 로딩과 무관하게 UI 표시
  // justCreatedSession이 설정되어도 useActiveAISession 쿼리가 아직 로딩 중일 수 있음
  const isCreatingSession = createSession.isPending;
  const hasSession = currentSession || justCreatedSession;

  if (!hasSession && (isLoadingSession || isCreatingSession)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 세션 에러
  if (sessionError) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="AI 트레이너" />
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground text-center">
            세션을 불러오는데 실패했습니다.
          </p>
          <Button onClick={() => router.refresh()}>다시 시도</Button>
        </div>
      </div>
    );
  }

  // 활성 세션이 없고 히스토리도 없는 경우 - /routine으로 리다이렉트
  // (purpose 선택은 AISelectionModal에서 처리)
  // 참고: 리다이렉트 useEffect는 상단 hook 영역에 위치 (React Hook 순서 규칙)
  if (!currentSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 헤더 타이틀 (purpose에 따라)
  const headerTitle = currentSession?.purpose === 'meal' ? 'AI 영양사' : 'AI 트레이너';

  // 헤더 우측 액션 버튼 (대화 목록 드롭다운 + 컨텍스트별 버튼)
  // 진행중: [대화목록] [새 대화]
  // 완료/히스토리: [대화목록] [삭제]
  const headerAction = (
    <div className="flex items-center gap-1">
      <ChatHistoryDropdown
        currentSessionId={currentSession?.id}
        onSelectSession={handleSelectHistorySession}
      />
      {isActive && !isHistoryMode && !pendingStart ? (
        // 활성 세션 (대화 시작 후): 새 대화 버튼
        <button
          onClick={handleStartNewSession}
          disabled={createSession.isPending || isStreaming}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary disabled:opacity-50"
          aria-label="새 대화 시작"
        >
          {createSession.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      ) : (isCompleted || isHistoryMode) ? (
        // 완료 상태 또는 히스토리 모드: 삭제 버튼만
        <button
          onClick={handleDeleteChat}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-destructive"
          aria-label="대화 삭제"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      ) : null}
    </div>
  );

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={headerTitle}
        onBack={() => router.push('/routine')}
        action={headerAction}
      />

      {/* 완료 상태 배너 */}
      {isCompleted && (
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${
          currentSession?.purpose === 'meal'
            ? 'bg-lime-500/10 border-lime-500/20 text-lime-600'
            : 'bg-green-500/10 border-green-500/20 text-green-600'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {currentSession?.purpose === 'meal' ? '식단이 적용되었습니다' : '루틴이 적용되었습니다'}
          </span>
        </div>
      )}

      {/* 채팅 메시지 목록 */}
      <ChatMessageList
        messages={messages}
        isLoading={isStreaming && !streamingContent}
        streamingContent={streamingContent}
        activeTools={activeTools}
        pendingInput={pendingInput}
        onSubmitInput={submitInput}
        pendingRoutinePreview={pendingRoutinePreview}
        appliedRoutine={appliedRoutine}
        routineProgress={routineProgress}
        onApplyRoutine={applyRoutine}
        onRequestRevision={requestRevision}
        pendingMealPreview={pendingMealPreview}
        appliedMealPlan={appliedMealPlan}
        mealProgress={mealProgress}
        onApplyMealPlan={applyMealPlan}
        onRequestMealRevision={requestMealRevision}
        pendingProfileConfirmation={pendingProfileConfirmation}
        onConfirmProfile={confirmProfile}
        onRequestProfileEdit={requestProfileEdit}
        pendingStart={pendingStart}
        onStartConversation={startConversation}
        sessionPurpose={currentSession?.purpose}
      />

      {/* 에러 메시지 */}
      {chatError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {chatError}
        </div>
      )}

      {/* 활성 대화 - 입력 영역 (히스토리 모드 또는 시작 대기 상태에서는 숨김) */}
      {isActive && !isHistoryMode && !pendingStart && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder={
            currentSession?.purpose === 'meal'
              ? '식단 목표를 알려주세요...'
              : '운동 목표를 알려주세요...'
          }
        />
      )}

      {/* 완료된 대화 - 완료 배너 */}
      {isCompleted && (
        <ChatCompletedBanner
          purpose={currentSession?.purpose}
          appliedRoutine={appliedRoutine}
          appliedMealPlan={appliedMealPlan}
          onNavigateToCalendar={handleNavigateToCalendar}
        />
      )}
    </div>
  );
}
