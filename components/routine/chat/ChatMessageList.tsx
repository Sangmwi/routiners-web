'use client';

import { useRef } from 'react';
import { ChatMessage as ChatMessageType } from '@/lib/types/chat';
import { AIToolStatus } from '@/lib/types/fitness';
import {
  RoutineAppliedEvent,
  RoutineProgressEvent,
} from '@/lib/api/conversation';
import { SessionPurpose } from '@/lib/types/routine';
import { SpinnerGapIcon } from '@phosphor-icons/react';

// Hooks
import {
  useMinimumLoadingTime,
  useToolDisplayState,
  useChatAutoScroll,
  useInfiniteScrollObserver,
} from '@/hooks/chat';

// Components
import ChatMessage, { type MessageActionType } from './ChatMessage';
import ToolStatusIndicator from './ToolStatusIndicator';
import { ChatProgressIndicator } from './ChatProgressIndicator';
import { ChatAppliedBanner } from './ChatAppliedBanner';
import { ChatStreamingMessage } from './ChatStreamingMessage';
import { ChatLoadingDots } from './ChatLoadingDots';
import { ChatStartButton } from './ChatStartButton';

// ============================================================================
// Sub-components
// ============================================================================

interface FloatingToolStatusProps {
  tools: AIToolStatus[];
}

/**
 * 플로팅 도구 상태
 * AI 응답 메시지 위에 absolute로 배치
 */
function FloatingToolStatus({ tools }: FloatingToolStatusProps) {
  if (tools.length === 0) return null;

  return (
    <div className="absolute left-0 right-0 bottom-full mb-1 ml-11">
      <ToolStatusIndicator tools={tools} />
    </div>
  );
}

// ============================================================================
// Types
// ============================================================================

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  streamingContent?: string;
  /** AI 도구 실행 상태 */
  activeTools?: AIToolStatus[];
  /** Phase 9: 메시지 액션 핸들러 (content_type별 트랜지언트 UI용) */
  onMessageAction?: (action: MessageActionType, messageId: string, value?: string | string[]) => void;
  /** 루틴 적용 중 상태 */
  isApplyingRoutine?: boolean;
  /** 루틴 적용 완료 정보 */
  appliedRoutine?: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress?: RoutineProgressEvent | null;
  /** 대화 시작 대기 상태 */
  pendingStart?: boolean;
  /** 대화 시작 핸들러 */
  onStartConversation?: () => void;
  /** 세션 목적 (workout | coach) */
  sessionPurpose?: SessionPurpose;
  /** 무한스크롤 - 다음 페이지 존재 */
  hasNextPage?: boolean;
  /** 무한스크롤 - 다음 페이지 로딩 중 */
  isFetchingNextPage?: boolean;
  /** 무한스크롤 - 다음 페이지 로드 */
  onLoadMore?: () => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 채팅 메시지 목록 컴포넌트
 *
 * @description
 * SOLID 원칙에 따라 리팩토링된 컴포넌트입니다.
 * - 스크롤 로직: useChatAutoScroll, useInfiniteScrollObserver
 * - 도구 상태: useToolDisplayState
 * - 로딩 상태: useMinimumLoadingTime
 * - 하위 UI: ChatStreamingMessage, ChatRunningToolFeedback, ChatLoadingDots, ChatStartButton
 */
export default function ChatMessageList({
  messages,
  isLoading = false,
  streamingContent,
  activeTools = [],
  onMessageAction,
  isApplyingRoutine = false,
  appliedRoutine,
  routineProgress,
  pendingStart,
  onStartConversation,
  sessionPurpose,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: ChatMessageListProps) {
  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);

  // 추출된 훅들
  const showLoadingSpinner = useMinimumLoadingTime(isFetchingNextPage ?? false);
  const { displayedTools } = useToolDisplayState(
    activeTools,
    streamingContent,
    messages
  );

  useChatAutoScroll(scrollContainerRef, bottomRef, [
    messages,
    streamingContent,
    activeTools,
    routineProgress,
  ]);

  useInfiniteScrollObserver(scrollContainerRef, topSentinelRef, {
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  });

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden p-4"
    >
      <div className="flex flex-col gap-9">
        {/* 상단 센티널 — 이전 메시지 로드 트리거 */}
        <div ref={topSentinelRef} className="shrink-0">
          {showLoadingSpinner && (
            <div className="flex justify-center py-2">
              <SpinnerGapIcon
                size={16}
                className="animate-spin text-muted-foreground"
              />
            </div>
          )}
        </div>

        {/* 메시지 목록 */}
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onAction={onMessageAction}
            isApplyingRoutine={isApplyingRoutine}
          />
        ))}

        {/* AI 응답 영역 - 스트리밍/로딩 중일 때만 */}
        {(streamingContent || isLoading) && (
          <div className="relative">
            <FloatingToolStatus tools={displayedTools} />
            {streamingContent ? (
              <ChatStreamingMessage content={streamingContent} />
            ) : (
              <ChatLoadingDots />
            )}
          </div>
        )}

        {/* Phase 9: profile_confirmation, input_request는 메시지로 렌더링됨
            위의 messages.map()에서 ChatMessage가 contentType별로 렌더링함 */}

        {/* 루틴 생성 진행률 */}
        {routineProgress && (
          <div>
            <ChatProgressIndicator
              progress={routineProgress.progress}
              stage={routineProgress.stage}
              variant="workout"
            />
          </div>
        )}

        {/* Phase 9: routine_preview는 메시지로 렌더링됨
            위의 messages.map()에서 ChatMessage가 contentType별로 렌더링함 */}

        {/* 루틴 적용 완료 메시지 */}
        {appliedRoutine && (
          <ChatAppliedBanner
            type="workout"
            eventsCreated={appliedRoutine.eventsCreated}
            startDate={appliedRoutine.startDate}
          />
        )}

        {/* 대화 시작 버튼 */}
        {pendingStart && onStartConversation && (
          <ChatStartButton
            sessionPurpose={sessionPurpose}
            onStart={onStartConversation}
          />
        )}

        {/* 완료 배너를 위한 하단 여백 */}
        {appliedRoutine && <div className="h-40" aria-hidden="true" />}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
