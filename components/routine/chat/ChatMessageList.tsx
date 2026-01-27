'use client';

import { useRef, useEffect, useLayoutEffect, useState } from 'react';
import { ChatMessage as ChatMessageType, ProfileConfirmationRequest } from '@/lib/types/chat';
import { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import {
  RoutineAppliedEvent,
  RoutineProgressEvent,
} from '@/lib/api/conversation';
import ChatMessage from './ChatMessage';
import ToolStatusIndicator from './ToolStatusIndicator';
import ChatInputRequest from './ChatInputRequest';
import ChatPreviewSummary from './ChatPreviewSummary';
import { ChatProfileConfirmation } from './ChatProfileConfirmation';
import { ChatProgressIndicator } from './ChatProgressIndicator';
import { ChatAppliedBanner } from './ChatAppliedBanner';
import { SpinnerGapIcon, PlayIcon } from '@phosphor-icons/react';
import { AI_TOOL_LABELS } from '@/lib/types/fitness';
import { SessionPurpose } from '@/lib/types/routine';

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
  /** 루틴 수정 요청 핸들러 */
  onRequestRevision?: (feedback: string) => void;
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

/**
 * 채팅 메시지 목록 컴포넌트
 *
 * 도구 상태는 마지막 사용자 메시지 바로 다음에 표시됩니다.
 * 결과는 사라지지 않고 영구 표시됩니다.
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
  onRequestRevision,
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const hasInitialScrolled = useRef(false);

  // 도구 상태 누적 (사라지지 않고 유지)
  const [toolHistory, setToolHistory] = useState<AIToolStatus[]>([]);

  // activeTools 변경 시 누적
  useEffect(() => {
    if (activeTools.length > 0) {
      setToolHistory((prev) => {
        // 새 도구 추가 또는 기존 도구 상태 업데이트
        const newTools = [...prev];
        for (const tool of activeTools) {
          const existingIndex = newTools.findIndex(
            (t) => t.toolCallId === tool.toolCallId
          );
          if (existingIndex >= 0) {
            newTools[existingIndex] = tool;
          } else {
            newTools.push(tool);
          }
        }
        return newTools;
      });
    }
  }, [activeTools]);

  // 새 사용자 메시지가 추가되면 도구 히스토리 초기화
  const lastUserMessageId = messages.filter((m) => m.role === 'user').pop()?.id;
  useEffect(() => {
    setToolHistory([]);
  }, [lastUserMessageId]);

  // 새 메시지가 추가되면 스크롤 (이전 메시지 로드 시에는 스킵)
  useEffect(() => {
    // 최초 렌더: 하단으로 즉시 스크롤
    if (!hasInitialScrolled.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView();
      hasInitialScrolled.current = true;
      return;
    }

    // 이후 업데이트: 하단 근처일 때만 자동 스크롤
    const container = scrollContainerRef.current;
    if (!container) return;

    const isNearBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight < 150;
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent, activeTools, pendingInput, pendingRoutinePreview, routineProgress]);

  // 이전 메시지 로드를 위한 IntersectionObserver
  useEffect(() => {
    if (!hasNextPage || !onLoadMore) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) {
          const container = scrollContainerRef.current;
          if (container) {
            prevScrollHeightRef.current = container.scrollHeight;
          }
          onLoadMore();
        }
      },
      { root: scrollContainerRef.current, threshold: 0.1 },
    );

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, onLoadMore]);

  // 이전 메시지 로드 후 스크롤 위치 복원
  useLayoutEffect(() => {
    if (!isFetchingNextPage && prevScrollHeightRef.current > 0) {
      const container = scrollContainerRef.current;
      if (container) {
        const newScrollHeight = container.scrollHeight;
        container.scrollTop += newScrollHeight - prevScrollHeightRef.current;
      }
      prevScrollHeightRef.current = 0;
    }
  }, [isFetchingNextPage, messages]);

  // 마지막 사용자 메시지의 인덱스 찾기
  const lastUserMessageIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.role === 'user' ? index : lastIndex;
  }, -1);

  return (
    <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-hidden p-4">
      <div className="flex flex-col gap-5">
        {/* 상단 센티널 — 이전 메시지 로드 트리거 */}
        <div ref={topSentinelRef} className="shrink-0">
          {isFetchingNextPage && (
            <div className="flex justify-center py-2">
              <SpinnerGapIcon size={16} className="animate-spin text-muted-foreground" />
            </div>
          )}
        </div>

        {messages.map((message, index) => (
          <div key={message.id}>
            <ChatMessage message={message} />

            {/* 마지막 사용자 메시지 바로 다음에 도구 상태 표시 */}
            {index === lastUserMessageIndex && toolHistory.length > 0 && (
              <div className="mt-6 ml-2">
                <ToolStatusIndicator tools={toolHistory} />
              </div>
            )}
          </div>
        ))}

        {/* 스트리밍 중인 메시지 */}
        {streamingContent && (
          <div>
            <ChatMessage
              message={{
                id: 'streaming',
                role: 'assistant',
                content: streamingContent,
                createdAt: new Date().toISOString(),
              }}
            />
          </div>
        )}

        {/* 도구 실행 중 피드백 (프로필 조회중 등) */}
        {(() => {
          const runningTool = activeTools.find((t) => t.status === 'running');
          if (!runningTool || streamingContent || pendingInput || pendingProfileConfirmation) return null;
          // 미리보기 생성 도구는 진행률 표시로 대체되므로 제외
          if (runningTool.name === 'generate_routine_preview') return null;

          const toolLabel = AI_TOOL_LABELS[runningTool.name] || '처리 중';
          return (
            <div className="flex gap-3 items-center">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <SpinnerGapIcon size={16} className="animate-spin" />
              </div>
              <div className="text-sm text-muted-foreground">
                {toolLabel}...
              </div>
            </div>
          );
        })()}

        {/* 로딩 인디케이터 (도구 실행 중이 아닐 때만 표시) */}
        {isLoading && !streamingContent && !pendingInput && !pendingProfileConfirmation &&
         !activeTools.some((t) => t.status === 'running') && (
          <div className="flex gap-3">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <SpinnerGapIcon size={16} className="animate-spin" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* 선택형 입력 UI (서버 메시지에 AI 질문이 이미 포함되므로 선택 버튼만 렌더링) */}
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
        {pendingRoutinePreview && onApplyRoutine && onRequestRevision && onViewRoutineDetails && (
          <div>
            <ChatPreviewSummary
              type="routine"
              title={pendingRoutinePreview.title}
              description={pendingRoutinePreview.description}
              stats={{
                duration: `${pendingRoutinePreview.durationWeeks}주`,
                frequency: `주 ${pendingRoutinePreview.daysPerWeek}회`,
                perSession: pendingRoutinePreview.weeks[0]?.days[0]?.estimatedDuration
                  ? `약 ${pendingRoutinePreview.weeks[0].days[0].estimatedDuration}분`
                  : undefined,
              }}
              weekSummaries={pendingRoutinePreview.weeks.map(w =>
                w.days.map(d => d.title).join(', ')
              )}
              hasConflicts={(pendingRoutinePreview.conflicts?.length ?? 0) > 0}
              onViewDetails={onViewRoutineDetails}
              onRevision={onRequestRevision}
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

        {/* 대화 시작 버튼 (인라인) */}
        {pendingStart && onStartConversation && (
          <div className="flex gap-3 items-start">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <PlayIcon size={16} weight="fill" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm text-muted-foreground mb-3">
                {sessionPurpose === 'coach'
                  ? '무엇이든 물어볼 준비가 되셨나요?'
                  : '맞춤 운동 루틴을 만들 준비가 되셨나요?'}
              </p>
              <button
                type="button"
                onClick={onStartConversation}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <PlayIcon size={16} weight="fill" />
                시작하기
              </button>
            </div>
          </div>
        )}

        {/* 완료 배너를 위한 하단 여백 */}
        {appliedRoutine && (
          <div className="h-40" aria-hidden="true" />
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
