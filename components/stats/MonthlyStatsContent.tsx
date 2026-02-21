'use client';

import { useMonthlyStatsSuspense } from '@/hooks/routine';
import MonthlyStatsSummary from './MonthlyStatsSummary';
import MonthlyProgressChart from './MonthlyProgressChart';

interface MonthlyStatsContentProps {
  year: number;
  month: number;
}

/**
 * 월간 통계 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 월간 통계 데이터 조회
 * - 상위 page.tsx의 Suspense boundary에서 로딩 처리
 */
export default function MonthlyStatsContent({ year, month }: MonthlyStatsContentProps) {
  const stats = useMonthlyStatsSuspense(year, month);

  // 데이터 없음
  if (!stats || (stats.workout.scheduled === 0 && stats.meal.scheduled === 0)) {
    return (
      <p className="text-muted-foreground text-center py-8">
        예정된 루틴이 없어요.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {/* 운동/식단 달성률 */}
      <MonthlyStatsSummary stats={stats} />

      {/* 주차별 현황 차트 */}
      <MonthlyProgressChart stats={stats} />
    </div>
  );
}
