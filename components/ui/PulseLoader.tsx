'use client';

import { HTMLAttributes } from 'react';

// ============================================================================
// Types
// ============================================================================

interface PulseLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 메인 바 개수 (기본: 3) */
  bars?: number;
}

// ============================================================================
// Component
// ============================================================================

/**
 * 펄스 로딩 컴포넌트
 *
 * 추상적이고 범용적인 로딩 UI
 * - 상단에 작은 요소들로 시각적 흥미 추가
 * - ease-in-out 펄스 애니메이션
 * - 시간차(stagger)로 파도처럼 보이는 효과
 * - prefers-reduced-motion 시 애니메이션 비활성화
 *
 * @example
 * <PulseLoader />
 * <PulseLoader bars={4} />
 */
export function PulseLoader({
  bars = 3,
  className = '',
  ...props
}: PulseLoaderProps) {
  return (
    <div
      className={`flex flex-col items-start justify-center ${className}`}
      {...props}
    >
      {/* 상단 작은 요소들 */}
      <div className="flex flex-col gap-3 mb-8 w-full">
        <div
          className="pulse-bar rounded-xl"
          style={{
            width: '45%',
            height: 'clamp(32px, 6vh, 48px)',
            animationDelay: '0ms',
          }}
        />
        <div
          className="pulse-bar rounded-xl"
          style={{
            width: '30%',
            height: 'clamp(24px, 4vh, 36px)',
            animationDelay: '60ms',
          }}
        />
      </div>

      {/* 메인 풀 너비 바들 */}
      <div className="flex flex-col gap-4 w-full">
        {Array.from({ length: bars }).map((_, index) => (
          <div
            key={index}
            className="pulse-bar w-full rounded-2xl"
            style={{
              height: 'clamp(48px, 10vh, 80px)',
              animationDelay: `${(index + 2) * 60}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default PulseLoader;
