'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import { ChatMessageList, ChatInput, ChatActionButtons } from '@/components/routine/chat';
import {
  useActiveAISession,
  useCreateAISession,
  useAIChat,
} from '@/hooks/aiChat';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Loader2, CheckCircle, XCircle, RotateCcw, Dumbbell, Utensils } from 'lucide-react';
import Button from '@/components/ui/Button';
import { conversationApi } from '@/lib/api/conversation';
import { routineEventApi } from '@/lib/api/routineEvent';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import type { SessionPurpose } from '@/lib/types/chat';

/**
 * AI 트레이너 채팅 페이지
 */
export default function AIChatPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<SessionPurpose | null>(null);
  const confirmDialog = useConfirmDialog();

  // 활성 세션 조회 (workout과 meal 둘 다 확인)
  const {
    data: workoutSession,
    isLoading: isLoadingWorkout,
  } = useActiveAISession('workout');

  const {
    data: mealSession,
    isLoading: isLoadingMeal,
  } = useActiveAISession('meal');

  // 활성 세션 (workout 또는 meal 중 하나)
  const activeSession = workoutSession || mealSession;
  const isLoadingSession = isLoadingWorkout || isLoadingMeal;
  const sessionError = null; // 에러는 개별적으로 처리

  // 세션 생성
  const createSession = useCreateAISession();

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
    error: chatError,
  } = useAIChat(activeSession);

  // 대화 상태 확인
  const isCompleted = activeSession?.status === 'completed';
  const isAbandoned = activeSession?.status === 'abandoned';
  const isActive = activeSession?.status === 'active';

  // 새 대화 시작 실행 (purpose 파라미터 받음)
  const executeStartNewSession = useCallback(async (purpose: SessionPurpose) => {
    // 기존 활성 세션이 있으면 정리
    if (isActive && activeSession) {
      // 기존 루틴이 저장되어 있으면 삭제
      if (activeSession.resultApplied) {
        try {
          await routineEventApi.deleteEventsBySession(activeSession.id);
        } catch (err) {
          console.error('Failed to delete existing routine:', err);
        }
      }

      // 기존 대화 포기 처리
      try {
        await conversationApi.abandonAIConversation(activeSession.id);
      } catch (err) {
        console.error('Failed to abandon session:', err);
      }
    }

    try {
      await createSession.mutateAsync({ purpose });
      setSelectedPurpose(null); // 선택 초기화
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  }, [createSession, isActive, activeSession]);

  // purpose 선택 후 세션 시작
  const handleSelectPurpose = useCallback((purpose: SessionPurpose) => {
    setSelectedPurpose(purpose);
    executeStartNewSession(purpose);
  }, [executeStartNewSession]);

  // 새 세션 생성 (기존 활성 세션이 있으면 확인 후 포기하고 purpose 선택 화면으로)
  const handleStartNewSession = useCallback(() => {
    // 활성 대화 중이면 확인 모달 표시
    if (isActive && messages.length > 0) {
      confirmDialog({
        title: '새 대화 시작',
        message: '현재 대화를 종료하고 새 대화를 시작할까요?',
        confirmText: '시작하기',
        cancelText: '취소',
        onConfirm: async () => {
          // 기존 세션 정리
          if (activeSession) {
            if (activeSession.resultApplied) {
              try {
                await routineEventApi.deleteEventsBySession(activeSession.id);
              } catch (err) {
                console.error('Failed to delete existing routine:', err);
              }
            }
            try {
              await conversationApi.abandonAIConversation(activeSession.id);
            } catch (err) {
              console.error('Failed to abandon session:', err);
            }
          }
          // 캐시 무효화하여 purpose 선택 화면으로 돌아가기
          queryClient.invalidateQueries({
            queryKey: queryKeys.aiSession.active('workout'),
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.aiSession.active('meal'),
          });
        },
      });
      return;
    }
  }, [isActive, messages.length, confirmDialog, activeSession, queryClient]);

  // 메시지 전송
  const handleSendMessage = useCallback(
    (message: string) => {
      if (activeSession?.id && isActive) {
        sendMessage(message);
      }
    },
    [activeSession?.id, sendMessage, isActive]
  );

  // 적용하기 성공
  const handleApplySuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.active('workout'),
    });
    router.push('/routine');
  }, [queryClient, router]);

  // 버리기 성공
  const handleAbandonSuccess = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.aiSession.active('workout'),
    });
  }, [queryClient]);

  // 로딩 상태
  if (isLoadingSession) {
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

  // 활성 세션이 없는 경우 - purpose 선택 화면
  if (!activeSession) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="AI 코치" onBack={() => router.push('/routine')} />
        <div className="flex flex-col items-center justify-center gap-8 p-8 mt-12">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              무엇을 도와드릴까요?
            </h2>
            <p className="text-muted-foreground text-sm">
              원하는 목표를 선택해주세요
            </p>
          </div>

          {/* Purpose 선택 카드 */}
          <div className="w-full max-w-sm space-y-4">
            {/* 운동 루틴 */}
            <button
              onClick={() => handleSelectPurpose('workout')}
              disabled={createSession.isPending}
              className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Dumbbell className="w-7 h-7 text-orange-500" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-foreground text-lg">운동 루틴</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    맞춤형 4주 운동 프로그램
                  </p>
                </div>
                {createSession.isPending && selectedPurpose === 'workout' && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
              </div>
            </button>

            {/* 식단 관리 */}
            <button
              onClick={() => handleSelectPurpose('meal')}
              disabled={createSession.isPending}
              className="w-full p-6 rounded-2xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                  <Utensils className="w-7 h-7 text-green-500" />
                </div>
                <div className="text-left flex-1">
                  <h3 className="font-bold text-foreground text-lg">식단 관리</h3>
                  <p className="text-muted-foreground text-sm mt-0.5">
                    맞춤형 영양 및 식단 계획
                  </p>
                </div>
                {createSession.isPending && selectedPurpose === 'meal' && (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 헤더 타이틀 (purpose에 따라)
  const headerTitle = activeSession?.purpose === 'meal' ? 'AI 영양사' : 'AI 트레이너';

  // 헤더 우측 액션 버튼 (세션이 있으면 항상 표시)
  const headerAction = (
    <button
      onClick={handleStartNewSession}
      disabled={createSession.isPending || isStreaming}
      className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-primary disabled:opacity-50"
      aria-label="새 대화 시작"
    >
      {createSession.isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <RotateCcw className="w-5 h-5" />
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={headerTitle}
        onBack={() => router.push('/routine')}
        action={headerAction}
      />

      {/* 완료/포기 상태 배너 */}
      {isCompleted && (
        <div className="px-4 py-3 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">루틴이 적용되었습니다</span>
        </div>
      )}
      {isAbandoned && (
        <div className="px-4 py-3 bg-muted border-b border-border flex items-center gap-2 text-muted-foreground">
          <XCircle className="w-5 h-5" />
          <span className="text-sm font-medium">대화가 취소되었습니다</span>
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
      />

      {/* 에러 메시지 */}
      {(chatError || actionError) && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {chatError || actionError}
        </div>
      )}

      {/* 활성 대화 - 입력 영역 */}
      {isActive && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder="운동 목표를 알려주세요..."
        />
      )}

      {/* 활성 대화 + 루틴 준비됨 - 액션 버튼 */}
      {isActive && activeSession.resultApplied && !isStreaming && (
        <ChatActionButtons
          conversationId={activeSession.id}
          onApplySuccess={handleApplySuccess}
          onAbandonSuccess={handleAbandonSuccess}
          onError={setActionError}
        />
      )}

    </div>
  );
}
