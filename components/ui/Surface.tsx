'use client';

import { ReactNode } from 'react';

// ============================================================
// Types
// ============================================================

interface SurfaceProps {
  children: ReactNode;
  /** 서피스 변형 */
  variant?: 'secondary' | 'card' | 'form' | 'accent' | 'danger';
  /** 모서리 크기 (기본: xl) */
  rounded?: 'lg' | 'xl' | '2xl';
  /** 내부 패딩 (기본: md) */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 자식 간격 (기본: none) */
  spacing?: 'none' | 'tight' | 'normal' | 'loose';
  /** HTML 요소 (기본: div) */
  as?: 'div' | 'section' | 'article';
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Style Maps
// ============================================================

const VARIANT = {
  secondary: 'bg-surface-secondary',
  card: 'bg-card border border-edge-subtle',
  form: 'bg-card border border-edge-faint',
  accent: 'bg-surface-accent',
  danger: 'bg-surface-danger',
} as const;

const ROUNDED = {
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
} as const;

const PADDING = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
} as const;

const SPACING = {
  none: '',
  tight: 'space-y-3',
  normal: 'space-y-4',
  loose: 'space-y-5',
} as const;

// ============================================================
// Component
// ============================================================

/**
 * 범용 서피스(카드/섹션) 래퍼 컴포넌트
 *
 * @example
 * // 기본 카드 (bg-surface-secondary rounded-xl p-4)
 * <Surface>콘텐츠</Surface>
 *
 * // 폼 카드
 * <Surface variant="form" as="section" rounded="2xl" spacing="loose">
 *   <FormSection>...</FormSection>
 * </Surface>
 *
 * // 액센트 섹션
 * <Surface variant="accent" padding="sm">강조 콘텐츠</Surface>
 */
export default function Surface({
  children,
  variant = 'secondary',
  rounded = 'xl',
  padding = 'md',
  spacing = 'none',
  as: Tag = 'div',
  className = '',
}: SurfaceProps) {
  return (
    <Tag
      className={`
        ${VARIANT[variant]}
        ${ROUNDED[rounded]}
        ${PADDING[padding]}
        ${SPACING[spacing]}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {children}
    </Tag>
  );
}
