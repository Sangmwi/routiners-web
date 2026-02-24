'use client';

import { ReactNode } from 'react';

interface MainTabLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * 메인 탭 페이지 (홈, 루틴, 커뮤니티, 프로필)용 공통 레이아웃
 *
 * - CSS Variable 기반 패딩 (--layout-padding-x, --layout-padding-y)
 * - 하단 네비게이션 여백 (--nav-clearance)
 * - 섹션간 간격 통일 (gap-8)
 * - min-h-screen, bg-background 자동 적용
 */
export function MainTabLayout({ children, className = '' }: MainTabLayoutProps) {
  return (
    <div
      className={`min-h-screen bg-background px-(--layout-padding-x) py-(--layout-padding-y) pb-(--nav-clearance) ${className}`.trim()}
    >
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

export default MainTabLayout;
