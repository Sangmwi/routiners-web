'use client';

import { ReactNode } from 'react';

interface MainTabLayoutProps {
  children: ReactNode;
  className?: string;
}

/**
 * 메인 탭 페이지 (홈, AI, 커뮤니티, 프로필)용 공통 레이아웃
 *
 * - 일관된 패딩 (p-4 pb-24)
 * - 섹션간 간격 통일 (gap-6)
 * - min-h-screen, bg-background 자동 적용
 */
export default function MainTabLayout({
  children,
  className = '',
}: MainTabLayoutProps) {
  return (
    <div className={`min-h-screen bg-background p-4 pb-24 ${className}`.trim()}>
      <div className="flex flex-col gap-8">{children}</div>
    </div>
  );
}
