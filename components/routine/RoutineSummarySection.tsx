'use client';

import RoutineSummaryCard from './RoutineSummaryCard';
import { getEventConfig } from '@/lib/config/theme';
import type { RoutineEvent, WorkoutData } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

/**
 * 타입 가드: MealData인지 확인
 */
function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
}

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
  // 운동 데이터 확인
  const workoutData = workoutEvent?.data && isWorkoutData(workoutEvent.data) ? workoutEvent.data : null;
  const mealData = mealEvent?.data && isMealData(mealEvent.data) ? mealEvent.data : null;

  // 운동 진행률 계산
  const workoutProgress = workoutData?.exercises
    ? {
        total: workoutData.exercises.length,
        completed: workoutData.exercises.filter((e) => e.completed).length,
      }
    : undefined;

  // 운동 부제목 생성
  const workoutSubtitle = workoutData?.exercises
    ? `${workoutData.exercises.length}개 운동 • ${workoutData.estimatedDuration || 0}분`
    : undefined;

  // 식단 부제목 생성
  const mealSubtitle = mealData?.meals
    ? `${mealData.meals.length}끼 • ${mealData.estimatedTotalCalories || mealData.targetCalories || 0}kcal`
    : undefined;

  // 식단 진행률 (향후 구현)
  const mealProgress = undefined;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-foreground">오늘의 루틴</h2>

      <div className="space-y-3">
        {/* 운동 카드 */}
        {(() => {
          const config = getEventConfig('workout');
          return (
            <RoutineSummaryCard
              type="workout"
              title={workoutEvent?.title || config.label}
              subtitle={workoutSubtitle}
              progress={workoutProgress}
              status={workoutEvent?.status}
              icon={<config.icon size={24} weight="fill" />}
              onClick={onNavigateToWorkout}
              isLoading={isLoadingWorkout}
              isEmpty={!workoutEvent}
              emptyMessage="오늘 예정된 운동이 없습니다"
            />
          );
        })()}

        {/* 식단 카드 */}
        {(() => {
          const config = getEventConfig('meal');
          return (
            <RoutineSummaryCard
              type="meal"
              title={mealEvent?.title || config.label}
              subtitle={mealSubtitle}
              progress={mealProgress}
              status={mealEvent?.status}
              icon={<config.icon size={24} weight="fill" />}
              onClick={onNavigateToMeal}
              isLoading={isLoadingMeal}
              isEmpty={!mealEvent}
              emptyMessage="오늘 예정된 식단이 없습니다"
            />
          );
        })()}
      </div>
    </section>
  );
}
