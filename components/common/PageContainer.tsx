'use client';

import { ReactNode } from 'react';

interface PageContainerProps {
  /** 페이지 콘텐츠 */
  children: ReactNode;

  /** 추가 클래스명 */
  className?: string;

  /** 콘텐츠 영역 패딩 (기본: true) */
  padded?: boolean;

  /** 섹션간 간격 (기본: 'normal') */
  spacing?: 'none' | 'tight' | 'normal' | 'loose';

  /** 하단 여백 (BottomNav 공간 확보, 기본: true) */
  withBottomNav?: boolean;
}

const SPACING_MAP = {
  none: '',
  tight: 'space-y-4',
  normal: 'space-y-6',
  loose: 'space-y-8',
  extraLoose: 'space-y-10',
} as const;

/**
 * 페이지 콘텐츠를 감싸는 컨테이너 컴포넌트
 *
 * - CSS Variable 기반 패딩 (--layout-padding-x)
 * - 섹션간 간격 통일
 * - BottomNav 공간 확보 (--nav-clearance)
 *
 * @example
 * <PageContainer>
 *   <Section>...</Section>
 *   <Section>...</Section>
 * </PageContainer>
 *
 * @example
 * <PageContainer spacing="tight" withBottomNav={false}>
 *   <Content />
 * </PageContainer>
 */
export default function PageContainer({
  children,
  className = '',
  padded = true,
  spacing = 'normal',
  withBottomNav = true,
}: PageContainerProps) {
  const paddingClass = padded ? 'p-(--layout-padding-x)' : '';
  const spacingClass = SPACING_MAP[spacing];
  const bottomClass = withBottomNav ? 'pb-(--nav-clearance)' : '';

  return (
    <div
      className={`
        min-h-screen bg-background
        ${paddingClass}
        ${spacingClass}
        ${bottomClass}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </div>
  );
}
