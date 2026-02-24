'use client';

import { type ReactNode, Suspense } from 'react';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import type { UseStatsPeriodNavigatorReturn } from '@/hooks/routine/useStatsPeriodNavigator';

interface StatsTabShellProps {
  navigator: UseStatsPeriodNavigatorReturn;
  weeklyContent: (dateStr: string) => ReactNode;
  monthlyContent: (year: number, month: number) => ReactNode;
  /** Suspense 밖에 렌더링되는 추가 콘텐츠 (e.g. Big3 섹션) */
  children?: ReactNode;
}

export default function StatsTabShell({
  navigator,
  weeklyContent,
  monthlyContent,
  children,
}: StatsTabShellProps) {
  const { period, weekDateStr, monthYear } = navigator;

  return (
    <div>
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          {period === 'weekly'
            ? weeklyContent(weekDateStr)
            : monthlyContent(monthYear.year, monthYear.month)}
        </Suspense>
      </QueryErrorBoundary>

      {children}
    </div>
  );
}
