'use client';

import AppLink from '@/components/common/AppLink';
import { SparkleIcon, CaretRightIcon } from '@phosphor-icons/react';
import { WeekDots } from './WeekDots';
import type { WeeklyStats } from '@/hooks/routine';

interface WeeklyOverviewProps {
  stats: WeeklyStats;
}

/**
 * 이번 주 현황 섹션
 * - 헤더와 콘텐츠 분리
 * - 연한 배경의 단일 컨테이너
 * - 인라인 프로그레스 바
 */
export function WeeklyOverview({ stats }: WeeklyOverviewProps) {
  // 이벤트 수 계산
  const totalEvents =
    stats.workout.scheduled +
    stats.workout.completed +
    stats.workout.skipped +
    stats.meal.scheduled +
    stats.meal.completed +
    stats.meal.skipped;

  // 이벤트 없음 - 루틴 생성 안내
  if (totalEvents === 0) {
    return (
      <section>
        <h2 className="text-xl font-bold text-foreground mb-4">이번 주</h2>
        <div className="rounded-2xl bg-muted/30 p-4 text-center">
          <SparkleIcon size={24} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            AI 코치로 루틴을 생성해보세요
          </p>
        </div>
      </section>
    );
  }

  // 완료된 일수 계산
  const completedDays = stats.dailyStats.filter(d =>
    d.workout === 'completed' || d.meal === 'completed'
  ).length;

  // 전체 완료율 계산
  const totalScheduled = stats.workout.scheduled + stats.meal.scheduled;
  const totalCompleted = stats.workout.completed + stats.meal.completed;
  const completionRate = totalScheduled > 0
    ? Math.round((totalCompleted / (totalScheduled + totalCompleted)) * 100)
    : 0;

  return (
    <section>
      {/* 헤더 - 카드 밖 */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">이번 주</h2>
        <AppLink href="/routine/stats" className="text-sm font-medium text-primary flex items-center gap-0.5">
          통계 보기
          <CaretRightIcon size={16} weight="bold" />
        </AppLink>
      </div>

      {/* 콘텐츠 - 단일 컨테이너 */}
      <div className="rounded-2xl bg-muted/30 p-4">
        {/* 7일 도트 */}
        <WeekDots dailyStats={stats.dailyStats} />

        {/* 진행률 */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{completedDays}/7일 완료</span>
          <span className="text-sm font-semibold text-foreground">{completionRate}%</span>
        </div>

        {/* 프로그레스 바 - 인라인 */}
        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${Math.min(100, Math.max(0, completionRate))}%` }}
          />
        </div>
      </div>
    </section>
  );
}

export default WeeklyOverview;
