import { CarouselSlotProps } from './types';

/** 더보기 버튼 래퍼 - 캐러셀 끝에 배치 */
export default function CarouselMore({ children, className = '' }: CarouselSlotProps) {
  return (
    <div className={`shrink-0 flex items-center justify-center ${className}`}>
      {children}
    </div>
  );
}
