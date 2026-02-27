'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import SegmentedControl from '@/components/ui/SegmentedControl';
import ActivityRow from '@/components/ui/ActivityRow';
import DayGroup from '@/components/ui/DayGroup';
import WorkoutAddSheet, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddSheet';
import MealAddSheet, { type MealAddOption } from '@/components/routine/meal/MealAddSheet';
import WorkoutCreateDrawer from '@/components/routine/sheets/WorkoutCreateDrawer';
import MealCreateDrawer from '@/components/routine/sheets/MealCreateDrawer';
import UnitMealImportDrawer from '@/components/routine/sheets/UnitMealImportDrawer';
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
 * - 활동 없는 날은 "없음" 행 + 우측 PlusIcon → AddDrawer
 */
export default function WeeklySchedule({ stats, size = 'default', filter: externalFilter, onDelete }: WeeklyScheduleProps) {
  const { dailyStats } = stats;
  const today = formatDate(new Date());
  const [internalFilter, setInternalFilter] = useState<ActivityFilter>('all');
  const router = useRouter();

  const filter = externalFilter ?? internalFilter;
  const isLarge = size === 'large';

  // 추가 드로어/시트 상태
  const [addTarget, setAddTarget] = useState<{ date: string; type: 'workout' | 'meal' } | null>(null);
  const [activeSheet, setActiveSheet] = useState<'workout' | 'meal' | 'import' | null>(null);

  const handleOpenAdd = (date: string, type: 'workout' | 'meal') => {
    setAddTarget({ date, type });
  };

  const handleWorkoutOption = (option: WorkoutAddOption) => {
    if (option === 'ai') {
      setAddTarget(null);
      router.push('/routine/counselor');
    } else {
      setActiveSheet('workout');
    }
  };

  const handleMealOption = (option: MealAddOption) => {
    if (option === 'ai') {
      setAddTarget(null);
      router.push('/routine/counselor');
    } else if (option === 'direct') {
      setActiveSheet('meal');
    } else {
      setActiveSheet('import');
    }
  };

  const handleCreated = () => {
    if (addTarget) router.push(`/routine/${addTarget.type}/${addTarget.date}`);
    setActiveSheet(null);
    setAddTarget(null);
  };

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
                      onAdd={() => handleOpenAdd(day.date, 'workout')}
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
                      onAdd={() => handleOpenAdd(day.date, 'meal')}
                    />
                  )
                )}
              </DayGroup>
            </div>
          );
        })}
      </div>

      {/* 추가 드로어 */}
      <WorkoutAddSheet
        isOpen={addTarget?.type === 'workout'}
        onClose={() => setAddTarget(null)}
        onSelect={handleWorkoutOption}
      />
      <MealAddSheet
        isOpen={addTarget?.type === 'meal'}
        onClose={() => setAddTarget(null)}
        onSelect={handleMealOption}
      />

      {/* 추가 시트 */}
      <WorkoutCreateDrawer
        isOpen={activeSheet === 'workout'}
        onClose={() => { setActiveSheet(null); setAddTarget(null); }}
        date={addTarget?.date ?? ''}
        onCreated={() => handleCreated()}
      />
      <MealCreateDrawer
        isOpen={activeSheet === 'meal'}
        onClose={() => { setActiveSheet(null); setAddTarget(null); }}
        date={addTarget?.date ?? ''}
        onCreated={() => handleCreated()}
      />
      <UnitMealImportDrawer
        isOpen={activeSheet === 'import'}
        onClose={() => { setActiveSheet(null); setAddTarget(null); }}
        date={addTarget?.date ?? ''}
        onCreated={() => handleCreated()}
      />
    </div>
  );
}
