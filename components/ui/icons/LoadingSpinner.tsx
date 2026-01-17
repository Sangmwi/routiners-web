'use client';

import { ICON_SIZE } from '@/lib/config/theme';
import { SpinnerGapIcon } from '@phosphor-icons/react';

type SpinnerSize = keyof typeof ICON_SIZE;
type SpinnerVariant = 'primary' | 'muted' | 'destructive' | 'current';

interface LoadingSpinnerProps {
  /** Size preset from theme (xs=12, sm=16, md=20, lg=24, xl=32, 2xl=48) */
  size?: SpinnerSize;
  /** Color variant */
  variant?: SpinnerVariant;
  /** Additional CSS classes */
  className?: string;
}

const VARIANT_CLASSES: Record<SpinnerVariant, string> = {
  primary: 'text-primary',
  muted: 'text-muted-foreground',
  destructive: 'text-destructive',
  current: '',
};

export default function LoadingSpinner({
  size = 'sm',
  variant = 'primary',
  className = '',
}: LoadingSpinnerProps) {
  const pixelSize = ICON_SIZE[size];
  const colorClass = VARIANT_CLASSES[variant];

  return (
    <SpinnerGapIcon
      size={pixelSize}
      className={`animate-spin ${colorClass} ${className}`.trim()}
    />
  );
}
