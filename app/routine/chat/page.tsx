'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import {
  ChatMessageList,
  ChatInput,
  ChatCompletedBanner,
  ChatMenuDrawer,
  PreviewDetailDrawer,
} from '@/components/routine/chat';
import { useAISessionWithMessages, useAIChat, useDeleteAISession, useResetAISession } from '@/hooks/aiChat';
import { useWebViewCore } from '@/hooks';
import { Loader2, CheckCircle, Menu, AlertCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { useShowError } from '@/lib/stores/errorStore';

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
  const confirmDialog = useConfirmDialog();
  const { isInWebView } = useWebViewCore();
  // 루틴/식단 적용 완료 상태 추적 (적용 후 리다이렉트 방지)
  const hasAppliedRef = useRef(false);
  const showError = useShowError();

  // 메뉴 드로어 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 미리보기 상세 드로어 상태
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewDrawerType, setPreviewDrawerType] = useState<'routine' | 'meal'>('routine');

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

  // 세션 삭제 mutation (캐시 무효화 스킵 - 페이지 이동 시 깜빡임 방지)
  const deleteSession = useDeleteAISession({ skipInvalidation: true });

  // 세션 초기화 mutation (삭제 후 새 세션 생성)
  const resetSession = useResetAISession();

  // session 파라미터가 없으면 /routine으로 리다이렉트
  useEffect(() => {
    if (!sessionId) {
      // WebView에서는 window.location.replace가 더 확실함
      if (isInWebView) {
        window.location.replace('/routine');
      } else {
        router.replace('/routine');
      }
    }
  }, [sessionId, router, isInWebView]);

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
    clearError,
    retryLastMessage,
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

  // 미리보기 상세 보기 핸들러
  const handleViewRoutineDetails = () => {
    setPreviewDrawerType('routine');
    setPreviewDrawerOpen(true);
  };

  const handleViewMealDetails = () => {
    setPreviewDrawerType('meal');
    setPreviewDrawerOpen(true);
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
      onConfirm: () => {
        // mutation 호출 - isPending으로 로딩 UI 자동 표시
        deleteSession.mutate(session.id, {
          onSuccess: () => {
            if (isInWebView) {
              window.location.replace('/routine');
            } else {
              router.replace('/routine');
            }
          },
          onError: (err) => {
            console.error('Failed to delete chat:', err);
            showError('채팅 삭제에 실패했습니다');
          },
        });
      },
    });
  };

  // 대화 초기화 (진행 중인 세션 삭제 후 같은 purpose로 새 세션 생성)
  const handleResetChat = () => {
    if (!session?.id || !isActive) return;

    confirmDialog({
      title: '대화 초기화',
      message: '현재 대화를 종료하고 처음부터 다시 시작할까요?',
      confirmText: '초기화',
      cancelText: '취소',
      variant: 'danger',
      loadingMessage: '대화를 초기화하는 중...',
      onConfirm: async () => {
        // mutateAsync로 모달 로딩 상태 유지
        const newSession = await resetSession.mutateAsync({
          sessionId: session.id,
          purpose: session.purpose,
        });

        // 새 세션으로 이동
        const newUrl = `/routine/chat?session=${newSession.id}`;
        if (isInWebView) {
          window.location.replace(newUrl);
        } else {
          router.replace(newUrl);
          // URL 변경이 완료될 때까지 대기 (모달이 닫힌 후 바로 새 세션 표시)
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      },
    });
  };

  // 로딩 상태 (삭제/초기화 중 포함)
  if (!sessionId || isLoadingSession || deleteSession.isPending || resetSession.isPending) {
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

  // 헤더 우측 액션 버튼 (햄버거 메뉴)
  const headerAction = (
    <button
      onClick={() => setIsMenuOpen(true)}
      className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
      aria-label="메뉴 열기"
    >
      <Menu className="w-5 h-5" />
    </button>
  );

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={headerTitle}
        onBack={() => router.push('/routine')}
        action={headerAction}
      />

      {/* 완료 상태 배너 */}
      {isCompleted && (
        <div className={`px-4 py-3 border-b flex items-center gap-2 ${
          session.purpose === 'meal'
            ? 'bg-meal/10 border-meal/20 text-meal'
            : 'bg-workout/10 border-workout/20 text-workout'
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
        onViewRoutineDetails={handleViewRoutineDetails}
        pendingMealPreview={pendingMealPreview}
        appliedMealPlan={appliedMealPlan}
        mealProgress={mealProgress}
        onApplyMealPlan={applyMealPlan}
        onRequestMealRevision={requestMealRevision}
        onViewMealDetails={handleViewMealDetails}
        pendingProfileConfirmation={pendingProfileConfirmation}
        onConfirmProfile={confirmProfile}
        onRequestProfileEdit={requestProfileEdit}
        pendingStart={pendingStart}
        onStartConversation={startConversation}
        sessionPurpose={session.purpose}
      />

      {/* 에러 배너 */}
      {chatError && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>메시지 전송에 실패했습니다</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={clearError}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                닫기
              </button>
              <button
                onClick={retryLastMessage}
                className="text-xs text-destructive font-medium hover:underline"
              >
                재시도
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 활성 대화 - 입력 영역 (시작 대기 상태에서는 숨김) */}
      {isActive && !pendingStart && (
        <ChatInput
          onSend={handleSendMessage}
          disabled={isStreaming}
          isLoading={isStreaming}
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

      {/* 채팅 메뉴 드로어 */}
      <ChatMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentSessionId={session.id}
        sessionStatus={session.status}
        sessionPurpose={session.purpose}
        onSelectSession={handleSelectHistorySession}
        onResetChat={handleResetChat}
        onDeleteChat={handleDeleteChat}
        isStreaming={isStreaming}
      />

      {/* 미리보기 상세 드로어 */}
      {(pendingRoutinePreview || pendingMealPreview) && (
        <PreviewDetailDrawer
          isOpen={previewDrawerOpen}
          onClose={() => setPreviewDrawerOpen(false)}
          type={previewDrawerType}
          preview={previewDrawerType === 'routine' ? pendingRoutinePreview! : pendingMealPreview!}
          onApply={() => {
            setPreviewDrawerOpen(false);
            if (previewDrawerType === 'routine') {
              applyRoutine();
            } else {
              applyMealPlan((pendingMealPreview?.conflicts?.length ?? 0) > 0);
            }
          }}
          isApplying={isStreaming}
        />
      )}
    </div>
  );
}
