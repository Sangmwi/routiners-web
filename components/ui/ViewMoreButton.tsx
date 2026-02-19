'use client';

import { ReactNode } from 'react';
import { NextIcon } from '@/components/ui/icons';
import AppLink from '@/components/common/AppLink';

// ============================================================
// Types
// ============================================================

interface ViewMoreButtonProps {
  /** 클릭 핸들러 (href가 없을 때 사용) */
  onClick?: () => void;
  /** 링크 URL (onClick 대신 사용) */
  href?: string;
  /** 버튼 텍스트 */
  children?: ReactNode;
  /** 스타일 변형 */
  variant?: 'primary' | 'muted';
  /** 아이콘 숨기기 */
  hideIcon?: boolean;
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Styles
// ============================================================

const variantStyles = {
  primary: 'text-primary hover:text-primary/80',
  muted: 'text-muted-foreground hover:text-foreground',
};

// ============================================================
// Component
// ============================================================

/**
 * 액션 버튼 컴포넌트 (더보기, 관리 등)
 *
 * @example
 * ```tsx
 * // 기본 (primary 스타일)
 * <ViewMoreButton onClick={() => console.log('clicked')} />
 *
 * // 링크로 사용
 * <ViewMoreButton href="/profile/inbody">관리</ViewMoreButton>
 *
 * // muted 스타일 (SectionHeader 등에서 사용)
 * <ViewMoreButton href="/locations" variant="muted">
 *   더보기
 * </ViewMoreButton>
 *
 * // 아이콘 없이
 * <ViewMoreButton onClick={handleClick} hideIcon>
 *   수정
 * </ViewMoreButton>
 * ```
 */
export default function ViewMoreButton({
  onClick,
  href,
  children = '더 보기',
  variant = 'primary',
  hideIcon = false,
  className = '',
}: ViewMoreButtonProps) {
  const baseClassName = `text-sm transition-colors inline-flex items-center gap-1 ${variantStyles[variant]} ${className}`;

  const content = (
    <>
      <span>{children}</span>
      {!hideIcon && <NextIcon size="sm" />}
    </>
  );

  if (href) {
    return (
      <AppLink href={href} className={baseClassName}>
        {content}
      </AppLink>
    );
  }

  return (
    <button type="button" onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
}
