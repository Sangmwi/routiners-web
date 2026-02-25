'use client';

import { ReactNode } from 'react';
import type { Icon } from '@phosphor-icons/react';
import { CaretRightIcon } from '@phosphor-icons/react';
import AppLink from '@/components/common/AppLink';

// ============================================================
// Types
// ============================================================

interface EmptyStateAction {
  /** CTA 라벨 */
  label: string;
  /** 내부 링크 — AppLink로 렌더링 + CaretRight 아이콘 */
  href?: string;
  /** 클릭 핸들러 */
  onClick?: () => void;
}

interface EmptyStateProps {
  /** 아이콘 - PhosphorIcon 또는 ReactNode */
  icon?: Icon | ReactNode;
  /** 메인 메시지 */
  message: string;
  /** 부가 설명 */
  hint?: string;
  /** CTA */
  action?: EmptyStateAction;
  /** 스타일 변형 */
  variant?: 'default' | 'private' | 'error';
  /** sm: 부모 카드 내부 | md(기본): 독립 카드 | lg: 풀페이지 */
  size?: 'sm' | 'md' | 'lg';
  /** 추가 클래스 */
  className?: string;
}

// ============================================================
// Constants
// ============================================================

const CONTAINER_STYLES = {
  sm: 'py-4 text-center',
  md: 'rounded-2xl bg-surface-secondary p-6 text-center',
  lg: 'py-16 text-center',
} as const;

const ICON_COLOR = {
  default: 'text-hint-faint',
  private: 'text-muted-foreground',
  error: 'text-destructive',
} as const;

const MESSAGE_COLOR = {
  default: 'text-muted-foreground',
  private: 'text-muted-foreground',
  error: 'text-destructive',
} as const;

// ============================================================
// Component
// ============================================================

export default function EmptyState({
  icon,
  message,
  hint,
  action,
  variant = 'default',
  size = 'md',
  className = '',
}: EmptyStateProps) {
  const hasHint = !!hint;
  const hasAction = !!action;

  // 아이콘 렌더링
  const renderIcon = () => {
    if (!icon) return null;

    const isPhosphorIcon =
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && '$$typeof' in icon);

    if (isPhosphorIcon) {
      const IconComponent = icon as Icon;
      return (
        <IconComponent
          size={28}
          weight="duotone"
          className={`mx-auto mb-2 ${ICON_COLOR[variant]}`}
        />
      );
    }

    return (
      <div className={`mb-2 ${ICON_COLOR[variant]} [&>svg]:mx-auto`}>
        {icon}
      </div>
    );
  };

  // CTA 렌더링
  const renderAction = () => {
    if (!action) return null;

    if (action.href) {
      return (
        <AppLink
          href={action.href}
          className="inline-flex items-center gap-1 text-xs font-medium text-primary"
        >
          {action.label}
          <CaretRightIcon size={12} weight="bold" />
        </AppLink>
      );
    }

    return (
      <button
        type="button"
        onClick={action.onClick}
        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
      >
        {action.label}
      </button>
    );
  };

  return (
    <div
      className={`flex flex-col items-center justify-center ${CONTAINER_STYLES[size]} ${className}`}
    >
      {renderIcon()}

      <p className={`text-sm ${MESSAGE_COLOR[variant]}${hasHint || hasAction ? ' mb-1' : ''}`}>
        {message}
      </p>

      {hint && (
        <p className={`text-xs text-hint-strong${hasAction ? ' mb-3' : ''}`}>
          {hint}
        </p>
      )}

      {renderAction()}
    </div>
  );
}
