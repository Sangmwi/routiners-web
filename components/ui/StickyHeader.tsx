'use client';

import { ReactNode } from 'react';

interface StickyHeaderProps {
  children: ReactNode;
  /** 추가 클래스 */
  className?: string;
}

/**
 * 반투명 스티키 헤더 래퍼
 *
 * sticky + backdrop-blur + 패딩 컨테이너 내 full-width 확장(-mx-4)을 통합.
 *
 * @example
 * <StickyHeader>
 *   <SegmentedControl ... />
 * </StickyHeader>
 */
export default function StickyHeader({ children, className = '' }: StickyHeaderProps) {
  return (
    <div
      className={`sticky top-0 z-10 bg-surface-glass backdrop-blur-sm px-4 py-2 -mx-4 ${className}`.trim()}
    >
      {children}
    </div>
  );
}
