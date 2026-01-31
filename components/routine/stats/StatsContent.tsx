'use client';

import { WeeklyStatsSummary, WeeklyProgressChart } from '@/components/routine';
import { useWeeklyStatsSuspense } from '@/hooks/routine';

/**
 * 주간 통계 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 통계 데이터 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function StatsContent() {
  const stats = useWeeklyStatsSuspense();

  // 데이터 없음 (예정된 루틴 없음)
  if (!stats || (stats.workout.scheduled === 0 && stats.meal.scheduled === 0)) {
    return (
      <p className="text-muted-foreground text-center py-8">
        이번 주 예정된 루틴이 없습니다.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주간 기간 표시 */}
      <p className="text-sm text-muted-foreground text-center">
        {stats.weekLabel}
      </p>

      {/* 운동/식단 달성률 */}
      <WeeklyStatsSummary stats={stats} />

      {/* 일별 현황 차트 */}
      <WeeklyProgressChart stats={stats} />
    </div>
  );
}
