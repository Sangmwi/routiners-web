'use client';

import { ICON_SIZE, STATUS } from '@/lib/config/theme';

type StatusType = keyof typeof STATUS;
type StatusSize = keyof typeof ICON_SIZE;

interface StatusIconProps {
  /** Status type */
  status: StatusType;
  /** Size preset from theme */
  size?: StatusSize;
  /** Additional CSS classes (overrides default color) */
  className?: string;
}

const STATUS_COLORS: Record<StatusType, string> = {
  loading: 'text-primary',
  error: 'text-destructive',
  success: 'text-success',
  info: 'text-muted-foreground',
  check: 'text-primary',
};

export default function StatusIcon({
  status,
  size = 'md',
  className,
}: StatusIconProps) {
  const config = STATUS[status];
  const Icon = config.icon;
  const pixelSize = ICON_SIZE[size];

  const animationClass = 'className' in config ? config.className : '';
  const colorClass = className ?? STATUS_COLORS[status];

  return (
    <Icon size={pixelSize} className={`${animationClass} ${colorClass}`.trim()} />
  );
}

// Convenience exports
type ConvenienceProps = Omit<StatusIconProps, 'status'>;

export function LoadingIcon(props: ConvenienceProps) {
  return <StatusIcon status="loading" {...props} />;
}

export function SuccessIcon(props: ConvenienceProps) {
  return <StatusIcon status="success" {...props} />;
}

export function ErrorIcon(props: ConvenienceProps) {
  return <StatusIcon status="error" {...props} />;
}

export function InfoIcon(props: ConvenienceProps) {
  return <StatusIcon status="info" {...props} />;
}

export function CheckIconStatus(props: ConvenienceProps) {
  return <StatusIcon status="check" {...props} />;
}
