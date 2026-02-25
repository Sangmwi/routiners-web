'use client';

import { useState } from 'react';
import { BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ActivityRow from '@/components/ui/ActivityRow';
import DayGroup from '@/components/ui/DayGroup';
import { formatDate } from '@/lib/utils/dateHelpers';
import type { WeeklyStats } from '@/hooks/routine';

type ActivityFilter = 'all' | 'workout' | 'meal';

interface WeeklyScheduleProps {
  stats: WeeklyStats;
  /** 'large' 모드: 루틴 페이지에서 확대된 크기로 표시 */
  size?: 'default' | 'large';
  /** 외부 필터 (제공 시 인라인 토글 숨김) */
  filter?: ActivityFilter;
  /** 삭제 콜백 (롱프레스 → 확인 다이얼로그) */
  onDelete?: (id: string, date: string, type: 'workout' | 'meal') => void;
}

const FILTER_OPTIONS: { key: ActivityFilter; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'workout', label: '운동' },
  { key: 'meal', label: '식단' },
];

/**
 * 주간 루틴 스케줄
 *
 * 각 날짜에 운동/식단 활동을 개별 행으로 표시
 * - 필터: 전체 / 운동 / 식단
 * - 운동: 아이콘 + 제목 + 시간/칼로리 + 상태 (→ 운동 상세 링크)
 * - 식단: 아이콘 + "식단" + 칼로리 + 상태 (→ 식단 상세 링크)
 * - 활동 없는 날은 행 자체가 표시되지 않음
 */
export default function WeeklySchedule({ stats, size = 'default', filter: externalFilter, onDelete }: WeeklyScheduleProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());
  const [internalFilter, setInternalFilter] = useState<ActivityFilter>('all');

  const filter = externalFilter ?? internalFilter;
  const isLarge = size === 'large';

  return (
    <div>
      <div className="flex items-center justify-between">
        {externalFilter === undefined && (
          <SegmentedControl
            options={FILTER_OPTIONS}
            value={internalFilter}
            onChange={setInternalFilter}
          />
        )}
      </div>

      <div className="flex flex-col divide-y divide-edge-divider">
        {dailyStats.map((day) => {
          const isToday = day.date === today;
          const hasWorkout = day.workout !== null;
          const hasMeal = day.meal !== null;

          const showWorkout = filter === 'all' || filter === 'workout';
          const showMeal = filter === 'all' || filter === 'meal';

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
                  hasWorkout ? (
                    <ActivityRow
                      icon={BarbellIcon}
                      label={day.workoutTitle || '운동'}
                      meta={workoutMeta.length > 0 ? workoutMeta.join(' · ') : undefined}
                      status={day.workout!}
                      date={day.date}
                      href={`/routine/workout/${day.date}`}
                      size={isLarge ? 'large' : 'default'}
                      onLongPress={onDelete && day.workoutEventId ? () => onDelete(day.workoutEventId!, day.date, 'workout') : undefined}
                    />
                  ) : (
                    <ActivityRow
                      icon={BarbellIcon}
                      label="없음"
                      href={`/routine/workout/${day.date}`}
                      size={isLarge ? 'large' : 'default'}
                      isNone
                    />
                  )
                )}
                {showMeal && (
                  hasMeal ? (
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
                      onLongPress={onDelete && day.mealEventId ? () => onDelete(day.mealEventId!, day.date, 'meal') : undefined}
                    />
                  ) : (
                    <ActivityRow
                      icon={BowlFoodIcon}
                      label="없음"
                      href={`/routine/meal/${day.date}`}
                      size={isLarge ? 'large' : 'default'}
                      isNone
                    />
                  )
                )}
              </DayGroup>
            </div>
          );
        })}
      </div>
    </div>
  );
}
