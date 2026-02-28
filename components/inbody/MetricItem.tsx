'use client';

import ChangeIndicator from '@/components/ui/ChangeIndicator';

export interface MetricItemProps {
  /** 라벨 (예: "체중") */
  label: string;
  /** 값 (예: 75.5 또는 undefined/null) */
  value: string | number | undefined | null;
  /** 값의 단위 (value가 숫자일 때 사용) */
  unit?: string;
  /** 변화량 */
  change?: number;
  /** 양수가 긍정적인지 (체중, 체지방률은 false) */
  positiveIsGood?: boolean;
  /** ChangeIndicator에 삼각 아이콘 표시 여부 */
  showDeltaIcon?: boolean;
  /** 하단 슬롯 (스파크라인 등) */
  children?: React.ReactNode;
}

/**
 * InBody 메트릭 아이템 컴포넌트
 *
 * 라벨, 값, 변화량을 표시하는 단일 메트릭 셀
 * children으로 스파크라인 등 추가 콘텐츠 표시 가능
 */
export function MetricItem({
  label,
  value,
  unit = '',
  change,
  positiveIsGood = true,
  showDeltaIcon,
  children,
}: MetricItemProps) {
  const hasValue = value !== undefined && value !== null;

  const displayValue =
    !hasValue
      ? '-'
      : typeof value === 'number'
        ? value
        : value;

  return (
    <div className="text-center py-2 px-4">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p
        className={`text-lg font-bold ${
          hasValue ? 'text-card-foreground' : 'text-muted-foreground'
        }`}
      >
        {hasValue ? (
          <>
            {displayValue}
            <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
          </>
        ) : (
          '-'
        )}
      </p>
      {change != null && change !== 0 && (
        <div className="mt-2.5">
          <ChangeIndicator value={change} positiveIsGood={positiveIsGood} unit={unit} showIcon={showDeltaIcon} />
        </div>
      )}
      {children}
    </div>
  );
}
