'use client';

import { type ReactNode, type ButtonHTMLAttributes } from 'react';

// ============================================================================
// Types
// ============================================================================

interface ChipButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  selected?: boolean;
  children: ReactNode;
  /** sm: px-3 py-1.5 | md: px-3.5 py-2 */
  size?: 'sm' | 'md';
}

// ============================================================================
// Styles
// ============================================================================

const BASE =
  'text-xs font-medium rounded-full whitespace-nowrap transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed';

const SIZE = {
  sm: 'px-3 py-1.5',
  md: 'px-3.5 py-2',
} as const;

const STATE = {
  active: 'bg-primary text-primary-foreground',
  inactive: 'bg-surface-muted text-muted-foreground hover:bg-muted',
} as const;

// ============================================================================
// Component
// ============================================================================

/**
 * 필터 칩 / 토글 pill 공통 버튼
 *
 * 시트, 커뮤니티, 드로어 등 도메인 횡단적으로 사용되는
 * 작은 rounded-full 토글 버튼의 표준 컴포넌트.
 *
 * @example
 * <ChipButton selected={category === 'all'} onClick={() => set('all')}>
 *   전체
 * </ChipButton>
 *
 * @example — active 색상 오버라이드
 * <ChipButton
 *   selected={isActive}
 *   className={isActive ? 'bg-foreground/10 text-foreground' : ''}
 *   onClick={toggle}
 * >
 *   자유
 * </ChipButton>
 */
export default function ChipButton({
  selected = false,
  size = 'sm',
  className = '',
  children,
  ...rest
}: ChipButtonProps) {
  return (
    <button
      type="button"
      className={`${BASE} ${SIZE[size]} ${selected ? STATE.active : STATE.inactive} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
