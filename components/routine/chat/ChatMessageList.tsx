'use client';

import { useRef } from 'react';
import { ChatMessage as ChatMessageType, ProfileConfirmationRequest } from '@/lib/types/chat';
import { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
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
import ChatMessage from './ChatMessage';
import ToolStatusIndicator from './ToolStatusIndicator';
import ChatInputRequest from './ChatInputRequest';
import ChatPreviewSummary from './ChatPreviewSummary';
import { ChatProfileConfirmation } from './ChatProfileConfirmation';
import { ChatProgressIndicator } from './ChatProgressIndicator';
import { ChatAppliedBanner } from './ChatAppliedBanner';
import { ChatStreamingMessage } from './ChatStreamingMessage';
import { ChatRunningToolFeedback } from './ChatRunningToolFeedback';
import { ChatLoadingDots } from './ChatLoadingDots';
import { ChatStartButton } from './ChatStartButton';

// ============================================================================
// Types
// ============================================================================

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  streamingContent?: string;
  /** AI 도구 실행 상태 */
  activeTools?: AIToolStatus[];
  /** 사용자 입력 대기 중인 요청 */
  pendingInput?: InputRequest | null;
  /** 선택형 입력 제출 핸들러 */
  onSubmitInput?: (value: string | string[]) => void;
  /** 대기 중인 루틴 미리보기 */
  pendingRoutinePreview?: RoutinePreviewData | null;
  /** 루틴 적용 완료 정보 */
  appliedRoutine?: RoutineAppliedEvent | null;
  /** 루틴 생성 진행률 */
  routineProgress?: RoutineProgressEvent | null;
  /** 루틴 적용 핸들러 (forceOverwrite: 충돌 시 덮어쓰기) */
  onApplyRoutine?: (forceOverwrite?: boolean) => void;
  /** 루틴 생성 취소 핸들러 */
  onCancelRoutine?: () => void;
  /** 루틴 상세 보기 핸들러 */
  onViewRoutineDetails?: () => void;
  /** 대기 중인 프로필 확인 요청 */
  pendingProfileConfirmation?: ProfileConfirmationRequest | null;
  /** 프로필 확인 핸들러 */
  onConfirmProfile?: () => void;
  /** 프로필 수정 요청 핸들러 */
  onRequestProfileEdit?: () => void;
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
  pendingInput,
  onSubmitInput,
  pendingRoutinePreview,
  appliedRoutine,
  routineProgress,
  onApplyRoutine,
  onCancelRoutine,
  onViewRoutineDetails,
  pendingProfileConfirmation,
  onConfirmProfile,
  onRequestProfileEdit,
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
  const { displayedTools, toolsFadingOut } = useToolDisplayState(
    activeTools,
    streamingContent,
    messages
  );

  useChatAutoScroll(scrollContainerRef, bottomRef, [
    messages,
    streamingContent,
    activeTools,
    pendingInput,
    pendingRoutinePreview,
    routineProgress,
  ]);

  useInfiniteScrollObserver(scrollContainerRef, topSentinelRef, {
    hasNextPage,
    isFetchingNextPage,
    onLoadMore,
  });

  // 파생 상태
  const lastUserMessageIndex = messages.reduce(
    (lastIndex, msg, index) => (msg.role === 'user' ? index : lastIndex),
    -1
  );

  const runningTool = activeTools.find(
    (t) => t.status === 'running' && t.name !== 'generate_routine_preview'
  );

  const showRunningToolFeedback =
    runningTool &&
    !streamingContent &&
    !pendingInput &&
    !pendingProfileConfirmation;

  const showLoadingDots =
    isLoading &&
    !streamingContent &&
    !pendingInput &&
    !pendingProfileConfirmation &&
    !activeTools.some((t) => t.status === 'running');

  return (
    <div
      ref={scrollContainerRef}
      className="h-full overflow-y-auto overflow-x-hidden p-4"
    >
      <div className="flex flex-col gap-7">
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
        {messages.map((message, index) => {
          const isLastUserMessage = index === lastUserMessageIndex;
          const showTools = isLastUserMessage && displayedTools.length > 0;

          return (
            <div
              key={message.id}
              className={isLastUserMessage ? 'relative' : undefined}
            >
              <ChatMessage message={message} />

              {/* 마지막 사용자 메시지 바로 다음에 도구 상태 표시 */}
              {showTools && (
                <div
                  className={`absolute left-10 bottom-1 translate-y-full pt-1.5 transition-opacity duration-700 ${
                    toolsFadingOut ? 'opacity-0' : 'opacity-100'
                  }`}
                >
                  <ToolStatusIndicator tools={displayedTools} />
                </div>
              )}
            </div>
          );
        })}

        {/* 스트리밍 중인 메시지 */}
        {streamingContent && <ChatStreamingMessage content={streamingContent} />}

        {/* 도구 실행 중 피드백 */}
        {showRunningToolFeedback && <ChatRunningToolFeedback tool={runningTool} />}

        {/* 로딩 인디케이터 */}
        {showLoadingDots && <ChatLoadingDots />}

        {/* 선택형 입력 UI */}
        {pendingInput && onSubmitInput && (
          <ChatInputRequest request={pendingInput} onSubmit={onSubmitInput} />
        )}

        {/* 프로필 확인 UI */}
        {pendingProfileConfirmation && onConfirmProfile && onRequestProfileEdit && (
          <div>
            <ChatProfileConfirmation
              request={pendingProfileConfirmation}
              onConfirm={onConfirmProfile}
              onEdit={onRequestProfileEdit}
              disabled={isLoading}
            />
          </div>
        )}

        {/* 루틴 생성 진행률 */}
        {routineProgress && !pendingRoutinePreview && (
          <div>
            <ChatProgressIndicator
              progress={routineProgress.progress}
              stage={routineProgress.stage}
              variant="workout"
            />
          </div>
        )}

        {/* 루틴 미리보기 - 요약 카드 */}
        {pendingRoutinePreview &&
          onApplyRoutine &&
          onCancelRoutine &&
          onViewRoutineDetails && (
            <div>
              <ChatPreviewSummary
                type="routine"
                title={pendingRoutinePreview.title}
                description={pendingRoutinePreview.description}
                stats={{
                  duration: `${pendingRoutinePreview.durationWeeks}주`,
                  frequency: `주 ${pendingRoutinePreview.daysPerWeek}회`,
                  perSession: pendingRoutinePreview.weeks[0]?.days[0]
                    ?.estimatedDuration
                    ? `약 ${pendingRoutinePreview.weeks[0].days[0].estimatedDuration}분`
                    : undefined,
                }}
                weekSummaries={pendingRoutinePreview.weeks.map((w) =>
                  w.days.map((d) => d.title).join(', ')
                )}
                hasConflicts={(pendingRoutinePreview.conflicts?.length ?? 0) > 0}
                onViewDetails={onViewRoutineDetails}
                onCancel={onCancelRoutine}
                onApply={onApplyRoutine}
                isApplying={isLoading}
              />
            </div>
          )}

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
