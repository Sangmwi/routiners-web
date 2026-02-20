'use client';

import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BarbellIcon,
  ForkKnifeIcon,
} from '@phosphor-icons/react';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { WeeklyStats } from '@/hooks/routine';
import type { EventStatus } from '@/lib/types/routine';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
}

/**
 * 일별 상세 기록 테이블
 *
 * 7일 각 행에 운동 제목·시간·칼로리 + 운동/식단 상태 아이콘
 * 루틴탭의 간결한 7-column 아이콘 그리드와 차별화
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

          // 운동 메트릭 요약 텍스트
          const workoutMeta: string[] = [];
          if (day.workoutDuration) workoutMeta.push(`${day.workoutDuration}분`);
          if (day.workoutCalories) workoutMeta.push(`${day.workoutCalories}kcal`);

          return (
            <div
              key={day.date}
              className={`flex items-center gap-3 px-4 py-3 ${
                isToday ? 'bg-primary/5' : ''
              }`}
            >
              {/* 요일 */}
              <span
                className={`text-xs font-semibold w-5 shrink-0 ${
                  isToday ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {day.dayOfWeek}
              </span>

              {/* 운동 상세 */}
              <div className="flex-1 min-w-0">
                {hasWorkout && day.workoutTitle ? (
                  <div className="flex items-center gap-1.5">
                    <BarbellIcon size={13} weight="fill" className="text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">
                      {day.workoutTitle}
                    </span>
                    {workoutMeta.length > 0 && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {workoutMeta.join(' · ')}
                      </span>
                    )}
                  </div>
                ) : !hasAny ? (
                  <span className="text-[11px] text-muted-foreground/40">—</span>
                ) : hasMeal && !hasWorkout ? (
                  <div className="flex items-center gap-1.5">
                    <ForkKnifeIcon size={13} weight="fill" className="text-primary/70 shrink-0" />
                    <span className="text-[11px] text-muted-foreground">
                      식단{day.mealCalories ? ` · ${day.mealCalories.toLocaleString()}kcal` : ''}
                    </span>
                  </div>
                ) : null}
              </div>

              {/* 상태 아이콘 (운동 + 식단) */}
              <div className="flex items-center gap-1.5 shrink-0">
                {hasWorkout && (
                  <StatusBadge status={day.workout!} isToday={isToday} />
                )}
                {hasMeal && (
                  <StatusBadge status={day.meal!} isToday={isToday} isMeal />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  isToday,
  isMeal,
}: {
  status: EventStatus;
  isToday: boolean;
  isMeal?: boolean;
}) {
  const size = 14;

  if (status === 'completed') {
    return (
      <CheckCircleIcon
        size={size}
        weight="fill"
        className={isMeal ? 'text-primary/70' : 'text-primary'}
      />
    );
  }
  if (status === 'scheduled') {
    return (
      <ClockIcon
        size={size}
        weight="duotone"
        className={isToday ? 'text-primary' : 'text-amber-500'}
      />
    );
  }
  // skipped
  return (
    <XCircleIcon size={size} weight="fill" className="text-muted-foreground/50" />
  );
}
