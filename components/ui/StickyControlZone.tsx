import { ReactNode } from 'react';

interface StickyControlZoneProps {
  children: ReactNode;
  className?: string;
  /**
   * sticky top 오프셋 CSS 값.
   * - 기본값(생략 시): var(--safe-top) → 상태바 바로 아래에 고정 (main tab 페이지)
   * - detail 페이지처럼 PageHeader 아래에 고정해야 할 때: 'calc(var(--safe-top) + 3rem)'
   */
  top?: string;
}

/**
 * 메인탭 페이지용 sticky 컨트롤 존
 *
 * 탭, 기간 네비게이션, 카테고리 필터 등 페이지 타이틀이 스크롤된 후에도
 * 상단에 고정되어야 하는 컨트롤 영역을 감싸는 래퍼.
 *
 * - sticky top-safe(기본): 상태바 아래에 고정
 * - z-30: sticky 헤더(z-40) 아래, 일반 콘텐츠 위
 * - bg-background: 스크롤된 콘텐츠를 가림 (solid, StatusBarCover와 시각 통일)
 * - full-bleed: -mx/(--layout-padding-x) px/(--layout-padding-x)
 * - border-b: 콘텐츠와 시각적 구분
 */
export default function StickyControlZone({
  children,
  className = '',
  top,
}: StickyControlZoneProps) {
  return (
    <div
      className={`sticky z-30 bg-background -mx-(--layout-padding-x) px-(--layout-padding-x) border-b border-edge-subtle ${className}`.trim()}
      style={{ top: top ?? 'var(--safe-top)' }}
    >
      {children}
    </div>
  );
}
