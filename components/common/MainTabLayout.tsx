'use client';

import { ReactNode } from 'react';

interface MainTabLayoutProps {
  /** 페이지 콘텐츠 */
  children: ReactNode;

  /** 섹션간 간격 (기본: 'normal') */
  spacing?: 'tight' | 'normal' | 'loose';

  /** 추가 클래스명 */
  className?: string;
}

const SPACING_MAP = {
  tight: 'gap-4',
  normal: 'gap-6',
  loose: 'gap-8',
} as const;

/**
 * 메인 탭 페이지 (홈, AI, 커뮤니티, 프로필)용 공통 레이아웃
 *
 * - 일관된 패딩 (p-4)
 * - 섹션간 간격 통일
 * - min-h-screen, bg-background 자동 적용
 *
 * @example
 * <MainTabLayout>
 *   <GreetingSection />
 *   <HealthScoreCard />
 * </MainTabLayout>
 */
export default function MainTabLayout({
  children,
  spacing = 'normal',
  className = '',
}: MainTabLayoutProps) {
  const spacingClass = SPACING_MAP[spacing];

  return (
    <div className={`min-h-screen bg-background p-4 pb-24 ${className}`.trim()}>
      <div className={`flex flex-col ${spacingClass}`}>
        {children}
      </div>
    </div>
  );
}
