'use client';

import MainTabLayout from '@/components/common/MainTabLayout';
import { RoutineSection, FloatingAIButton } from '@/components/routine';
import { useUpcomingEvents } from '@/hooks/routine';
import { useActiveAISession } from '@/hooks/aiChat';

/**
 * 루틴 탭 메인 페이지 (섹션 기반 v2)
 *
 * - 운동 섹션: 과거 7일 + 오늘 + 미래 14일 캐러셀
 * - 식단 섹션: 과거 7일 + 오늘 + 미래 14일 캐러셀
 * - 초기 로드 시 "오늘" 카드로 자동 스크롤
 * - 전체보기 → 캘린더 (타입 필터 프리셋)
 */
export default function RoutinePage() {
  const today = new Date();

  // 과거 7일 + 오늘 + 미래 14일 이벤트 조회
  const { data: workoutEvents = [], isLoading: isLoadingWorkout } =
    useUpcomingEvents('workout', 7, 14);
  const { data: mealEvents = [], isLoading: isLoadingMeal } =
    useUpcomingEvents('meal', 7, 14);

  // 활성 AI 세션 확인
  const { data: workoutSession } = useActiveAISession('workout');
  const { data: mealSession } = useActiveAISession('meal');

  return (
    <MainTabLayout>
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">내 루틴</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDisplayDate(today)}
        </p>
      </div>

      {/* 운동 섹션 */}
      <RoutineSection
        type="workout"
        events={workoutEvents}
        isLoading={isLoadingWorkout}
      />

      {/* 식단 섹션 */}
      <RoutineSection
        type="meal"
        events={mealEvents}
        isLoading={isLoadingMeal}
      />

      {/* AI 코치 플로팅 버튼 */}
      <FloatingAIButton
        workoutSession={workoutSession}
        mealSession={mealSession}
      />
    </MainTabLayout>
  );
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
