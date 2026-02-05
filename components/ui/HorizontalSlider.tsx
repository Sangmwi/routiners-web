'use client';

import { ReactNode } from 'react';
import { useDragScroll, useScrollProgress } from '@/hooks';

// ============================================================
// Types
// ============================================================

interface HorizontalSliderProps {
  children: ReactNode;
  /** 슬라이더 아이템 사이 간격 (Tailwind gap 클래스) */
  gap?: string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 드래그 활성화 여부 */
  enableDrag?: boolean;
  /** 스크롤 속도 배율 (기본: 2) */
  scrollSpeed?: number;
  /** 레이아웃 패딩 무시하고 전체 너비 사용 */
  fullBleed?: boolean;
}

interface SlotProps {
  children: ReactNode;
  className?: string;
}

// ============================================================
// Sub Components
// ============================================================

/** 슬라이더 아이템 래퍼 - shrink-0 자동 적용 */
function Item({ children, className = '' }: SlotProps) {
  return <div className={`shrink-0 ${className}`}>{children}</div>;
}

/** 더보기 버튼 래퍼 - 슬라이더 끝에 배치 */
function More({ children, className = '' }: SlotProps) {
  return (
    <div className={`shrink-0 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}

// ============================================================
// Scroll Progress Indicator
// ============================================================

interface ScrollIndicatorProps {
  progress: number;
  isVisible: boolean;
}

function ScrollIndicator({ progress, isVisible }: ScrollIndicatorProps) {
  return (
    <div
      className={`
        mt-2 h-0.5 w-full bg-muted rounded-full overflow-hidden
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
    >
      <div
        className="h-full bg-primary/30 rounded-full transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

/**
 * 가로 스크롤 슬라이더 컴포넌트
 *
 * 마우스 드래그와 터치 스크롤을 지원하며,
 * 카드 클릭과 드래그를 자동으로 구분합니다.
 *
 * @example
 * ```tsx
 * <HorizontalSlider gap="gap-4" fullBleed>
 *   {items.map(item => (
 *     <HorizontalSlider.Item key={item.id}>
 *       <Card {...item} />
 *     </HorizontalSlider.Item>
 *   ))}
 *   <HorizontalSlider.More>
 *     <button onClick={onMore}>더보기</button>
 *   </HorizontalSlider.More>
 * </HorizontalSlider>
 * ```
 */
function HorizontalSlider({
  children,
  gap = 'gap-4',
  className = '',
  enableDrag = true,
  scrollSpeed = 2,
  fullBleed = false,
}: HorizontalSliderProps) {
  const { containerRef, handlers } = useDragScroll<HTMLDivElement>({
    enabled: enableDrag,
    scrollSpeed,
  });

  const { progress, isVisible } = useScrollProgress(containerRef);

  const fullBleedClass = fullBleed
    ? '-mx-(--layout-padding-x) px-(--layout-padding-x)'
    : '';

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className={`
          flex ${gap} overflow-x-auto scrollbar-hide pb-2
          ${enableDrag ? 'select-none' : ''}
          ${fullBleedClass}
          ${className}
        `.trim()}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
        {...handlers}
      >
        {children}
      </div>

      <ScrollIndicator progress={progress} isVisible={isVisible} />
    </div>
  );
}

// Compound Component 패턴
HorizontalSlider.Item = Item;
HorizontalSlider.More = More;

export default HorizontalSlider;
