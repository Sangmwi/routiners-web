'use client';

import Button from '@/components/ui/Button';
import { CheckIcon, SkipForwardIcon, ArrowCounterClockwiseIcon } from '@phosphor-icons/react';

interface EventActionButtonsProps {
  status: 'scheduled' | 'completed' | 'skipped';
  onComplete: () => void;
  onSkip: () => void;
  isLoading?: boolean;
}

/**
 * 이벤트 액션 버튼 그룹
 */
export default function EventActionButtons({
  status,
  onComplete,
  onSkip,
  isLoading = false,
}: EventActionButtonsProps) {
  // 완료/건너뜀 상태면 되돌리기 버튼만 표시 (MVP에서는 미구현)
  if (status !== 'scheduled') {
    return (
      <div className="flex gap-3">
        <Button variant="outline" fullWidth disabled>
          <ArrowCounterClockwiseIcon size={16} weight="bold" />
          상태 변경 불가
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
