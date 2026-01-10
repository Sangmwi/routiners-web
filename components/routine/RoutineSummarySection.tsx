'use client';

import { Dumbbell, Utensils } from 'lucide-react';
import RoutineSummaryCard from './RoutineSummaryCard';
import type { RoutineEvent } from '@/lib/types/routine';

interface RoutineSummarySectionProps {
  /** 운동 이벤트 */
  workoutEvent?: RoutineEvent | null;
  /** 식단 이벤트 */
  mealEvent?: RoutineEvent | null;
  /** 운동 로딩 상태 */
  isLoadingWorkout?: boolean;
  /** 식단 로딩 상태 */
  isLoadingMeal?: boolean;
  /** 운동 상세 페이지 이동 */
  onNavigateToWorkout?: () => void;
  /** 식단 상세 페이지 이동 */
  onNavigateToMeal?: () => void;
}

/**
 * 오늘의 루틴 요약 섹션
 *
 * 운동과 식단 카드를 세로로 배치
 * - 각 카드 클릭 시 상세 페이지로 이동
 * - 빈 상태 처리 포함
 */
export default function RoutineSummarySection({
  workoutEvent,
  mealEvent,
  isLoadingWorkout = false,
  isLoadingMeal = false,
  onNavigateToWorkout,
  onNavigateToMeal,
}: RoutineSummarySectionProps) {
  // 운동 진행률 계산
  const workoutProgress = workoutEvent?.data?.exercises
    ? {
        total: workoutEvent.data.exercises.length,
        completed: workoutEvent.data.exercises.filter((e) => e.completed).length,
      }
    : undefined;

  // 운동 부제목 생성
  const workoutSubtitle = workoutEvent?.data?.exercises
    ? `${workoutEvent.data.exercises.length}개 운동 • ${workoutEvent.data.estimatedDuration || 0}분`
    : undefined;

  // 식단 진행률 (향후 구현)
  const mealProgress = undefined;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">오늘의 루틴</h2>

      <div className="space-y-3">
        {/* 운동 카드 */}
        <RoutineSummaryCard
          type="workout"
          title={workoutEvent?.title || '운동'}
          subtitle={workoutSubtitle}
          progress={workoutProgress}
          status={workoutEvent?.status}
          icon={<Dumbbell className="w-6 h-6" />}
          onClick={onNavigateToWorkout}
          isLoading={isLoadingWorkout}
          isEmpty={!workoutEvent}
          emptyMessage="오늘 예정된 운동이 없습니다"
        />

        {/* 식단 카드 */}
        <RoutineSummaryCard
          type="meal"
          title={mealEvent?.title || '식단'}
          subtitle="식단 기능 준비중"
          progress={mealProgress}
          status={mealEvent?.status}
          icon={<Utensils className="w-6 h-6" />}
          onClick={onNavigateToMeal}
          isLoading={isLoadingMeal}
          isEmpty={!mealEvent}
          emptyMessage="오늘 예정된 식단이 없습니다"
        />
      </div>
    </section>
  );
}
