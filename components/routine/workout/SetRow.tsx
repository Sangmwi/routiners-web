'use client';

import { CheckIcon, ArrowCounterClockwiseIcon, PencilSimpleIcon } from '@phosphor-icons/react';
import type { WorkoutSet } from '@/lib/types/routine';

interface SetRowProps {
  set: WorkoutSet;
  index: number;
  isActive: boolean;
  onComplete: () => void;
  onUndo: () => void;
  onUpdateValue: (
    field: 'actualReps' | 'actualWeight',
    value: number | undefined
  ) => void;
  /** 탭하여 WheelPicker 열기 */
  onTapToEdit: () => void;
}

/**
 * 세트 행 컴포넌트
 *
 * 상태별 UI:
 * - 대기: muted, 탭하여 값 수정 가능
 * - 활성: ring 강조, 탭하여 값 수정 + 완료 버튼
 * - 완료: primary 배경, 체크 아이콘, 탭하여 값 재수정
 */
export default function SetRow({
  set,
  index,
  isActive,
  onComplete,
  onUndo,
  onTapToEdit,
}: SetRowProps) {
  const isCompleted = !!set.completed;

  const displayWeight = set.actualWeight ?? set.targetWeight ?? 0;
  const displayReps = set.actualReps ?? set.targetReps;

  // 완료 상태
  if (isCompleted) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-surface-accent px-4 py-3">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <CheckIcon size={16} weight="bold" className="text-primary-foreground" />
        </div>
        <button className="flex-1 text-left" onClick={onTapToEdit}>
          <span className="text-sm font-medium text-foreground">
            {index + 1}세트
          </span>
          <span className="text-sm text-primary ml-2">
            {displayWeight}kg × {displayReps}회
          </span>
        </button>
        <button
          onClick={onUndo}
          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="세트 완료 취소"
        >
          <ArrowCounterClockwiseIcon size={16} weight="bold" />
        </button>
      </div>
    );
  }

  // 활성 상태 (현재 수행할 세트)
  if (isActive) {
    return (
      <div className="rounded-xl bg-card ring-2 ring-accent px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground">
            {index + 1}세트
          </span>
          <span className="text-xs text-muted-foreground">
            목표: {set.targetWeight ?? 0}kg × {set.targetReps}회
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* 탭하여 값 수정 */}
          <button
            onClick={onTapToEdit}
            className="flex-1 h-10 px-3 flex items-center justify-center gap-2 text-sm font-medium bg-surface-hover border border-border rounded-lg active:bg-surface-muted transition-colors"
          >
            <span className="tabular-nums">{displayWeight}kg</span>
            <span className="text-muted-foreground">×</span>
            <span className="tabular-nums">{displayReps}회</span>
            <PencilSimpleIcon size={14} className="text-muted-foreground ml-1" />
          </button>

          {/* 완료 버튼 */}
          <button
            onClick={onComplete}
            className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center active:scale-95 transition-transform"
            aria-label="세트 완료"
          >
            <CheckIcon size={18} weight="bold" />
          </button>
        </div>
      </div>
    );
  }

  // 대기 상태 (탭 가능)
  return (
    <button
      onClick={onTapToEdit}
      className="w-full flex items-center gap-3 rounded-xl bg-surface-secondary px-4 py-3 text-left active:bg-surface-hover transition-colors"
    >
      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
        <span className="text-xs font-bold text-muted-foreground">{index + 1}</span>
      </div>
      <div className="flex-1">
        <span className="text-sm text-muted-foreground">
          {displayWeight}kg × {displayReps}회
        </span>
      </div>
      <PencilSimpleIcon size={14} className="text-muted-foreground/50" />
    </button>
  );
}
