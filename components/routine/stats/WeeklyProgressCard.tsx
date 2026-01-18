'use client';

import Link from 'next/link';
import { ChartBarIcon, CaretRightIcon, SparkleIcon } from '@phosphor-icons/react';
import { useWeeklyStats } from '@/hooks/routine';

/**
 * 주간 진행률 요약 카드
 *
 * /routine 메인 페이지에서 컴팩트하게 표시
 * 클릭 시 /routine/stats로 이동
 */
export default function WeeklyProgressCard() {
  const { data: stats, isPending } = useWeeklyStats();

  // 로딩 스켈레톤 (실제 카드와 동일한 구조)
  if (isPending) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded-xl animate-pulse" />
            <div className="space-y-1.5">
              <div className="w-14 h-4 bg-muted rounded animate-pulse" />
              <div className="w-36 h-3.5 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <div className="w-5 h-5 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // 데이터 로드 실패
  if (!stats) {
    return null;
  }

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
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <SparkleIcon size={20} weight="duotone" className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">이번 주</p>
              <p className="text-xs text-muted-foreground">AI 코치로 루틴을 생성해보세요</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 운동/식단 완료 일수 계산
  const workoutCompletedDays = stats.workout.completed;
  const workoutTotalDays = stats.workout.completed + stats.workout.scheduled + stats.workout.skipped;
  const mealCompletedDays = stats.meal.completed;
  const mealTotalDays = stats.meal.completed + stats.meal.scheduled + stats.meal.skipped;

  // 요약 텍스트 생성
  const summaryParts: string[] = [];
  if (workoutTotalDays > 0) {
    summaryParts.push(`운동 ${workoutCompletedDays}/${workoutTotalDays}일`);
  }
  if (mealTotalDays > 0) {
    summaryParts.push(`식단 ${mealCompletedDays}/${mealTotalDays}일`);
  }
  const summaryText = summaryParts.join(' • ');

  return (
    <Link
      href="/routine/stats"
      className="block bg-card border border-border rounded-xl p-4 hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ChartBarIcon size={20} weight="fill" className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">이번 주</p>
            <p className="text-xs text-muted-foreground">{summaryText}</p>
          </div>
        </div>
        <CaretRightIcon size={20} className="text-muted-foreground" />
      </div>
    </Link>
  );
}
