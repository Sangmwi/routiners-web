'use client';

import Button from '@/components/ui/Button';
import { ArrowCounterClockwiseIcon, CheckIcon, PlayIcon } from '@phosphor-icons/react';
import { EVENT_STATUS, getDisplayStatus } from '@/lib/config/theme';
import type { EventStatus } from '@/lib/types/routine';

interface EventActionButtonsProps {
  status: EventStatus;
  date: string;
  /** 'start' = 시작하기 (운동), 'default' = 완료하기 (식단 등) */
  mode?: 'default' | 'start';
  onComplete?: () => void;
  onUncomplete?: () => void;
  onStart?: () => void;
  isLoading?: boolean;
  /** 시작 버튼 비활성화 (오늘 날짜가 아닐 때) */
  startDisabled?: boolean;
  /** 진행 중 세션이 있는지 (이어하기 표시) */
  hasActiveSession?: boolean;
}

/**
 * 이벤트 액션 버튼 그룹
 */
export default function EventActionButtons({
  status,
  date,
  mode = 'default',
  onComplete,
  onUncomplete,
  onStart,
  isLoading = false,
  startDisabled = false,
  hasActiveSession = false,
}: EventActionButtonsProps) {
  const displayStatus = getDisplayStatus(status, date);

  // 완료 → 상태 표시 + 되돌리기 버튼
  if (displayStatus === 'completed') {
    const config = EVENT_STATUS.completed;
    const StatusIcon = config.icon;

    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium py-3 text-sm ${config.badgeClass} opacity-80 cursor-default`}
        >
          <StatusIcon size={16} weight="bold" />
          완료한 루틴이에요
        </button>
        {onUncomplete && (
          <button
            type="button"
            onClick={onUncomplete}
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium py-3 text-sm text-muted-foreground hover:bg-muted/30 transition-colors"
          >
            <ArrowCounterClockwiseIcon size={14} weight="bold" />
            되돌리기
          </button>
        )}
      </div>
    );
  }

  // 미완료 → 상태 표시 + 완료하기 버튼
  if (displayStatus === 'incomplete') {
    const config = EVENT_STATUS.incomplete;
    const StatusIcon = config.icon;

    return (
      <div className="space-y-2">
        <button
          type="button"
          disabled
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium py-3 text-sm ${config.badgeClass} opacity-80 cursor-default`}
        >
          <StatusIcon size={16} weight="bold" />
          미완료 루틴이에요
        </button>
        {onComplete && (
          <Button
            variant="primary"
            onClick={onComplete}
            isLoading={isLoading}
            className="w-full"
          >
            <CheckIcon size={16} weight="bold" />
            완료하기
          </Button>
        )}
      </div>
    );
  }

  // scheduled (오늘/미래) → 액션 버튼
  if (mode === 'start') {
    return (
      <div className="flex gap-3">
        <Button
          variant="primary"
          onClick={onStart}
          isLoading={isLoading}
          disabled={startDisabled}
          className="flex-1"
        >
          <PlayIcon size={16} weight="fill" />
          {hasActiveSession ? '이어하기' : '시작하기'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Button
        variant="primary"
        onClick={onComplete}
        isLoading={isLoading}
        className="flex-1"
      >
        <CheckIcon size={16} weight="bold" />
        완료하기
      </Button>
    </div>
  );
}
