'use client';

import { useSearchParams } from 'next/navigation';
import { useCoachChat, useCoachDrawer, useRoutinePreview } from '@/hooks/coach';
import { useCoachConversations } from '@/hooks/coach/queries';
import type { MessageActionType } from '@/components/routine/chat/ChatMessage';
import type { RoutinePreviewData } from '@/lib/types/fitness';
import CoachHeader from './CoachHeader';
import WelcomeScreen from './WelcomeScreen';
import SummarizationIndicator from './SummarizationIndicator';
import ActionChips from './ActionChips';
import ChatListDrawer from './ChatListDrawer';
import ChatMessageList from '@/components/routine/chat/ChatMessageList';
import ChatInput from '@/components/routine/chat/ChatInput';
import PreviewDetailDrawer from '@/components/routine/chat/PreviewDetailDrawer';
import { PulseLoader } from '@/components/ui/PulseLoader';

/**
 * 코치 채팅 콘텐츠 (Suspense 내부)
 *
 * SOLID SRP 적용:
 * - useCoachChat: 채팅 상태 및 메시지 관리
 * - useCoachDrawer: 대화 목록 드로어 관리
 * - useRoutinePreview: 루틴 프리뷰 드로어 관리
 * - 이 컴포넌트: 순수 UI 조합만 담당
 */
export default function CoachContent() {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id') ?? undefined;

  // 코치 채팅 훅
  const {
    conversationId,
    messages,
    activePurpose,
    streamingContent,
    isStreaming,
    error,
    activeTools,
    appliedRoutine,
    routineProgress,
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
    editProfile,
    isMessagesLoading,
    refetchMessages,
  } = useCoachChat(conversationIdFromUrl);

  // 드로어 관리 훅
  const drawer = useCoachDrawer({
    conversationId,
    onNewChat: handleNewChat,
  });

  // 루틴 프리뷰 관리 훅 (Phase 9: messageId 기반)
  const preview = useRoutinePreview({
    conversationId,
    refetchMessages,
  });

  // 대화 목록
  const { data: conversationsData, isPending: isLoadingConversations } = useCoachConversations();

  /**
   * Phase 9: 메시지 액션 핸들러
   * content_type별 트랜지언트 UI에서 발생하는 액션 처리
   */
  const handleMessageAction = (
    action: MessageActionType,
    messageId: string,
    value?: string | string[]
  ) => {
    // 메시지에서 데이터 추출 (routine_preview의 경우)
    const message = messages.find((m) => m.id === messageId);

    switch (action) {
      case 'confirm':
        confirmProfile(messageId);
        break;
      case 'edit':
        editProfile(messageId);
        break;
      case 'apply':
        if (message?.contentType === 'routine_preview') {
          const previewData = JSON.parse(message.content) as RoutinePreviewData;
          preview.apply(messageId, previewData, value === 'force');
        }
        break;
      case 'cancel':
        preview.cancel(messageId);
        break;
      case 'viewDetails':
        preview.open(messageId);
        break;
      case 'submitInput':
        if (value) {
          submitInput(messageId, value);
        }
        break;
    }
  };

  // 표시 조건
  // 낙관적 메시지(isStreaming 중 pendingUserMessage)가 있으면 로딩 상태여도 채팅 표시
  const showChatLoader = isMessagesLoading && !isStreaming && messages.length === 0;
  const showWelcome = messages.length === 0 && !isStreaming && !isMessagesLoading;
  
  // Phase 9: 메시지에서 pending 상태의 트랜지언트 UI 체크
  const hasPendingInteraction = messages.some(m => {
    const status = m.metadata?.status as string;
    return (
      (m.contentType === 'profile_confirmation' && status === 'pending') ||
      (m.contentType === 'input_request' && status === 'pending') ||
      (m.contentType === 'routine_preview' && status === 'pending')
    );
  });
  const showActionChips = !isStreaming && !streamingContent && !hasPendingInteraction && messages.length === 0;

  return (
    <>
      {/* 헤더 */}
      <CoachHeader
        onMenuClick={drawer.open}
        hasActivePurpose={!!activePurpose}
      />

      {/* 컨텐츠 영역 */}
      <div className="flex-1 overflow-hidden relative">
        {showChatLoader ? (
          <PulseLoader variant="chat" className="p-4" />
        ) : showWelcome ? (
          <WelcomeScreen />
        ) : (
          <ChatMessageList
            messages={messages}
            isLoading={isStreaming}
            streamingContent={streamingContent}
            activeTools={activeTools}
            onMessageAction={handleMessageAction}
            isApplyingRoutine={preview.isApplying}
            appliedRoutine={appliedRoutine}
            routineProgress={routineProgress}
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
        isOpen={drawer.isOpen}
        onClose={drawer.close}
        conversations={conversationsData?.conversations ?? []}
        currentId={conversationId}
        onSelect={drawer.selectConversation}
        onNewChat={drawer.onNewChat}
        onDelete={drawer.deleteWithConfirm}
        isLoading={isLoadingConversations}
      />

      {/* 루틴 상세 보기 드로어 */}
      {(() => {
        // Phase 9: 메시지에서 preview 데이터 추출
        const previewMessageId = preview.currentPreviewMessageId;
        const previewMessage = previewMessageId
          ? messages.find((m) => m.id === previewMessageId)
          : null;
        
        if (!previewMessage || previewMessage.contentType !== 'routine_preview') {
          return null;
        }

        const previewData = JSON.parse(previewMessage.content) as RoutinePreviewData;

        return (
          <PreviewDetailDrawer
            isOpen={preview.isOpen}
            onClose={preview.close}
            preview={previewData}
            onApply={(forceOverwrite) => {
              if (previewMessageId) {
                preview.apply(previewMessageId, previewData, forceOverwrite);
              }
            }}
            isApplying={preview.isApplying}
          />
        );
      })()}
    </>
  );
}
