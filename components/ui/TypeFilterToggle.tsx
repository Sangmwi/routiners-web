'use client';

import type { EventType } from '@/lib/types/routine';

export type FilterValue = EventType | 'all';

interface TypeFilterToggleProps {
  /** 현재 선택된 필터 */
  value: FilterValue;
  /** 필터 변경 핸들러 */
  onChange: (type: FilterValue) => void;
}

const filterOptions: { value: FilterValue; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'workout', label: '운동' },
  { value: 'meal', label: '식단' },
];

/**
 * 이벤트 타입 필터 토글 (공용)
 *
 * - 전체 / 운동 / 식단 필터
 * - 캘린더, 다가오는 루틴 등에서 공유
 */
export default function TypeFilterToggle({
  value,
  onChange,
}: TypeFilterToggleProps) {
  return (
    <div className="flex gap-2">
      {filterOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
            value === option.value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
