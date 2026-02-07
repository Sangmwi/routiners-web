import { ReactNode } from 'react';

// ============================================================
// Carousel Props
// ============================================================

export interface CarouselProps {
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
  /** scroll-snap 활성화 여부 */
  snap?: boolean;
}

// ============================================================
// Sub-component Props
// ============================================================

export interface CarouselSlotProps {
  children: ReactNode;
  className?: string;
}
