'use client';

import Link from 'next/link';
import { ChartBarIcon, CaretRightIcon, SparkleIcon } from '@phosphor-icons/react';
import type { WeeklyStats } from '@/hooks/routine';

interface WeeklyProgressCardProps {
  /** 주간 통계 데이터 (부모에서 Suspense 쿼리로 전달) */
  stats: WeeklyStats;
}

/**
 * 주간 진행률 요약 카드
 *
 * /routine 메인 페이지에서 컴팩트하게 표시
 * 클릭 시 /routine/stats로 이동
 *
 * - Suspense boundary에서 로딩 처리
 * - props로 stats 데이터를 받아 렌더링만 담당
 */
export default function WeeklyProgressCard({ stats }: WeeklyProgressCardProps) {

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
