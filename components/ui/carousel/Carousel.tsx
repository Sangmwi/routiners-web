'use client';

import { useDragScroll } from '@/hooks';
import CarouselItem from './CarouselItem';
import CarouselMore from './CarouselMore';
import { CarouselProps } from './types';

/**
 * 가로 스크롤 캐러셀 컴포넌트
 *
 * CSS scroll-snap으로 안정적인 스냅 동작을 제공하며,
 * 데스크톱에서는 마우스 드래그, 모바일에서는 네이티브 터치 스크롤을 지원합니다.
 *
 * @example
 * ```tsx
 * <Carousel gap="gap-4" fullBleed snap>
 *   {items.map(item => (
 *     <Carousel.Item key={item.id}>
 *       <Card {...item} />
 *     </Carousel.Item>
 *   ))}
 * </Carousel>
 * ```
 */
function Carousel({
  children,
  gap = 'gap-4',
  className = '',
  enableDrag = true,
  scrollSpeed = 2,
  fullBleed = false,
  snap = true,
}: CarouselProps) {
  const { containerRef, handlers } = useDragScroll<HTMLDivElement>({
    enabled: enableDrag,
    scrollSpeed,
    snap: { enabled: snap, itemSelector: '[data-carousel-item]' },
  });

  const fullBleedClass = fullBleed
    ? '-mx-(--layout-padding-x) px-(--layout-padding-x)'
    : '';

  const snapClass = snap ? 'snap-x snap-proximity' : '';

  return (
    <div
      className="w-full"
      role="region"
      aria-roledescription="carousel"
    >
      <div
        ref={containerRef}
        className={`
          flex ${gap} overflow-x-auto scrollbar-hide
          ${enableDrag ? 'select-none' : ''}
          ${snapClass}
          ${fullBleedClass}
          ${className}
        `.trim()}
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch',
          ...(snap && fullBleed
            ? { scrollPaddingInline: 'var(--layout-padding-x)' }
            : {}),
        }}
        {...handlers}
      >
        {children}
      </div>
    </div>
  );
}

// Compound Component 패턴
Carousel.Item = CarouselItem;
Carousel.More = CarouselMore;

export default Carousel;
