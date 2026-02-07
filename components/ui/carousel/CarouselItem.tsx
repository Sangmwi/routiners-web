import { CarouselSlotProps } from './types';

/** 캐러셀 아이템 래퍼 - shrink-0 + snap-align 자동 적용 */
export default function CarouselItem({ children, className = '' }: CarouselSlotProps) {
  return (
    <div data-carousel-item className={`shrink-0 snap-start ${className}`}>
      {children}
    </div>
  );
}
