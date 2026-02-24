'use client';

import { Suspense, useState, useRef, useEffect, useTransition } from 'react';
import { BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import PeriodNav from '@/components/ui/PeriodNav';
import UnderlineTabs from '@/components/ui/UnderlineTabs';
import TypeFilterToggle, { type FilterValue } from '@/components/ui/TypeFilterToggle';
import ProgressRateBar from '@/components/ui/ProgressRateBar';
import StreakBanner from '@/components/ui/StreakBanner';
import WeeklySchedule from '@/components/routine/WeeklySchedule';
import DateJumpSheet from '@/components/ui/DateJumpSheet';
import CalendarContent from '@/components/routine/calendar/CalendarContent';
import { CounselorButton } from '@/components/counselor';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { useWeeklyStatsSuspense, useDeleteRoutineEvent } from '@/hooks/routine';
import { useActiveCounselorConversation } from '@/hooks/counselor';
import { useConfirmDialog } from '@/lib/stores/modalStore';
import { useStatsPeriodNavigator } from '@/hooks/routine/useStatsPeriodNavigator';
import { computeWorkoutStreak } from '@/lib/stats/computations';
import { addDays, formatDate, parseDate } from '@/lib/utils/dateHelpers';

type RoutineTab = 'weekly' | 'calendar';

const TABS = [
  { value: 'weekly' as const, label: '주간' },
  { value: 'calendar' as const, label: '캘린더' },
];

/**
 * 루틴 페이지 메인 콘텐츠
 *
 * 구조:
 * [주간] [캘린더]          [전체 | 운동 | 식단]
 * <         날짜 네비         >
 * [콘텐츠...]
 */
export default function RoutineContent() {
  const [tab, setTab] = useState<RoutineTab>('weekly');
  const [filter, setFilter] = useState<FilterValue>('all');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevTab = useRef(tab);

  // 주간 네비
  const weeklyNav = useStatsPeriodNavigator('weekly');

  // 캘린더 월 네비
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(todayDate.getMonth() + 1);
  const [isCalPending, startCalTransition] = useTransition();

  const handleCalPrev = () => {
    startCalTransition(() => {
      if (calMonth === 1) { setCalYear((y) => y - 1); setCalMonth(12); }
      else setCalMonth((m) => m - 1);
    });
  };

  const handleCalNext = () => {
    startCalTransition(() => {
      if (calMonth === 12) { setCalYear((y) => y + 1); setCalMonth(1); }
      else setCalMonth((m) => m + 1);
    });
  };

  // 공통 DateJumpSheet
  const [isDateJumpOpen, setIsDateJumpOpen] = useState(false);
  const [dateJumpSession, setDateJumpSession] = useState(0);

  const today = formatDate(new Date());
  const minDate = `${new Date().getFullYear() - 5}-01-01`;
  const calMaxDate = formatDate(
    new Date(todayDate.getFullYear() + 2, todayDate.getMonth(), todayDate.getDate()),
  );

  // 캘린더 날짜 점프 시 selectedDate도 업데이트 필요
  const [calSelectedDate, setCalSelectedDate] = useState<string>(today);

  useEffect(() => {
    if (prevTab.current !== tab) {
      const prevIdx = TABS.findIndex((t) => t.value === prevTab.current);
      const nextIdx = TABS.findIndex((t) => t.value === tab);
      setDirection(nextIdx > prevIdx ? 'right' : 'left');
      prevTab.current = tab;
    }
  }, [tab]);

  const { data: activeConversation } = useActiveCounselorConversation();

  const openDateJump = () => {
    setDateJumpSession((prev) => prev + 1);
    setIsDateJumpOpen(true);
  };

  return (
    <>
      <UnderlineTabs
        tabs={TABS}
        value={tab}
        onChange={setTab}
        layout="auto"
        rightSlot={
          <TypeFilterToggle value={filter} onChange={setFilter} size="md" />
        }
      />

      {tab === 'weekly' ? (
        <PeriodNav
          label={weeklyNav.label}
          onPrev={weeklyNav.handlePrev}
          onNext={weeklyNav.handleNext}
          canGoNext={weeklyNav.canGoNext}
          onLabelClick={openDateJump}
        />
      ) : (
        <PeriodNav
          label={`${calYear}년 ${calMonth}월`}
          onPrev={handleCalPrev}
          onNext={handleCalNext}
          canGoNext={true}
          onLabelClick={openDateJump}
          labelAriaLabel="월 선택"
        />
      )}

      <div className="[overflow-x:clip] -mx-(--layout-padding-x) px-(--layout-padding-x)">
        <div
          key={tab}
          className="animate-tab-slide pb-footer-clearance"
          style={{
            '--slide-from': direction === 'right' ? '30px' : '-30px',
          } as React.CSSProperties}
        >
          {tab === 'weekly' && (
            <Suspense fallback={<PulseLoader />}>
              <WeeklyContent
                weekDateStr={weeklyNav.weekDateStr}
                filter={filter}
              />
            </Suspense>
          )}
          {tab === 'calendar' && (
            <Suspense fallback={<PulseLoader />}>
              <CalendarContent
                year={calYear}
                month={calMonth}
                isPending={isCalPending}
                selectedDate={calSelectedDate}
                onSelectDate={setCalSelectedDate}
                filter={filter}
              />
            </Suspense>
          )}
        </div>
      </div>

      {tab === 'weekly' ? (
        <DateJumpSheet
          key={`routine-week-${dateJumpSession}`}
          mode="date"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="날짜 선택"
          value={weeklyNav.weekDateStr}
          minDate={minDate}
          maxDate={today}
          onConfirm={({ date }) => {
            weeklyNav.setWeekBaseDate(parseDate(date));
          }}
        />
      ) : (
        <DateJumpSheet
          key={`calendar-date-${dateJumpSession}`}
          mode="date"
          isOpen={isDateJumpOpen}
          onClose={() => setIsDateJumpOpen(false)}
          title="날짜 선택"
          value={calSelectedDate}
          minDate={minDate}
          maxDate={calMaxDate}
          onConfirm={({ date }) => {
            const nextDate = parseDate(date);
            startCalTransition(() => {
              setCalYear(nextDate.getFullYear());
              setCalMonth(nextDate.getMonth() + 1);
              setCalSelectedDate(date);
            });
          }}
        />
      )}

      <CounselorButton activeConversation={activeConversation} />
    </>
  );
}

// ─── 주간 콘텐츠 (Suspense 안: 데이터 의존 부분만) ─────────────────────

function WeeklyContent({
  weekDateStr,
  filter,
}: {
  weekDateStr: string;
  filter: FilterValue;
}) {
  // 현재 주 + 이전 주 통계
  const stats = useWeeklyStatsSuspense(weekDateStr);
  const prevDateStr = formatDate(addDays(new Date(weekDateStr), -7));
  const prevStats = useWeeklyStatsSuspense(prevDateStr);

  // 롱프레스 삭제
  const deleteEvent = useDeleteRoutineEvent();
  const confirm = useConfirmDialog();

  const handleDelete = (id: string, date: string, type: 'workout' | 'meal') => {
    confirm({
      title: '루틴을 삭제하시겠어요?',
      message: '삭제하면 되돌릴 수 없어요.',
      confirmText: '삭제',
      onConfirm: async () => { await deleteEvent.mutateAsync({ id, date, type }); },
    });
  };

  // 스트릭 계산 (이전 주 + 현재 주 합산)
  const allDailyStats = [
    ...(prevStats?.dailyStats ?? []),
    ...(stats?.dailyStats ?? []),
  ];
  const streak = computeWorkoutStreak(allDailyStats);

  // 운동 진행률 비교
  const workoutTotal = stats ? stats.workout.completed + stats.workout.scheduled : 0;
  const workoutComparison =
    prevStats && (prevStats.workout.completed + prevStats.workout.scheduled) > 0
      ? { diff: stats.workout.completionRate - prevStats.workout.completionRate, label: '지난주' }
      : undefined;

  // 식단 진행률 비교
  const mealTotal = stats ? stats.meal.completed + stats.meal.scheduled : 0;
  const mealComparison =
    prevStats && (prevStats.meal.completed + prevStats.meal.scheduled) > 0
      ? { diff: stats.meal.completionRate - prevStats.meal.completionRate, label: '지난주' }
      : undefined;

  return (
    <div className="space-y-6">
      {/* 스트릭 배너 */}
      {streak >= 2 && <StreakBanner count={streak} />}

      {/* 진행률 2열 */}
      <div className="grid grid-cols-2 gap-3">
        <ProgressRateBar
          icon={BarbellIcon}
          label="운동"
          completionRate={stats?.workout.completionRate ?? 0}
          completed={stats?.workout.completed ?? 0}
          total={workoutTotal}
          comparison={workoutComparison}
        />
        <ProgressRateBar
          icon={BowlFoodIcon}
          label="식단"
          completionRate={stats?.meal.completionRate ?? 0}
          completed={stats?.meal.completed ?? 0}
          total={mealTotal}
          comparison={mealComparison}
        />
      </div>

      {/* 주간 스케줄 (확대 사이즈) */}
      {stats && <WeeklySchedule stats={stats} size="large" filter={filter} onDelete={handleDelete} />}
    </div>
  );
}
