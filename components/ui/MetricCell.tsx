'use client';

import ChangeIndicator from '@/components/ui/ChangeIndicator';
import MiniSparkline from '@/components/ui/MiniSparkline';

interface MetricCellProps {
  label: string;
  value: number | null | undefined;
  unit: string;
  valueSizeClass?: string;
  change?: number | null;
  positiveIsGood?: boolean;
  sparkData?: number[];
}

export default function MetricCell({
  label,
  value,
  unit,
  valueSizeClass = 'text-base',
  change,
  positiveIsGood,
  sparkData = [],
}: MetricCellProps) {
  return (
    <div className="text-center">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`${valueSizeClass} font-bold text-foreground`}>
        {value != null ? (
          <>
            {value}
            <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
          </>
        ) : (
          <span className="text-hint">-</span>
        )}
      </p>
      {change != null && change !== 0 && (
        <ChangeIndicator value={change} positiveIsGood={positiveIsGood ?? false} unit={unit} />
      )}
      {sparkData.length >= 2 && (
        <div className="mt-1">
          <MiniSparkline data={sparkData} height={28} showEndDot={false} />
        </div>
      )}
    </div>
  );
}
