'use client';

import { TrendUpIcon, TrendDownIcon } from '@phosphor-icons/react';

export interface MetricItemProps {
  /** 아이콘 컴포넌트 */
  icon: React.ElementType;
  /** 라벨 (예: "체중") */
  label: string;
  /** 값 (예: "75.5kg" 또는 undefined/null) */
  value: string | number | undefined | null;
  /** 값의 단위 (value가 숫자일 때 사용) */
  unit?: string;
  /** 변화량 */
  change?: number;
  /** 양수가 긍정적인지 (체중, 체지방률은 false) */
  positiveIsGood?: boolean;
}

/**
 * InBody 메트릭 아이템 컴포넌트
 *
 * 아이콘, 라벨, 값, 변화량을 표시하는 단일 메트릭 셀
 *
 * @example
 * ```tsx
 * <MetricItem
 *   icon={Scale}
 *   label="체중"
 *   value={75.5}
 *   unit="kg"
 *   change={-1.2}
 *   positiveIsGood={false}
 * />
 * ```
 */
export function MetricItem({
  icon: Icon,
  label,
  value,
  unit = '',
  change,
  positiveIsGood = true,
}: MetricItemProps) {
  const showChange = change !== undefined && change !== 0;
  const isPositive = change !== undefined && change > 0;
  const isGood = positiveIsGood ? isPositive : !isPositive;

  // 값 포맷팅
  const displayValue =
    value === undefined || value === null
      ? '-'
      : typeof value === 'number'
        ? `${value}${unit}`
        : value;

  const hasValue = value !== undefined && value !== null;

  return (
    <div className="text-center">
      <Icon className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-sm font-semibold ${
          hasValue ? 'text-card-foreground' : 'text-muted-foreground'
        }`}
      >
        {displayValue}
      </p>
      {showChange && (
        <div
          className={`flex items-center justify-center gap-0.5 text-xs mt-0.5 ${
            isGood ? 'text-success' : 'text-destructive'
          }`}
        >
          {isPositive ? (
            <TrendUpIcon size={12} weight="bold" />
          ) : (
            <TrendDownIcon size={12} weight="bold" />
          )}
          <span>
            {isPositive ? '+' : ''}
            {change.toFixed(1)}
          </span>
        </div>
      )}
    </div>
  );
}
