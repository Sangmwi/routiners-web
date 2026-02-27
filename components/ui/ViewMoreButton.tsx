'use client';

import { ReactNode } from 'react';
import { NextIcon } from '@/components/ui/icons';
import AppLink from '@/components/common/AppLink';

interface ViewMoreButtonProps {
  onClick?: () => void;
  href?: string;
  children?: ReactNode;
  variant?: 'primary' | 'muted';
  hideIcon?: boolean;
  className?: string;
  beforeNavigate?: () => void;
}

const variantStyles = {
  primary: 'text-primary hover:text-primary/80',
  muted: 'text-muted-foreground hover:text-foreground',
};

export default function ViewMoreButton({
  onClick,
  href,
  children = '더 보기',
  variant = 'primary',
  hideIcon = false,
  className = '',
  beforeNavigate,
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
      <AppLink
        href={href}
        className={baseClassName}
        onClick={() => {
          beforeNavigate?.();
        }}
      >
        {content}
      </AppLink>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        beforeNavigate?.();
        onClick?.();
      }}
      className={baseClassName}
    >
      {content}
    </button>
  );
}

