'use client';

import { Suspense, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DetailLayout } from '@/components/layouts';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { PulseLoader } from '@/components/ui/PulseLoader';
import PeriodTabs, { type StatsPeriod } from '@/components/routine/stats/PeriodTabs';
import { getWeekRange, getMonthRange, addDays, formatDate } from '@/lib/utils/dateHelpers';

const WeeklyStatsContent = dynamic(
  () => import('@/components/routine/stats/StatsContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

const MonthlyStatsContent = dynamic(
  () => import('@/components/routine/stats/MonthlyStatsContent'),
  { ssr: false, loading: () => <PulseLoader /> }
);

/**
 * 통계 페이지
 *
 * - PeriodTabs: Suspense 밖 → 항상 표시
 * - 주간/월간 콘텐츠: Suspense 안 → 전환 시 로딩 처리
 */
export default function StatsPage() {
  const [period, setPeriod] = useState<StatsPeriod>('weekly');
  const [weekBaseDate, setWeekBaseDate] = useState(() => new Date());
  const [monthYear, setMonthYear] = useState(() => ({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
  }));

  // 현재 기간 라벨
  const weekRange = getWeekRange(weekBaseDate);
  const monthRange = getMonthRange(monthYear.year, monthYear.month);
  const label = period === 'weekly' ? weekRange.weekLabel : monthRange.monthLabel;

  // 미래 이동 방지
  const today = new Date();
  const canGoNext = period === 'weekly'
    ? new Date(weekRange.endDate) < today
    : (monthYear.year < today.getFullYear() ||
       (monthYear.year === today.getFullYear() && monthYear.month < today.getMonth() + 1));

  const handlePrev = useCallback(() => {
    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, -7));
    } else {
      setMonthYear((prev) => {
        if (prev.month === 1) return { year: prev.year - 1, month: 12 };
        return { ...prev, month: prev.month - 1 };
      });
    }
  }, [period]);

  const handleNext = useCallback(() => {
    if (!canGoNext) return;
    if (period === 'weekly') {
      setWeekBaseDate((prev) => addDays(prev, 7));
    } else {
      setMonthYear((prev) => {
        if (prev.month === 12) return { year: prev.year + 1, month: 1 };
        return { ...prev, month: prev.month + 1 };
      });
    }
  }, [period, canGoNext]);

  return (
    <DetailLayout title="통계" centered>
      {/* 기간 탭 — Suspense 밖, 항상 표시 */}
      <PeriodTabs
        period={period}
        onPeriodChange={setPeriod}
        label={label}
        onPrev={handlePrev}
        onNext={handleNext}
        canGoNext={canGoNext}
      />

      {/* 통계 콘텐츠 — Suspense 안 */}
      <div className="mt-6">
        <QueryErrorBoundary>
          <Suspense fallback={<PulseLoader />}>
            {period === 'weekly' ? (
              <WeeklyStatsContent dateStr={formatDate(weekBaseDate)} />
            ) : (
              <MonthlyStatsContent year={monthYear.year} month={monthYear.month} />
            )}
          </Suspense>
        </QueryErrorBoundary>
      </div>
    </DetailLayout>
  );
}
