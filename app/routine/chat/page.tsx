'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import {
  ChatMessageList,
  ChatInput,
  ChatCompletedBanner,
  ChatMenuDrawer,
  PreviewDetailDrawer,
} from '@/components/routine/chat';
import { useChatPage } from '@/hooks/aiChat';
import { SpinnerGapIcon, ListIcon, WarningCircleIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';

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
  const sessionId = searchParams.get('session');

  // ---------------------------------------------------------------------------
  // UI 상태 (로컬)
  // ---------------------------------------------------------------------------

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [previewDrawerOpen, setPreviewDrawerOpen] = useState(false);
  const [previewDrawerType, setPreviewDrawerType] = useState<'routine' | 'meal'>('routine');

  // 미리보기 드로어 열기 콜백
  const handleOpenPreviewDrawer = (type: 'routine' | 'meal') => {
    setPreviewDrawerType(type);
    setPreviewDrawerOpen(true);
  };

  // ---------------------------------------------------------------------------
  // 페이지 로직 (훅)
  // ---------------------------------------------------------------------------

  const { session, chat, handlers, pageState } = useChatPage(sessionId, handleOpenPreviewDrawer);

  // ---------------------------------------------------------------------------
  // 조건부 렌더링
  // ---------------------------------------------------------------------------

  // 로딩 상태
  if (pageState.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <SpinnerGapIcon size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (pageState.hasError) {
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

  // 세션 없음
  if (pageState.isEmpty || !session) {
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

  // ---------------------------------------------------------------------------
  // 메인 UI
  // ---------------------------------------------------------------------------

  const headerTitle = session.purpose === 'meal' ? 'AI 영양사' : 'AI 트레이너';

  const headerAction = (
    <button
      onClick={() => setIsMenuOpen(true)}
      className="p-2 hover:bg-muted/50 rounded-lg transition-colors text-muted-foreground hover:text-foreground"
      aria-label="메뉴 열기"
    >
      <ListIcon size={20} />
    </button>
  );

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      <PageHeader
        title={headerTitle}
        onBack={() => router.push('/routine')}
        action={headerAction}
      />

      {/* 메인 콘텐츠 영역 */}
      <div className="relative flex-1 flex flex-col min-h-0">
        {/* 채팅 메시지 목록 */}
        <ChatMessageList
          messages={chat.messages}
          isLoading={chat.isStreaming && !chat.streamingContent}
          streamingContent={chat.streamingContent}
          activeTools={chat.activeTools}
          pendingInput={chat.pendingInput}
          onSubmitInput={chat.submitInput}
          pendingRoutinePreview={chat.pendingRoutinePreview}
          appliedRoutine={chat.appliedRoutine}
          routineProgress={chat.routineProgress}
          onApplyRoutine={chat.applyRoutine}
          onRequestRevision={chat.requestRevision}
          onViewRoutineDetails={handlers.handleViewRoutineDetails}
          pendingMealPreview={chat.pendingMealPreview}
          appliedMealPlan={chat.appliedMealPlan}
          mealProgress={chat.mealProgress}
          onApplyMealPlan={chat.applyMealPlan}
          onRequestMealRevision={chat.requestMealRevision}
          onViewMealDetails={handlers.handleViewMealDetails}
          pendingProfileConfirmation={chat.pendingProfileConfirmation}
          onConfirmProfile={chat.confirmProfile}
          onRequestProfileEdit={chat.requestProfileEdit}
          pendingStart={chat.pendingStart}
          onStartConversation={chat.startConversation}
          sessionPurpose={session.purpose}
        />

        {/* 완료된 대화 - 완료 배너 (오버레이) */}
        {pageState.isCompleted && (
          <div className="absolute bottom-0 left-0 right-0">
            <ChatCompletedBanner
              purpose={session.purpose}
              appliedRoutine={chat.appliedRoutine}
              appliedMealPlan={chat.appliedMealPlan}
              onNavigateToCalendar={handlers.handleNavigateToCalendar}
            />
          </div>
        )}
      </div>

      {/* 에러 배너 */}
      {chat.error && (
        <div className="mx-4 mb-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <WarningCircleIcon size={16} className="shrink-0" />
              <span>메시지 전송에 실패했습니다</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={chat.clearError}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                닫기
              </button>
              <button
                onClick={chat.retryLastMessage}
                className="text-xs text-destructive font-medium hover:underline"
              >
                재시도
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 활성 대화 - 입력 영역 */}
      {pageState.isActive && !chat.pendingStart && (
        <ChatInput
          onSend={handlers.handleSendMessage}
          disabled={chat.isStreaming}
          isLoading={chat.isStreaming}
          placeholder={
            session.purpose === 'meal'
              ? '식단 목표를 알려주세요...'
              : '운동 목표를 알려주세요...'
          }
        />
      )}

      {/* 채팅 메뉴 드로어 */}
      <ChatMenuDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        currentSessionId={session.id}
        sessionStatus={session.status}
        sessionPurpose={session.purpose}
        onSelectSession={handlers.handleSelectHistorySession}
        onResetChat={handlers.handleResetChat}
        onDeleteChat={handlers.handleDeleteChat}
        isStreaming={chat.isStreaming}
      />

      {/* 미리보기 상세 드로어 */}
      {(chat.pendingRoutinePreview || chat.pendingMealPreview) && (
        <PreviewDetailDrawer
          isOpen={previewDrawerOpen}
          onClose={() => setPreviewDrawerOpen(false)}
          type={previewDrawerType}
          preview={previewDrawerType === 'routine' ? chat.pendingRoutinePreview! : chat.pendingMealPreview!}
          onApply={(forceOverwrite) => {
            setPreviewDrawerOpen(false);
            if (previewDrawerType === 'routine') {
              chat.applyRoutine(forceOverwrite);
            } else {
              chat.applyMealPlan(forceOverwrite);
            }
          }}
          isApplying={chat.isStreaming}
        />
      )}
    </div>
  );
}
