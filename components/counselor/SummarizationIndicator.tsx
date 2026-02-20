'use client';

import { CheckCircleIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import type { SummarizationState } from '@/lib/types/counselor';

interface SummarizationIndicatorProps {
  state: SummarizationState;
}

/**
 * 컨텍스트 요약 상태 표시
 *
 * Claude Code 스타일의 요약 진행 상태 표시
 * - 요약 중: 스피너 + 메시지
 * - 완료: 체크 아이콘 + 완료 메시지
 */
export default function SummarizationIndicator({
  state,
}: SummarizationIndicatorProps) {
  if (!state.isSummarizing) return null;

  const isComplete = state.message?.includes('완료');

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 border-t border-border">
      {isComplete ? (
        <CheckCircleIcon size={16} weight="fill" className="text-success" />
      ) : (
        <LoadingSpinner size="sm" />
      )}
      <span className="text-sm text-muted-foreground">
        {state.message || '이전 대화를 정리하고 있어요...'}
      </span>
    </div>
  );
}
