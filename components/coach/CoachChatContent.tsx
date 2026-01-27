'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCoachChat } from '@/hooks/coach';
import { useCoachConversations } from '@/hooks/coach/queries';
import { useDeleteCoachConversation, useApplyRoutine } from '@/hooks/coach/mutations';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import CoachHeader from './CoachHeader';
import WelcomeScreen from './WelcomeScreen';
import SummarizationIndicator from './SummarizationIndicator';
import ActionChips from './ActionChips';
import ChatListDrawer from './ChatListDrawer';
import ChatMessageList from '@/components/routine/chat/ChatMessageList';
import ChatInput from '@/components/routine/chat/ChatInput';
import PreviewDetailDrawer from '@/components/routine/chat/PreviewDetailDrawer';
import { PulseLoader } from '@/components/ui/PulseLoader';

interface CoachChatContentProps {
  initialConversationId?: string;
}

/**
 * 코치 채팅 메인 컨텐츠
 *
 * 비즈니스 로직과 UI 통합
 * - 메시지 목록 표시
 * - 스트리밍 응답 처리
 * - 액션 칩 / 채팅 목록 드로어
 */
export default function CoachChatContent({
  initialConversationId,
}: CoachChatContentProps) {
  const router = useRouter();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // 코치 채팅 훅
  const {
    conversationId,
    messages,
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
    hasNextPage,
    isFetchingNextPage,
    handleSend,
    handleChipClick,
    handleNewChat,
    fetchNextPage,
    submitInput,
    clearError,
    confirmProfile,
    requestProfileEdit,
    isMessagesLoading,
  } = useCoachChat(initialConversationId);

  // 대화 목록 & 뮤테이션
  const { data: conversationsData, isPending: isLoadingConversations } = useCoachConversations();
  const deleteConversation = useDeleteCoachConversation();
  const applyRoutine = useApplyRoutine();
  const confirm = useConfirmDialog();

  // 표시 조건
  const showWelcome = messages.length === 0 && !isStreaming && !isMessagesLoading;
  const hasPendingInteraction = !!pendingProfileConfirmation || !!pendingInput || !!pendingRoutinePreview;
  const showActionChips = !isStreaming && !streamingContent && !hasPendingInteraction && messages.length === 0;

  // 대화 선택 핸들러
  const handleSelectConversation = (id: string) => {
    router.push(`/routine/coach?id=${id}`);
  };

  // 루틴 적용 핸들러
  const handleApplyRoutine = async (forceOverwrite?: boolean) => {
    if (!conversationId || !pendingRoutinePreview?.id) return;

    setIsApplying(true);
    try {
      await applyRoutine.mutateAsync({
        conversationId,
        previewId: pendingRoutinePreview.id,
        forceOverwrite,
      });
      setIsPreviewOpen(false);
    } finally {
      setIsApplying(false);
    }
  };

  // 수정 요청 핸들러
  const handleRequestRevision = (feedback: string) => {
    handleSend(`수정 요청: ${feedback}`);
  };

  // 상세 보기 핸들러
  const handleViewDetails = () => {
    setIsPreviewOpen(true);
  };

  // 대화 삭제 핸들러
  const handleDeleteConversation = (id: string) => {
    confirm({
      title: '대화 삭제',
      message: '이 대화를 삭제하시겠습니까?\n삭제된 대화는 복구할 수 없습니다.',
      confirmText: '삭제',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        await deleteConversation.mutateAsync(id);
        // 현재 대화 삭제 시 새 채팅 화면으로 이동
        if (id === conversationId) {
          setIsDrawerOpen(false);
          router.push('/routine/coach');
        }
      },
    });
  };

  return (
    <div className="flex flex-col h-dvh bg-background pb-[env(safe-area-inset-bottom)]">
      {/* 헤더 */}
      <CoachHeader
        onMenuClick={() => setIsDrawerOpen(true)}
        hasActivePurpose={!!activePurpose}
      />

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden relative">
        {isMessagesLoading ? (
          <PulseLoader variant="chat" className="p-4" />
        ) : showWelcome ? (
          <WelcomeScreen />
        ) : (
          <ChatMessageList
            messages={messages}
            isLoading={isStreaming}
            streamingContent={streamingContent}
            activeTools={activeTools}
            pendingInput={pendingInput}
            onSubmitInput={submitInput}
            pendingRoutinePreview={pendingRoutinePreview}
            appliedRoutine={appliedRoutine}
            routineProgress={routineProgress}
            onApplyRoutine={handleApplyRoutine}
            onRequestRevision={handleRequestRevision}
            onViewRoutineDetails={handleViewDetails}
            pendingProfileConfirmation={pendingProfileConfirmation}
            onConfirmProfile={confirmProfile}
            onRequestProfileEdit={requestProfileEdit}
            sessionPurpose="coach"
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onLoadMore={fetchNextPage}
          />
        )}
      </div>

      {/* 요약 인디케이터 */}
      <SummarizationIndicator state={summarizationState} />

      {/* 에러 표시 */}
      {error && (
        <div className="flex items-center justify-between px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <span className="text-sm text-destructive">{error}</span>
          <button
            onClick={clearError}
            className="text-xs text-destructive underline"
          >
            닫기
          </button>
        </div>
      )}

      {/* 액션 칩 */}
      {showActionChips && (
        <ActionChips
          onChipClick={handleChipClick}
          disabled={isStreaming}
        />
      )}

      {/* 인풋 */}
      <ChatInput
        onSend={handleSend}
        disabled={isStreaming}
        isLoading={isStreaming}
        placeholder={activePurpose ? '응답을 입력하세요...' : '무엇이든 물어보세요...'}
      />

      {/* 채팅 목록 드로어 */}
      <ChatListDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        conversations={conversationsData?.conversations ?? []}
        currentId={conversationId}
        onSelect={handleSelectConversation}
        onNewChat={handleNewChat}
        onDelete={handleDeleteConversation}
        isLoading={isLoadingConversations}
      />

      {/* 루틴 상세 보기 드로어 */}
      {pendingRoutinePreview && (
        <PreviewDetailDrawer
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          preview={pendingRoutinePreview}
          onApply={handleApplyRoutine}
          isApplying={isApplying}
        />
      )}
    </div>
  );
}
