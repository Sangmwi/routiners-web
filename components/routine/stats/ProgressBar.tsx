'use client';

interface ProgressBarProps {
  /** 진행률 (0-100) */
  value: number;
  /** 레이블 */
  label?: string;
  /** 표시 텍스트 (예: "4/5일") */
  displayText?: string;
  /** 크기 */
  size?: 'sm' | 'md' | 'lg';
  /** 색상 클래스 */
  colorClass?: string;
}

/**
 * 프로그레스 바 컴포넌트
 */
export default function ProgressBar({
  value,
  label,
  displayText,
  size = 'md',
  colorClass = 'bg-primary',
}: ProgressBarProps) {
  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }[size];

  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-1.5">
      {(label || displayText) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="text-muted-foreground">{label}</span>}
          {displayText && (
            <span className="font-medium text-foreground">{displayText}</span>
          )}
        </div>
      )}
      <div className={`w-full ${heightClass} bg-muted rounded-full overflow-hidden`}>
        <div
          className={`${heightClass} ${colorClass} rounded-full transition-all duration-300`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
