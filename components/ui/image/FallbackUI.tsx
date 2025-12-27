import { ImageOff } from 'lucide-react';

export interface FallbackUIProps {
  fill: boolean;
  width?: string | number;
  height?: string | number;
  showIcon: boolean;
  fallbackClassName: string;
  className?: string;
}

/** 폴백 UI - src가 없거나 에러 발생 시 표시 */
export function FallbackUI({ fill, width, height, showIcon, fallbackClassName, className }: FallbackUIProps) {
  const baseClassName = `flex items-center justify-center ${fallbackClassName} ${className ?? ''}`;

  if (fill) {
    return (
      <div className={`absolute inset-0 ${baseClassName}`}>
        {showIcon && <ImageOff className="h-1/3 w-1/3 text-muted-foreground/50" />}
      </div>
    );
  }

  return (
    <div className={baseClassName} style={{ width, height }}>
      {showIcon && <ImageOff className="h-1/3 w-1/3 text-muted-foreground/50" />}
    </div>
  );
}
