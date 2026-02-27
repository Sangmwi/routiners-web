'use client';

import { Suspense, useState, useRef, useEffect, useTransition } from 'react';
import { EMPTY_STATE } from '@/lib/config/theme';
import PeriodNav from '@/components/ui/PeriodNav';
import UnderlineTabs from '@/components/ui/UnderlineTabs';
import TypeFilterToggle, { type FilterValue } from '@/components/ui/TypeFilterToggle';
import StreakBanner from '@/components/ui/StreakBanner';
import EmptyState from '@/components/common/EmptyState';
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
import { createRouteStateKey } from '@/lib/route-state/keys';
import { useRouteState } from '@/hooks/navigation';
import { usePathname } from 'next/navigation';

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
  const pathname = usePathname();
  const routeKey = createRouteStateKey(pathname);
  const { state, setState } = useRouteState<{
    tab: RoutineTab;
    filter: FilterValue;
    weekDateStr: string;
    calYear: number;
    calMonth: number;
    calSelectedDate: string;
  }>({
    key: routeKey,
    initialState: {
      tab: 'weekly',
      filter: 'all',
      weekDateStr: formatDate(new Date()),
      calYear: new Date().getFullYear(),
      calMonth: new Date().getMonth() + 1,
      calSelectedDate: formatDate(new Date()),
    },
  });
  const [tab, setTab] = useState<RoutineTab>(state.tab);
  const [filter, setFilter] = useState<FilterValue>(state.filter);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevTab = useRef(tab);

  // 주간 네비
  const weeklyNav = useStatsPeriodNavigator('weekly');

  // 캘린더 월 네비
  const todayDate = new Date();
  const [calYear, setCalYear] = useState(state.calYear ?? todayDate.getFullYear());
  const [calMonth, setCalMonth] = useState(state.calMonth ?? todayDate.getMonth() + 1);
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
  const [calSelectedDate, setCalSelectedDate] = useState<string>(state.calSelectedDate ?? today);

  useEffect(() => {
    setTab(state.tab);
    setFilter(state.filter);
    setCalYear(state.calYear);
    setCalMonth(state.calMonth);
    setCalSelectedDate(state.calSelectedDate);
    weeklyNav.setWeekBaseDate(
      parseDate(state.weekDateStr || formatDate(new Date())),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setState((prev) => ({
      ...prev,
      tab,
      filter,
      weekDateStr: weeklyNav.weekDateStr,
      calYear,
      calMonth,
      calSelectedDate,
    }));
  }, [tab, filter, weeklyNav.weekDateStr, calYear, calMonth, calSelectedDate, setState]);

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

  // 현재 주 빈 경우 체크
  const workoutTotal = stats ? stats.workout.completed + stats.workout.scheduled : 0;
  const mealTotal = stats ? stats.meal.completed + stats.meal.scheduled : 0;
  const isCurrentWeekEmpty = workoutTotal === 0 && mealTotal === 0;
  const prevWorkoutTotal = prevStats ? prevStats.workout.completed + prevStats.workout.scheduled : 0;
  const prevMealTotal = prevStats ? prevStats.meal.completed + prevStats.meal.scheduled : 0;
  const isPrevWeekEmpty = prevWorkoutTotal === 0 && prevMealTotal === 0;
  const isLikelyNewUser = isCurrentWeekEmpty && isPrevWeekEmpty;

  return (
    <div className="space-y-6">
      {/* 스트릭 배너 */}
      {streak >= 2 && <StreakBanner count={streak} />}

      {/* 빈 주간 안내 */}
      {isCurrentWeekEmpty && (
        isLikelyNewUser ? (
          <EmptyState
            {...EMPTY_STATE.routine.noRoutine}
            action={{ label: '루틴 만들기', href: '/routine/counselor' }}
          />
        ) : (
          <EmptyState {...EMPTY_STATE.routine.emptyWeek} />
        )
      )}

      {/* 주간 스케줄 (확대 사이즈) */}
      {stats && <WeeklySchedule stats={stats} size="large" filter={filter} onDelete={handleDelete} />}
    </div>
  );
}
