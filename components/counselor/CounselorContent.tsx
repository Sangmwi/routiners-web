'use client';

import { useSearchParams } from 'next/navigation';
import { useCounselorChat, useCounselorDrawer, useRoutinePreview } from '@/hooks/counselor';
import { useCounselorConversations } from '@/hooks/counselor/queries';
import type { MessageActionType } from '@/components/routine/chat/ChatMessage';
import type { RoutinePreviewData } from '@/lib/types/fitness';
import WelcomeScreen from './WelcomeScreen';
import SummarizationIndicator from './SummarizationIndicator';
import ActionChips from './ActionChips';
import ChatListDrawer from './ChatListDrawer';
import ChatMessageList from '@/components/routine/chat/ChatMessageList';
import ChatInput from '@/components/routine/chat/ChatInput';
import PreviewDetailDrawer from '@/components/routine/chat/PreviewDetailDrawer';
import { PulseLoader } from '@/components/ui/PulseLoader';

interface CounselorContentProps {
  /** 드로어 열림 상태 (page.tsx에서 관리) */
  isDrawerOpen: boolean;
  /** 드로어 닫기 핸들러 */
  onDrawerClose: () => void;
}

/**
 * 상담 채팅 콘텐츠 (Suspense 내부)
 *
 * SOLID SRP 적용:
 * - useCounselorChat: 채팅 상태 및 메시지 관리
 * - useCounselorDrawer: 대화 목록 드로어 액션 관리
 * - useRoutinePreview: 루틴 프리뷰 드로어 관리
 * - 이 컴포넌트: 순수 UI 조합만 담당
 *
 * 드로어 상태 분리:
 * - isOpen/close: page.tsx에서 관리 (헤더 즉시 동작)
 * - 드로어 액션: 이 컴포넌트 내부 (데이터 필요)
 */
export default function CounselorContent({ isDrawerOpen, onDrawerClose }: CounselorContentProps) {
  const searchParams = useSearchParams();
  const conversationIdFromUrl = searchParams.get('id') ?? undefined;

  // 상담 채팅 훅
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
    cancelProfile,
    isMessagesLoading,
    isInitializing,
    isRefetching,
    sendMessage,
    refetchMessages,
  } = useCounselorChat(conversationIdFromUrl);

  // 드로어 관리 훅
  const drawer = useCounselorDrawer({
    conversationId,
    onNewChat: handleNewChat,
  });

  // 루틴 프리뷰 관리 훅 (Phase 10: AI 대화 흐름)
  const preview = useRoutinePreview({
    conversationId,
    sendMessage,
    refetchMessages,
  });

  // 대화 목록
  const { data: conversationsData, isPending: isLoadingConversations } = useCounselorConversations();

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
      case 'cancelProfile':
        cancelProfile(messageId);
        break;
      case 'editPreview':
        preview.edit(messageId);
        break;
      case 'apply':
        // DetailDrawer를 열어서 주차 선택 후 적용
        preview.open(messageId);
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
  const showChatLoader = (isMessagesLoading || isInitializing) && !isStreaming && messages.length === 0;
  const showWelcome = messages.length === 0 && !isStreaming && !isMessagesLoading && !isInitializing;
  
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

  // Phase 21: profile_confirmation, routine_preview pending 시 입력 차단
  // input_request는 텍스트로 답변 가능하므로 차단하지 않음
  const hasPendingBlockingUI = messages.some(m => {
    const status = m.metadata?.status as string;
    return (
      (m.contentType === 'profile_confirmation' && status === 'pending') ||
      (m.contentType === 'routine_preview' && status === 'pending')
    );
  });

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* 컨텐츠 영역 - 스크롤 가능 */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
            appliedRoutine={appliedRoutine}
            routineProgress={routineProgress}

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
        disabled={isStreaming || hasPendingBlockingUI}
        isLoading={isStreaming}
        placeholder={
          hasPendingBlockingUI
            ? '위 카드에서 선택해주세요'
            : activePurpose
              ? '응답을 입력하세요...'
              : '무엇이든 물어보세요...'
        }
      />

      {/* 채팅 목록 드로어 */}
      <ChatListDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
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
        const previewStatus = (previewMessage.metadata?.status as 'pending' | 'applied' | 'cancelled') || 'pending';

        return (
          <PreviewDetailDrawer
            isOpen={preview.isOpen}
            onClose={preview.close}
            preview={previewData}
            status={previewStatus}
            isApplying={preview.isApplying}
            hasExistingScheduled={(previewData.conflicts?.length ?? 0) > 0}
            onApply={(forceOverwrite, weekCount, appendMode) => {
              if (previewMessageId) {
                preview.apply(previewMessageId, previewData, forceOverwrite, weekCount, appendMode);
              }
            }}
          />
        );
      })()}
    </div>
  );
}
