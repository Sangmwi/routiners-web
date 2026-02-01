'use client';

import { SpinnerGapIcon } from '@phosphor-icons/react';
import { AI_TOOL_LABELS, type AIToolStatus } from '@/lib/types/fitness';

interface ChatRunningToolFeedbackProps {
  tool: AIToolStatus;
}

/**
 * 실행 중인 AI 도구 피드백 표시
 *
 * @description
 * AI가 도구(프로필 조회 등)를 실행 중일 때 사용자에게 피드백을 제공합니다.
 */
export function ChatRunningToolFeedback({ tool }: ChatRunningToolFeedbackProps) {
  const toolLabel = AI_TOOL_LABELS[tool.name] || '처리 중';

  return (
    <div className="flex gap-3 items-center">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
        <SpinnerGapIcon size={16} className="animate-spin" />
      </div>
      <div className="text-sm text-muted-foreground">{toolLabel}...</div>
    </div>
  );
}
