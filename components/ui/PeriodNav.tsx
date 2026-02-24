'use client';

import { CaretLeftIcon, CaretRightIcon } from '@phosphor-icons/react';

interface PeriodNavProps {
  /** 전체 날짜 라벨 (e.g. "2026년 2월 23일 ~ 3월 1일" or "2026년 2월") */
  label: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  /** 라벨 클릭 시 (날짜 선택 시트 열기) */
  onLabelClick?: () => void;
  labelAriaLabel?: string;
}

/**
 * 통합 기간 네비게이션 — 풀너비 가운데 정렬
 *
 * <     2026년 2월 23일 ~ 3월 1일     >
 */
export default function PeriodNav({
  label,
  onPrev,
  onNext,
  canGoNext,
  onLabelClick,
  labelAriaLabel = '날짜 선택',
}: PeriodNavProps) {
  return (
    <div className="flex items-center justify-between py-3">

      {onLabelClick ? (
        <button
          type="button"
          onClick={onLabelClick}
          aria-label={labelAriaLabel}
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md px-2 py-0.5"
        >
          {label}
        </button>
      ) : (
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="p-1.5 rounded-lg hover:bg-surface-muted transition-colors text-muted-foreground"
          aria-label="이전"
        >
          <CaretLeftIcon size={18} weight="bold" />
        </button>

        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className={`p-1.5 rounded-lg transition-colors ${canGoNext
            ? 'hover:bg-surface-muted text-muted-foreground'
            : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
          aria-label="다음"
        >
          <CaretRightIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
}
