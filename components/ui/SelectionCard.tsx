'use client';

import { CheckIcon } from '@phosphor-icons/react';

interface SelectionCardProps {
  /** 선택지 라벨 */
  label: string;
  /** 선택 여부 */
  selected?: boolean;
  /** 클릭 핸들러 */
  onClick: () => void;
  /** 아이콘 (왼쪽) */
  icon?: React.ReactNode;
  /** 설명 텍스트 (라벨 아래) */
  description?: string;
  /** 비활성화 */
  disabled?: boolean;
}

/**
 * SelectionCard
 *
 * 터치 친화적인 선택 카드 컴포넌트
 * - 48px+ 터치 타겟
 * - 선택 상태 시각적 표시
 * - 접근성 지원
 */
export function SelectionCard({
  label,
  selected = false,
  onClick,
  icon,
  description,
  disabled = false,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full min-h-[56px] px-4 py-3
        flex items-center gap-4
        rounded-xl border-2 transition-all duration-200
        ${
          selected
            ? 'border-primary bg-primary/10 shadow-sm'
            : 'border-border bg-card hover:border-primary/50 hover:bg-muted/50'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}
      `}
      aria-pressed={selected}
    >
      {/* Icon */}
      {icon && (
        <div
          className={`
          flex-shrink-0 w-10 h-10 rounded-full
          flex items-center justify-center
          ${selected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
        `}
        >
          {icon}
        </div>
      )}

      {/* Label & Description */}
      <div className="flex-1 text-left">
        <span
          className={`
          text-base font-medium
          ${selected ? 'text-primary' : 'text-foreground'}
        `}
        >
          {label}
        </span>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>

      {/* Check indicator */}
      <div
        className={`
        flex-shrink-0 w-6 h-6 rounded-full
        flex items-center justify-center
        transition-all duration-200
        ${selected ? 'bg-primary text-primary-foreground' : 'bg-transparent'}
      `}
      >
        {selected && <CheckIcon size={16} weight="bold" />}
      </div>
    </button>
  );
}

/**
 * SelectionCardGroup
 *
 * SelectionCard들을 감싸는 컨테이너
 */
interface SelectionCardGroupProps {
  children: React.ReactNode;
  /** 카드 간격 */
  gap?: 'sm' | 'md' | 'lg';
}

export function SelectionCardGroup({
  children,
  gap = 'md',
}: SelectionCardGroupProps) {
  const gapClass = {
    sm: 'space-y-2',
    md: 'space-y-3',
    lg: 'space-y-4',
  }[gap];

  return <div className={gapClass}>{children}</div>;
}
