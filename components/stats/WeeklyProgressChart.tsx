'use client';

import { useState } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BarbellIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import AppLink from '@/components/common/AppLink';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { formatDate } from '@/lib/utils/dateHelpers';
import { getDisplayStatus } from '@/lib/config/theme';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
}

type ActivityFilter = 'all' | 'workout' | 'meal';

const FILTER_OPTIONS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'workout', label: '운동' },
  { key: 'meal', label: '식단' },
];

/**
 * 일별 상세 기록 테이블
 *
 * 각 날짜에 운동/식단 활동을 개별 행으로 표시
 * - 필터: 전체 / 운동 / 식단
 * - 운동: 아이콘 + 제목 + 시간/칼로리 + 상태 (→ 운동 상세 링크)
 * - 식단: 아이콘 + "식단" + 칼로리 + 상태 (→ 식단 상세 링크)
 * - 빈 날: "활동 없음" 표시
 */
export default function WeeklyProgressChart({ stats }: WeeklyProgressChartProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());
  const [filter, setFilter] = useState<ActivityFilter>('all');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-foreground">주간 기록</h3>
        <SegmentedControl
          options={FILTER_OPTIONS}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="flex flex-col items-center overflow-hidden">
        {dailyStats.map((day, index) => {
          const isToday = day.date === today;
          const hasWorkout = day.workout !== null;
          const hasMeal = day.meal !== null;

          const showWorkout = hasWorkout && (filter === 'all' || filter === 'workout');
          const showMeal = hasMeal && (filter === 'all' || filter === 'meal');
          const hasVisible = showWorkout || showMeal;

          const workoutMeta: string[] = [];
          if (day.workoutDuration) workoutMeta.push(`${day.workoutDuration}분`);
          if (day.workoutCalories) workoutMeta.push(`${day.workoutCalories}kcal`);

          return (
            <div key={day.date} className="w-full">
              <div
                className={`rounded-2xl px-4 py-3 ${isToday ? 'bg-primary/5' : ''}`}
              >
                <div className="flex gap-3">
                  {/* 요일 */}
                  <span
                    className={`text-xs font-semibold w-6 shrink-0 pt-0.5 ${
                      isToday ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {day.dayOfWeek}
                  </span>

                  {/* 활동 행들 */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    {showWorkout && (
                      <ActivityRow
                        icon={BarbellIcon}
                        label={day.workoutTitle || '운동'}
                        meta={workoutMeta.length > 0 ? workoutMeta.join(' · ') : undefined}
                        status={day.workout!}
                        date={day.date}
                        href={`/routine/workout/${day.date}`}
                      />
                    )}
                    {showMeal && (
                      <ActivityRow
                        icon={ForkKnifeIcon}
                        label="식단"
                        meta={
                          day.mealCalories
                            ? `${day.mealCalories.toLocaleString()}kcal`
                            : undefined
                        }
                        status={day.meal!}
                        date={day.date}
                        href={`/routine/meal/${day.date}`}
                      />
                    )}
                    {!hasVisible && (
                      <span className="text-xs text-muted-foreground/50">
                        활동 없음
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {/* {index < dailyStats.length - 1 && (
                <div className="w-full h-px bg-border/50 mx-auto" />
              )} */}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityRow({
  icon: Icon,
  label,
  meta,
  status,
  date,
  href,
}: {
  icon: PhosphorIcon;
  label: string;
  meta?: string;
  status: EventStatus;
  date: string;
  href: string;
}) {
  return (
    <AppLink href={href} className="flex items-center gap-1.5 w-full text-left">
      <Icon size={15} weight="fill" className="text-primary shrink-0" />
      <span className="text-xs font-medium text-foreground truncate">
        {label}
      </span>
      {meta && (
        <span className="text-[11px] text-muted-foreground shrink-0">
          {meta}
        </span>
      )}
      <span className="ml-auto shrink-0">
        <StatusPill status={status} date={date} />
      </span>
    </AppLink>
  );
}

function StatusPill({
  status,
  date,
}: {
  status: EventStatus;
  date: string;
}) {
  const displayStatus = getDisplayStatus(status, date);

  if (displayStatus === 'completed') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary">
        <CheckCircleIcon size={14} weight="fill" />
        완료
      </span>
    );
  }
  if (displayStatus === 'incomplete') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground/40">
        <XCircleIcon size={14} weight="fill" />
        미완료
      </span>
    );
  }
  // scheduled
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-scheduled">
      <ClockIcon size={14} weight="duotone" />
      예정
    </span>
  );
}
