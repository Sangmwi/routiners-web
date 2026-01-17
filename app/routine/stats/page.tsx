'use client';

import PageHeader from '@/components/common/PageHeader';
import { WeeklyStatsSummary, WeeklyProgressChart } from '@/components/routine';
import { useWeeklyStats } from '@/hooks/routine';
import { LoadingSpinner } from '@/components/ui/icons';

/**
 * 주간 통계 상세 페이지
 *
 * 운동/식단 달성률 + 일별 현황 표시
 */
export default function WeeklyStatsPage() {
  const { data: stats, isLoading, error } = useWeeklyStats();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="주간 통계" />
        <div className="flex items-center justify-center p-8">
          <LoadingSpinner size="xl" />
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="주간 통계" />
        <div className="p-4">
          <p className="text-muted-foreground text-center">
            통계를 불러오는데 실패했습니다.
          </p>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!stats) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="주간 통계" />
        <div className="p-4">
          <p className="text-muted-foreground text-center">
            이번 주 예정된 루틴이 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <PageHeader title="주간 통계" />

      <div className="p-4 space-y-6">
        {/* 주간 기간 표시 */}
        <p className="text-sm text-muted-foreground text-center">
          {stats.weekLabel}
        </p>

        {/* 운동/식단 달성률 */}
        <WeeklyStatsSummary stats={stats} />

        {/* 일별 현황 차트 */}
        <WeeklyProgressChart stats={stats} />
      </div>
    </div>
  );
}
