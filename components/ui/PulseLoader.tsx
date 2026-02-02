'use client';

import { HTMLAttributes } from 'react';

// ============================================================================
// Types
// ============================================================================

interface PulseLoaderProps extends HTMLAttributes<HTMLDivElement> {
  /** 메인 바 개수 (기본: 3) */
  bars?: number;
  /** 변형: page(기본) = 페이지 레이아웃, chat = 채팅 메시지 스켈레톤 */
  variant?: 'page' | 'chat';
}

// ============================================================================
// Chat Variant
// ============================================================================

function ChatPulseContent() {
  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 좌측 assistant 메시지 (긴) - ChatMessage 스타일 일치 */}
      <div className="flex gap-3 mt-2">
        <div
          className="pulse-bar shrink-0 w-8 h-8 rounded-full"
          style={{ animationDelay: '0ms' }}
        />
        <div
          className="pulse-bar rounded-2xl rounded-tl-none mt-2"
          style={{ width: '65%', height: 48, animationDelay: '60ms' }}
        />
      </div>

      {/* 우측 user 메시지 (짧) */}
      <div className="flex justify-end">
        <div
          className="pulse-bar rounded-2xl rounded-tr-none"
          style={{ width: '40%', height: 40, animationDelay: '120ms' }}
        />
      </div>

      {/* 좌측 assistant 메시지 (중간) */}
      <div className="flex gap-3 mt-2">
        <div
          className="pulse-bar shrink-0 w-8 h-8 rounded-full"
          style={{ animationDelay: '180ms' }}
        />
        <div
          className="pulse-bar rounded-2xl rounded-tl-none mt-2"
          style={{ width: '55%', height: 56, animationDelay: '240ms' }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Page Variant (기존)
// ============================================================================

function PagePulseContent({ bars }: { bars: number }) {
  return (
    <>
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
    </>
  );
}

// ============================================================================
// Component
// ============================================================================

/**
 * 펄스 로딩 컴포넌트
 *
 * 추상적이고 범용적인 로딩 UI
 * - ease-in-out 펄스 애니메이션
 * - 시간차(stagger)로 파도처럼 보이는 효과
 * - prefers-reduced-motion 시 애니메이션 비활성화
 *
 * @example
 * <PulseLoader />
 * <PulseLoader variant="chat" />
 * <PulseLoader bars={4} />
 */
export function PulseLoader({
  bars = 3,
  variant = 'page',
  className = '',
  ...props
}: PulseLoaderProps) {
  return (
    <div
      className={`flex flex-col items-start justify-center ${className}`}
      {...props}
    >
      {variant === 'chat' ? (
        <ChatPulseContent />
      ) : (
        <PagePulseContent bars={bars} />
      )}
    </div>
  );
}

export default PulseLoader;
