'use client';

import { ScalesIcon, BarbellIcon, PercentIcon } from '@phosphor-icons/react';
import { MetricItem } from './MetricItem';

export interface InBodyMetricsData {
  weight?: number | null;
  skeletalMuscleMass?: number | null;
  bodyFatPercentage?: number | null;
}

export interface InBodyChanges {
  weight?: number;
  skeletalMuscleMass?: number;
  bodyFatPercentage?: number;
}

export interface MetricsGridProps {
  /** 측정 데이터 */
  data: InBodyMetricsData | null | undefined;
  /** 변화량 (선택) */
  changes?: InBodyChanges;
}

/**
 * InBody 3열 메트릭 그리드
 *
 * 체중, 골격근량, 체지방률을 3열 그리드로 표시
 *
 * @example
 * ```tsx
 * <MetricsGrid
 *   data={{ weight: 75.5, skeletalMuscleMass: 32.1, bodyFatPercentage: 18.5 }}
 *   changes={{ weight: -1.2, skeletalMuscleMass: 0.5, bodyFatPercentage: -0.8 }}
 * />
 * ```
 */
export function MetricsGrid({ data, changes }: MetricsGridProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricItem
        icon={ScalesIcon}
        label="체중"
        value={data?.weight}
        unit="kg"
        change={changes?.weight}
        positiveIsGood={false}
      />
      <MetricItem
        icon={BarbellIcon}
        label="골격근량"
        value={data?.skeletalMuscleMass}
        unit="kg"
        change={changes?.skeletalMuscleMass}
        positiveIsGood={true}
      />
      <MetricItem
        icon={PercentIcon}
        label="체지방률"
        value={data?.bodyFatPercentage}
        unit="%"
        change={changes?.bodyFatPercentage}
        positiveIsGood={false}
      />
    </div>
  );
}
