'use client';

import { useState } from 'react';
import { BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ActivityRow from '@/components/ui/ActivityRow';
import DayGroup from '@/components/ui/DayGroup';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { WeeklyStats } from '@/hooks/routine';

type ActivityFilter = 'all' | 'workout' | 'meal';

interface WeeklyProgressChartProps {
  stats: WeeklyStats;
  /** 'large' 모드: 루틴 페이지에서 확대된 크기로 표시 */
  size?: 'default' | 'large';
  /** 외부 필터 (제공 시 인라인 토글 숨김) */
  filter?: ActivityFilter;
}

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
export default function WeeklyProgressChart({ stats, size = 'default', filter: externalFilter }: WeeklyProgressChartProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());
  const [internalFilter, setInternalFilter] = useState<ActivityFilter>('all');

  const filter = externalFilter ?? internalFilter;
  const isLarge = size === 'large';

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`font-medium text-foreground ${isLarge ? 'text-lg' : 'text-base'}`}>
          주간 기록
        </h3>
        {externalFilter === undefined && (
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={internalFilter}
            onChange={setInternalFilter}
          />
        )}
      </div>

      <div className="flex flex-col items-center overflow-hidden">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const hasWorkout = day.workout !== null;
          const hasMeal = day.meal !== null;

          const showWorkout = hasWorkout && (filter === 'all' || filter === 'workout');
          const showMeal = hasMeal && (filter === 'all' || filter === 'meal');
          const hasVisible = showWorkout || showMeal;

          const workoutMeta: string[] = [];
          if (day.workoutDuration) workoutMeta.push(`${day.workoutDuration}분`);
          if (day.workoutCalories) workoutMeta.push(`${day.workoutCalories}kcal`);

          const d = new Date(day.date);
          const dateNum = String(d.getDate());

          return (
            <div key={day.date} className="w-full">
              <DayGroup
                dateNum={dateNum}
                dayOfWeek={day.dayOfWeek}
                isToday={isToday}
                size={isLarge ? 'large' : 'default'}
              >
                {showWorkout && (
                  <ActivityRow
                    icon={BarbellIcon}
                    label={day.workoutTitle || '운동'}
                    meta={workoutMeta.length > 0 ? workoutMeta.join(' · ') : undefined}
                    status={day.workout!}
                    date={day.date}
                    href={`/routine/workout/${day.date}`}
                    size={isLarge ? 'large' : 'default'}
                  />
                )}
                {showMeal && (
                  <ActivityRow
                    icon={BowlFoodIcon}
                    label="식단"
                    meta={
                      day.mealCalories
                        ? `${day.mealCalories.toLocaleString()}kcal`
                        : undefined
                    }
                    status={day.meal!}
                    date={day.date}
                    href={`/routine/meal/${day.date}`}
                    size={isLarge ? 'large' : 'default'}
                  />
                )}
                {!hasVisible && (
                  <span className={`text-muted-foreground/50 ${isLarge ? 'text-sm' : 'text-xs'}`}>
                    활동 없음
                  </span>
                )}
              </DayGroup>
            </div>
          );
        })}
      </div>
    </div>
  );
}
