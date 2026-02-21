'use client';

import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BarbellIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import { getDisplayStatus } from '@/lib/config/theme';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
}

/**
 * 일별 상세 기록 테이블
 *
 * 각 날짜에 운동/식단 활동을 개별 행으로 표시
 * - 운동: 아이콘 + 제목 + 시간/칼로리 + 상태
 * - 식단: 아이콘 + "식단" + 칼로리 + 상태
 * - 빈 날: "활동 없음" 표시
 */
export default function WeeklyProgressChart({ stats }: WeeklyProgressChartProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-3">일별 기록</h3>

      <div className="bg-muted/20 rounded-2xl divide-y divide-border/20 overflow-hidden">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const hasWorkout = day.workout !== null;
          const hasMeal = day.meal !== null;
          const hasAny = hasWorkout || hasMeal;

          const workoutMeta: string[] = [];
          if (day.workoutDuration) workoutMeta.push(`${day.workoutDuration}분`);
          if (day.workoutCalories) workoutMeta.push(`${day.workoutCalories}kcal`);

          return (
            <div
              key={day.date}
              className={`px-4 py-3 ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="flex gap-3">
                {/* 요일 */}
                <span
                  className={`text-xs font-semibold w-5 shrink-0 pt-0.5 ${
                    isToday ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {day.dayOfWeek}
                </span>

                {/* 활동 행들 */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  {hasWorkout && (
                    <ActivityRow
                      icon={BarbellIcon}
                      label={day.workoutTitle || '운동'}
                      meta={workoutMeta.length > 0 ? workoutMeta.join(' · ') : undefined}
                      status={day.workout!}
                      date={day.date}
                    />
                  )}
                  {hasMeal && (
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
                    />
                  )}
                  {!hasAny && (
                    <span className="text-[11px] text-muted-foreground/50">
                      활동 없음
                    </span>
                  )}
                </div>
              </div>
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
}: {
  icon: PhosphorIcon;
  label: string;
  meta?: string;
  status: EventStatus;
  date: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={13} weight="fill" className="text-primary shrink-0" />
      <span className="text-xs font-medium text-foreground truncate">
        {label}
      </span>
      {meta && (
        <span className="text-[10px] text-muted-foreground shrink-0">
          {meta}
        </span>
      )}
      <span className="ml-auto shrink-0">
        <StatusPill status={status} date={date} />
      </span>
    </div>
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
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-primary">
        <CheckCircleIcon size={12} weight="fill" />
        완료
      </span>
    );
  }
  if (displayStatus === 'incomplete') {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground/40">
        <XCircleIcon size={12} weight="fill" />
        미완료
      </span>
    );
  }
  // scheduled
  return (
    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-scheduled">
      <ClockIcon size={12} weight="duotone" />
      예정
    </span>
  );
}
