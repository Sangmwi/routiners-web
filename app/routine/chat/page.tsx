'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/common/PageHeader';
import {
  ChatMessageList,
  ChatInput,
  ChatCompletedBanner,
  ChatMenuDrawer,
} from '@/components/routine/chat';
import { useAISessionWithMessages, useAIChat } from '@/hooks/aiChat';
import { useWebViewCore } from '@/hooks';
import { queryKeys } from '@/lib/constants/queryKeys';
import { Loader2, CheckCircle, Menu } from 'lucide-react';
import Button from '@/components/ui/Button';
import { conversationApi } from '@/lib/api/conversation';
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
  const queryClient = useQueryClient();
  const confirmDialog = useConfirmDialog();
  const { isInWebView } = useWebViewCore();
  // 루틴/식단 적용 완료 상태 추적 (적용 후 리다이렉트 방지)
  const hasAppliedRef = useRef(false);
  const showError = useShowError();

  // 메뉴 드로어 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 초기화 중 로딩 상태
  const [isResetting, setIsResetting] = useState(false);

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
          // WebView에서는 window.location.replace가 더 확실함
          if (isInWebView) {
            window.location.replace('/routine');
          } else {
            router.replace('/routine');
          }
        } catch (err) {
          console.error('Failed to delete chat:', err);
          showError('채팅 삭제에 실패했습니다');
        }
      },
    });
  };

  // 대화 초기화 (진행 중인 세션 삭제 후 같은 purpose로 새 세션 생성)
  const handleResetChat = () => {
    if (!session?.id || !isActive) return;

    const purpose = session.purpose; // 현재 세션의 purpose 저장

    confirmDialog({
      title: '대화 초기화',
      message: '현재 대화를 종료하고 처음부터 다시 시작할까요?',
      confirmText: '초기화',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        try {
          setIsResetting(true); // 로딩 시작

          // 1. 현재 세션 삭제
          await conversationApi.deleteConversation(session.id);

          // 2. 캐시 무효화
          queryClient.invalidateQueries({
            queryKey: queryKeys.aiSession.all,
          });

          // 3. 새 세션 생성
          const newSession = await conversationApi.createConversation({
            type: 'ai',
            aiPurpose: purpose,
          });

          // 4. 새 세션으로 이동 (이동 후 컴포넌트 언마운트)
          const newUrl = `/routine/chat?session=${newSession.id}`;
          if (isInWebView) {
            window.location.replace(newUrl);
          } else {
            router.replace(newUrl);
          }
        } catch (err) {
          setIsResetting(false); // 에러 시 로딩 해제
          console.error('Failed to reset chat:', err);
          showError('대화 초기화에 실패했습니다');
        }
      },
    });
  };

  // 로딩 상태 (초기화 중 포함)
  if (!sessionId || isLoadingSession || isResetting) {
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
    </div>
  );
}
