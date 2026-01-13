'use client';

import { useRef, useEffect, useState } from 'react';
import { ChatMessage as ChatMessageType, ProfileConfirmationRequest } from '@/lib/types/chat';
import { AIToolStatus, InputRequest, RoutinePreviewData } from '@/lib/types/fitness';
import { MealPlanPreviewData } from '@/lib/types/meal';
import {
  RoutineAppliedEvent,
  RoutineProgressEvent,
  MealPlanAppliedEvent,
  MealPlanProgressEvent,
} from '@/lib/api/conversation';
import ChatMessage from './ChatMessage';
import ToolStatusIndicator from './ToolStatusIndicator';
import ChatInputRequest from './ChatInputRequest';
import ChatRoutinePreview from './ChatRoutinePreview';
import ChatMealPreview from './ChatMealPreview';
import { ChatProfileConfirmation } from './ChatProfileConfirmation';
import { ChatProgressIndicator } from './ChatProgressIndicator';
import { ChatAppliedBanner } from './ChatAppliedBanner';
import { Loader2, Play } from 'lucide-react';
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
  /** 루틴 적용 핸들러 */
  onApplyRoutine?: () => void;
  /** 루틴 수정 요청 핸들러 */
  onRequestRevision?: (feedback: string) => void;
  /** 대기 중인 식단 미리보기 */
  pendingMealPreview?: MealPlanPreviewData | null;
  /** 식단 적용 완료 정보 */
  appliedMealPlan?: MealPlanAppliedEvent | null;
  /** 식단 생성 진행률 */
  mealProgress?: MealPlanProgressEvent | null;
  /** 식단 적용 핸들러 */
  onApplyMealPlan?: (forceOverwrite?: boolean) => void;
  /** 식단 수정 요청 핸들러 */
  onRequestMealRevision?: (feedback: string) => void;
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
  /** 세션 목적 (workout | meal) */
  sessionPurpose?: SessionPurpose;
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
  pendingMealPreview,
  appliedMealPlan,
  mealProgress,
  onApplyMealPlan,
  onRequestMealRevision,
  pendingProfileConfirmation,
  onConfirmProfile,
  onRequestProfileEdit,
  pendingStart,
  onStartConversation,
  sessionPurpose,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

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

  // 새 메시지가 추가되면 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent, activeTools, pendingInput, pendingRoutinePreview, routineProgress, pendingMealPreview, mealProgress]);

  // 마지막 사용자 메시지의 인덱스 찾기
  const lastUserMessageIndex = messages.reduce((lastIndex, msg, index) => {
    return msg.role === 'user' ? index : lastIndex;
  }, -1);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      <div className="flex flex-col gap-4">
        {messages.map((message, index) => (
          <div key={message.id}>
            <ChatMessage message={message} />

            {/* 마지막 사용자 메시지 바로 다음에 도구 상태 표시 */}
            {index === lastUserMessageIndex && toolHistory.length > 0 && (
              <div className="mt-2 ml-1">
                <ToolStatusIndicator tools={toolHistory} />
              </div>
            )}
          </div>
        ))}

        {/* 스트리밍 중인 메시지 */}
        {streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date().toISOString(),
            }}
          />
        )}

        {/* 도구 실행 중 피드백 (프로필 조회중 등) */}
        {(() => {
          const runningTool = activeTools.find((t) => t.status === 'running');
          if (!runningTool || streamingContent || pendingInput || pendingProfileConfirmation) return null;
          // 미리보기 생성 도구는 진행률 표시로 대체되므로 제외
          if (runningTool.name === 'generate_routine_preview' || runningTool.name === 'generate_meal_plan_preview') return null;

          const toolLabel = AI_TOOL_LABELS[runningTool.name] || '처리 중';
          return (
            <div className="flex gap-3 items-center">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin" />
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
              <Loader2 className="w-4 h-4 animate-spin" />
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

        {/* 선택형 입력 UI (AI 메시지 + 버튼) */}
        {pendingInput && onSubmitInput && (
          <>
            {/* AI 질문 메시지 */}
            {pendingInput.message && (
              <ChatMessage
                message={{
                  id: `input-request-message-${pendingInput.id}`,
                  role: 'assistant',
                  content: pendingInput.message,
                  createdAt: new Date().toISOString(),
                }}
              />
            )}
            {/* 선택 버튼 UI */}
            <ChatInputRequest request={pendingInput} onSubmit={onSubmitInput} />
          </>
        )}

        {/* 프로필 확인 UI */}
        {pendingProfileConfirmation && onConfirmProfile && onRequestProfileEdit && (
          <ChatProfileConfirmation
            request={pendingProfileConfirmation}
            onConfirm={onConfirmProfile}
            onEdit={onRequestProfileEdit}
            disabled={isLoading}
          />
        )}

        {/* 루틴 생성 진행률 */}
        {routineProgress && !pendingRoutinePreview && (
          <ChatProgressIndicator
            progress={routineProgress.progress}
            stage={routineProgress.stage}
            variant="workout"
          />
        )}

        {/* 루틴 미리보기 */}
        {pendingRoutinePreview && onApplyRoutine && onRequestRevision && (
          <ChatRoutinePreview
            preview={pendingRoutinePreview}
            onApply={onApplyRoutine}
            onRequestRevision={onRequestRevision}
            isApplying={isLoading}
          />
        )}

        {/* 루틴 적용 완료 메시지 */}
        {appliedRoutine && (
          <ChatAppliedBanner
            type="workout"
            eventsCreated={appliedRoutine.eventsCreated}
            startDate={appliedRoutine.startDate}
          />
        )}

        {/* 식단 생성 진행률 */}
        {mealProgress && !pendingMealPreview && (
          <ChatProgressIndicator
            progress={mealProgress.progress}
            stage={mealProgress.stage}
            variant="meal"
          />
        )}

        {/* 식단 미리보기 */}
        {pendingMealPreview && onApplyMealPlan && onRequestMealRevision && (
          <ChatMealPreview
            preview={pendingMealPreview}
            onApply={onApplyMealPlan}
            onRequestRevision={onRequestMealRevision}
            isApplying={isLoading}
          />
        )}

        {/* 식단 적용 완료 메시지 */}
        {appliedMealPlan && (
          <ChatAppliedBanner
            type="meal"
            eventsCreated={appliedMealPlan.eventsCreated}
            startDate={appliedMealPlan.startDate}
          />
        )}

        {/* 대화 시작 버튼 (인라인) */}
        {pendingStart && onStartConversation && (
          <div className="flex gap-3 items-start my-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Play className="w-4 h-4" />
            </div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3 max-w-[85%]">
              <p className="text-sm text-muted-foreground mb-3">
                {sessionPurpose === 'meal'
                  ? '맞춤 식단을 만들 준비가 되셨나요?'
                  : '맞춤 운동 루틴을 만들 준비가 되셨나요?'}
              </p>
              <button
                type="button"
                onClick={onStartConversation}
                className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                시작하기
              </button>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
