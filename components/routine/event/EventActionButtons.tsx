'use client';

import Button from '@/components/ui/Button';
import { CheckIcon, SkipForwardIcon, PlayIcon } from '@phosphor-icons/react';
import { EVENT_STATUS } from '@/lib/config/theme';

interface EventActionButtonsProps {
  status: 'scheduled' | 'completed' | 'skipped';
  /** 'start' = 건너뛰기 + 시작하기 (운동), 'default' = 건너뛰기 + 완료하기 (식단 등) */
  mode?: 'default' | 'start';
  onComplete?: () => void;
  onStart?: () => void;
  onSkip: () => void;
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
  mode = 'default',
  onComplete,
  onStart,
  onSkip,
  isLoading = false,
  startDisabled = false,
  hasActiveSession = false,
}: EventActionButtonsProps) {
  if (status !== 'scheduled') {
    const config = EVENT_STATUS[status];
    const StatusIcon = config.icon;

    return (
      <div className="flex gap-3">
        <button
          type="button"
          disabled
          className={`w-full inline-flex items-center justify-center gap-2 rounded-xl font-medium py-3 text-sm ${config.badgeClass} opacity-80 cursor-default`}
        >
          <StatusIcon size={16} weight="bold" />
          {status === 'completed' ? '완료한 루틴이에요' : '건너뛴 루틴이에요'}
        </button>
      </div>
    );
  }

  if (mode === 'start') {
    return (
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onSkip}
          disabled={isLoading}
          className="flex-1"
        >
          <SkipForwardIcon size={16} weight="bold" />
          건너뛰기
        </Button>
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
        variant="outline"
        onClick={onSkip}
        disabled={isLoading}
        className="flex-1"
      >
        <SkipForwardIcon size={16} weight="bold" />
        건너뛰기
      </Button>
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
