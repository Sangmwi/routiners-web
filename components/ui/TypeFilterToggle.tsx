'use client';

import type { EventType } from '@/lib/types/routine';
import SegmentedControl from './SegmentedControl';

export type FilterValue = EventType | 'all';

interface TypeFilterToggleProps {
  /** 현재 선택된 필터 */
  value: FilterValue;
  /** 필터 변경 핸들러 */
  onChange: (type: FilterValue) => void;
  /** sm: 인라인 (기본), md: 독립 배치 */
  size?: 'sm' | 'md';
}

const FILTER_OPTIONS = [
  { key: 'all' as const, label: '전체' },
  { key: 'workout' as const, label: '운동' },
  { key: 'meal' as const, label: '식단' },
];

/**
 * 이벤트 타입 필터 토글 (공용)
 *
 * - 전체 / 운동 / 식단 필터
 * - 내부적으로 SegmentedControl을 사용하여 앱 전체 토글 스타일 통일
 */
export default function TypeFilterToggle({
  value,
  onChange,
  size = 'sm',
}: TypeFilterToggleProps) {
  return (
    <SegmentedControl
      options={FILTER_OPTIONS}
      value={value}
      onChange={onChange}
      size={size}
    />
  );
}
