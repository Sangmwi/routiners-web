'use client';

import { useMemo } from 'react';
import MainTabLayout from '@/components/common/MainTabLayout';
import {
  TodayEventSection,
  WeeklyCalendar,
  FloatingAIButton,
} from '@/components/routine';
import {
  useCalendarEvents,
  useRoutineEventByDate,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
} from '@/hooks/routine';
import { useActiveAISession } from '@/hooks/aiChat';

/**
 * 루틴 탭 메인 페이지 (오늘 + 주간 뷰)
 */
export default function RoutinePage() {
  const today = useMemo(() => new Date(), []);
  const todayStr = formatDate(today);

  // 이번 달 이벤트 조회 (주간 캘린더용)
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const { data: weekEvents = [] } = useCalendarEvents(year, month);

  // 오늘의 이벤트 조회
  const { data: todayEvent, isLoading: isLoadingToday } = useRoutineEventByDate(
    todayStr,
    'workout'
  );

  // 활성 AI 세션 확인
  const { data: activeSession } = useActiveAISession('workout');

  // 완료/건너뛰기 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();

  // 오늘 운동 완료
  const handleComplete = async () => {
    if (!todayEvent) return;
    try {
      await completeEvent.mutateAsync(todayEvent.id);
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  // 오늘 운동 건너뛰기
  const handleSkip = async () => {
    if (!todayEvent) return;
    try {
      await skipEvent.mutateAsync(todayEvent.id);
    } catch (err) {
      console.error('Failed to skip event:', err);
    }
  };

  return (
    <MainTabLayout>
      {/* 페이지 헤더 */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">내 루틴</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {formatDisplayDate(today)}
        </p>
      </div>

      {/* 오늘의 운동 */}
      <TodayEventSection
        event={todayEvent ?? null}
        isLoading={isLoadingToday}
        onComplete={handleComplete}
        onSkip={handleSkip}
        isActionLoading={completeEvent.isPending || skipEvent.isPending}
      />

      {/* 이번 주 캘린더 */}
      <WeeklyCalendar events={weekEvents} selectedDate={todayStr} />

      {/* AI 트레이너 플로팅 버튼 */}
      <FloatingAIButton hasActiveSession={!!activeSession} />
    </MainTabLayout>
  );
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });
}
