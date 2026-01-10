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
import { Loader2, CheckCircle, Utensils } from 'lucide-react';

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

        {/* 로딩 인디케이터 */}
        {isLoading && !streamingContent && !pendingInput && !pendingProfileConfirmation && (
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
          <div className="flex gap-3 items-start my-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-2">
                루틴 생성 중... {routineProgress.progress}%
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${routineProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {routineProgress.stage}
              </p>
            </div>
          </div>
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
          <div className="flex gap-3 items-start my-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl rounded-tl-md px-4 py-3">
              <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                루틴이 적용되었습니다!
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {appliedRoutine.eventsCreated}개의 운동이 {appliedRoutine.startDate}부터 시작됩니다.
              </p>
            </div>
          </div>
        )}

        {/* 식단 생성 진행률 */}
        {mealProgress && !pendingMealPreview && (
          <div className="flex gap-3 items-start my-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-lime-500 text-white flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex-1 bg-card border border-border rounded-2xl rounded-tl-md px-4 py-3">
              <p className="text-sm font-medium text-foreground mb-2">
                식단 생성 중... {mealProgress.progress}%
              </p>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-lime-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${mealProgress.progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {mealProgress.stage}
              </p>
            </div>
          </div>
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
          <div className="flex gap-3 items-start my-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-lime-500 text-white flex items-center justify-center">
              <Utensils className="w-4 h-4" />
            </div>
            <div className="bg-lime-50 dark:bg-lime-900/20 border border-lime-200 dark:border-lime-800 rounded-2xl rounded-tl-md px-4 py-3">
              <p className="text-sm text-lime-800 dark:text-lime-200 font-medium">
                식단이 적용되었습니다!
              </p>
              <p className="text-xs text-lime-600 dark:text-lime-400 mt-1">
                {appliedMealPlan.eventsCreated}일 분의 식단이 {appliedMealPlan.startDate}부터 시작됩니다.
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
