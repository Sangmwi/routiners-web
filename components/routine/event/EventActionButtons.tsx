'use client';

import Button from '@/components/ui/Button';
import { ArrowCounterClockwiseIcon, CheckIcon, PlayIcon } from '@phosphor-icons/react';
import { getDisplayStatus } from '@/lib/config/theme';
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

  // 완료 → 되돌리기 버튼
  if (displayStatus === 'completed') {
    return (
      <div className="flex gap-3">
        {onUncomplete && (
          <Button
            variant="outline"
            size="lg"
            onClick={onUncomplete}
            isLoading={isLoading}
            className="flex-1"
          >
            <ArrowCounterClockwiseIcon size={16} weight="bold" />
            되돌리기
          </Button>
        )}
      </div>
    );
  }

  // 미완료 → 완료하기 버튼
  if (displayStatus === 'incomplete') {
    return (
      <div className="flex gap-3">
        {onComplete && (
          <Button
            variant="primary"
            size="lg"
            onClick={onComplete}
            isLoading={isLoading}
            className="flex-1"
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
          size="lg"
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
        size="lg"
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
