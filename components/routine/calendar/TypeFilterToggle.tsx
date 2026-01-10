'use client';

import type { EventType } from '@/lib/types/routine';

type FilterValue = EventType | 'all';

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
 * 캘린더 타입 필터 토글
 *
 * - 전체 / 운동 / 식단 필터
 * - URL 파라미터와 연동
 */
export default function TypeFilterToggle({
  value,
  onChange,
}: TypeFilterToggleProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {filterOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`
              flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all
              ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }
            `}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
