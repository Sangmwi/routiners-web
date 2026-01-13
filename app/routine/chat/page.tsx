'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import {
  ChatMessageList,
  ChatInput,
  ChatCompletedBanner,
  ChatHistoryDropdown,
} from '@/components/routine/chat';
import { useAISessionWithMessages, useAIChat } from '@/hooks/aiChat';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Loader2, CheckCircle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { conversationApi } from '@/lib/api/conversation';
import { useConfirmDialog } from '@/lib/stores/modalStore';

/**
 * AI 트레이너 채팅 페이지
 *
 * URL 파라미터:
 * - session: string (필수) - 표시할 세션 ID
 *
 * 세션 생성은 FloatingAIButton/AISelectionModal에서 처리
 * 이 페이지는 세션 표시만 담당
 */
export default function AIChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  // 루틴/식단 적용 완료 상태 추적 (적용 후 리다이렉트 방지)
  const hasAppliedRef = useRef(false);

  // URL에서 session 파라미터 확인 (필수)
  const sessionId = searchParams.get('session');

  // 세션 조회
  const {
    data: session,
    isLoading: isLoadingSession,
    error: sessionError,
  } = useAISessionWithMessages(sessionId ?? undefined, {
    enabled: !!sessionId,
  });

  // session 파라미터가 없으면 /routine으로 리다이렉트
  useEffect(() => {
    if (!sessionId) {
      router.replace('/routine');
    }
  }, [sessionId, router]);

  // 채팅 훅
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
  } = useAIChat(session);

  // 루틴/식단 적용 성공 시 ref 설정 (리다이렉트 방지)
  useEffect(() => {
    if (appliedRoutine || appliedMealPlan) {
      hasAppliedRef.current = true;
    }
  }, [appliedRoutine, appliedMealPlan]);

  // 대화 상태 확인
  const isCompleted = session?.status === 'completed';
  const isActive = session?.status === 'active';

  // 히스토리 세션 선택 핸들러
  const handleSelectHistorySession = (selectedSessionId: string) => {
    router.push(`/routine/chat?session=${selectedSessionId}`);
  };

  // 메시지 전송
  const handleSendMessage = (message: string) => {
    if (session?.id && isActive) {
      sendMessage(message);
    }
  };

  // 캘린더로 이동
  const handleNavigateToCalendar = () => {
    router.push('/routine');
  };

  // 대화 삭제 (확인 후 삭제)
  const handleDeleteChat = () => {
    if (!session?.id) return;

    confirmDialog({
      title: '대화 삭제',
      message: '이 대화를 삭제하시겠습니까? 삭제된 대화는 히스토리에서 보이지 않습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await conversationApi.deleteConversation(session.id);
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

  // 로딩 상태
  if (!sessionId || isLoadingSession) {
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
          <Button onClick={() => router.push('/routine')}>돌아가기</Button>
        </div>
      </div>
    );
  }

  // 세션이 없으면 에러
  if (!session) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="AI 트레이너" />
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground text-center">
            세션을 찾을 수 없습니다.
          </p>
          <Button onClick={() => router.push('/routine')}>돌아가기</Button>
        </div>
      </div>
    );
  }

  // 헤더 타이틀 (purpose에 따라)
  const headerTitle = session.purpose === 'meal' ? 'AI 영양사' : 'AI 트레이너';

  // 헤더 우측 액션 버튼 (대화 목록 드롭다운 + 삭제 버튼)
  const headerAction = (
    <div className="flex items-center gap-1">
      <ChatHistoryDropdown
        currentSessionId={session.id}
        onSelectSession={handleSelectHistorySession}
      />
      {/* 완료 상태에서만 삭제 버튼 표시 */}
      {isCompleted && (
        <button
          onClick={handleDeleteChat}
          className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-destructive"
          aria-label="대화 삭제"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
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
          session.purpose === 'meal'
            ? 'bg-lime-500/10 border-lime-500/20 text-lime-600'
            : 'bg-green-500/10 border-green-500/20 text-green-600'
        }`}>
          <CheckCircle className="w-5 h-5" />
          <span className="text-sm font-medium">
            {session.purpose === 'meal' ? '식단이 적용되었습니다' : '루틴이 적용되었습니다'}
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
        sessionPurpose={session.purpose}
      />

      {/* 에러 메시지 */}
      {chatError && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm text-center">
          {chatError}
        </div>
      )}

      {/* 활성 대화 - 입력 영역 (시작 대기 상태에서는 숨김) */}
      {isActive && !pendingStart && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          placeholder={
            session.purpose === 'meal'
              ? '식단 목표를 알려주세요...'
              : '운동 목표를 알려주세요...'
          }
        />
      )}

      {/* 완료된 대화 - 완료 배너 */}
      {isCompleted && (
        <ChatCompletedBanner
          purpose={session.purpose}
          appliedRoutine={appliedRoutine}
          appliedMealPlan={appliedMealPlan}
          onNavigateToCalendar={handleNavigateToCalendar}
        />
      )}
    </div>
  );
}
