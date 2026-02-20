'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLink from '@/components/common/AppLink';
import { BarbellIcon, ForkKnifeIcon, PlusIcon, CheckCircleIcon } from '@phosphor-icons/react';
import { formatKoreanDate, formatDate } from '@/lib/utils/dateHelpers';
import { isWorkoutData, isMealData } from '@/lib/types/guards';
import type { RoutineEvent } from '@/lib/types/routine';
import { MEAL_TIME } from '@/lib/config/theme/event';
import WorkoutAddDrawer, { type WorkoutAddOption } from '@/components/routine/workout/WorkoutAddDrawer';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';

interface TodayRoutineCardProps {
  workoutEvent: RoutineEvent | null;
  mealEvent: RoutineEvent | null;
}

/**
 * 홈 화면 "오늘의 루틴" 2열 카드
 *
 * - 운동/식단 라벨이 카드 밖(상단)에 고정
 * - 라벨 우측에 x/y개 · x/y끼 진행률 표시
 * - 데이터 카드: 타이틀 + 겹치는 아이콘 + 정보 + 진행률 바
 * - 빈 상태 탭 → 드로어 열림
 */
export default function TodayRoutineCard({ workoutEvent, mealEvent }: TodayRoutineCardProps) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-bold text-card-foreground">오늘의 루틴</h2>
        <span className="text-sm font-light text-muted-foreground">
          {formatKoreanDate(new Date(), { weekday: true })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <WorkoutColumn event={workoutEvent} />
        <MealColumn event={mealEvent} />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// 운동 열
// ---------------------------------------------------------------------------

function WorkoutColumn({ event }: { event: RoutineEvent | null }) {
  const router = useRouter();
  const today = formatDate(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleOption = (option: WorkoutAddOption) => {
    setIsDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else {
      setIsSheetOpen(true);
    }
  };

  const data = event && isWorkoutData(event.data) ? event.data : null;
  const exercises = data?.exercises ?? [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const totalCount = exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // 종목별 아이콘 (최대 4개 표시, 나머지 +N)
  // TODO: 종목별 고유 아이콘 추가 시 여기서 매핑
  const MAX_EXERCISE_ICONS = 4;
  const visibleExercises = exercises.slice(0, MAX_EXERCISE_ICONS);
  const extraCount = exercises.length - MAX_EXERCISE_ICONS;

  // Info: duration + total sets (not redundant with title/count in label row)
  const totalSets = exercises.reduce((sum, e) => sum + e.sets.length, 0);
  const estimatedMin = data?.estimatedDuration;
  const estimatedCal = data?.estimatedCaloriesBurned;
  const infoParts: string[] = [];
  if (estimatedMin) infoParts.push(`${estimatedMin}분`);
  if (totalSets > 0) infoParts.push(`총 ${totalSets}세트`);
  if (!estimatedMin && estimatedCal) infoParts.push(`총 ${estimatedCal}kcal`);

  return (
    <div>
      {/* 라벨 행 (카드 밖) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <BarbellIcon size={14} weight="fill" className="text-primary" />
          <span className="text-xs font-medium text-muted-foreground">운동</span>
        </div>
        {event && totalCount > 0 && (
          <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}개</span>
        )}
      </div>

      {/* 카드 */}
      {event ? (
        <AppLink
          href={`/routine/workout/${event.date}`}
          className="relative w-full bg-muted/20 rounded-xl p-4 flex flex-col active:bg-muted/30 transition-colors min-h-[200px]"
        >
          {/* 겹치는 운동 종목 아이콘 (상단 고정) */}
          {visibleExercises.length > 0 && (
            <div className="flex items-center">
              {visibleExercises.map((ex, i, arr) => (
                <div
                  key={ex.id}
                  className="relative size-9 rounded-full bg-background ring-1 ring-muted/20 flex items-center justify-center"
                  style={{
                    marginLeft: i > 0 ? -10 : undefined,
                    zIndex: arr.length - i,
                  }}
                >
                  {/* TODO: 종목별 고유 아이콘으로 교체 */}
                  <BarbellIcon size={16} weight="fill" className="text-primary" />
                </div>
              ))}
              {extraCount > 0 && (
                <span className="text-xs text-muted-foreground ml-1.5">
                  +{extraCount}
                </span>
              )}
            </div>
          )}

          {/* 타이틀 + 정보 (중앙) */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
              {event.title}
            </h3>
            {infoParts.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {infoParts.join(' · ')}
              </p>
            )}
          </div>

          {/* 진행률 바 */}
          {totalCount > 0 && (
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* 완료 오버레이 */}
          {event.status === 'completed' && (
            <div className="absolute inset-0 z-10 rounded-xl bg-background/60 flex items-center justify-center">
              <CheckCircleIcon size={40} weight="fill" className="text-primary" />
            </div>
          )}
        </AppLink>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-full bg-muted/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[200px] active:bg-muted/30 transition-colors"
          >
            <BarbellIcon size={28} weight="duotone" className="text-muted-foreground/60" />
            <p className="text-sm font-medium text-muted-foreground">오늘 운동 없음</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary">
              <PlusIcon size={14} weight="bold" />
              기록 추가
            </span>
          </button> 

          <WorkoutAddDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSelect={handleOption}
          />
          <AddWorkoutSheet
            isOpen={isSheetOpen}
            onClose={() => setIsSheetOpen(false)}
            date={today}
            onCreated={() => router.push(`/routine/workout/${today}`)}
          />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// 식단 열
// ---------------------------------------------------------------------------

function MealColumn({ event }: { event: RoutineEvent | null }) {
  const router = useRouter();
  const today = formatDate(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMealSheetOpen, setIsMealSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  const handleOption = (option: MealAddOption) => {
    setIsDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else if (option === 'direct') {
      setIsMealSheetOpen(true);
    } else {
      setIsImportSheetOpen(true);
    }
  };

  const data = event && isMealData(event.data) ? event.data : null;
  const meals = data?.meals ?? [];
  const completedCount = meals.filter((m) => m.completed).length;
  const totalCount = meals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalCalories = data?.estimatedTotalCalories;

  // Unique meal types for overlapping time icons
  const uniqueMealTypes = [...new Set(meals.map((m) => m.type))];

  return (
    <div>
      {/* 라벨 행 (카드 밖) */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <ForkKnifeIcon size={14} weight="fill" className="text-primary/70" />
          <span className="text-xs font-medium text-muted-foreground">식단</span>
        </div>
        {event && totalCount > 0 && (
          <span className="text-xs text-muted-foreground">{completedCount}/{totalCount}끼</span>
        )}
      </div>

      {/* 카드 */}
      {event ? (
        <AppLink
          href={`/routine/meal/${event.date}`}
          className="relative w-full bg-muted/20 rounded-xl p-4 flex flex-col active:bg-muted/30 transition-colors min-h-[200px]"
        >
          {/* 겹치는 식사 시간대 아이콘 (상단 고정) */}
          {uniqueMealTypes.length > 0 && (
            <div className="flex items-center">
              {uniqueMealTypes.map((type, i, arr) => {
                const config = MEAL_TIME[type as keyof typeof MEAL_TIME];
                const Icon = config.icon;
                return (
                  <div
                    key={type}
                    className="relative size-9 rounded-full bg-background ring-1 ring-muted/20 flex items-center justify-center"
                    style={{
                      marginLeft: i > 0 ? -10 : undefined,
                      zIndex: arr.length - i,
                    }}
                  >
                    <Icon size={18} weight={config.weight} className={config.color} />
                  </div>
                );
              })}
            </div>
          )}

          {/* 타이틀 + 칼로리 (중앙) */}
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2">
              {event.title}
            </h3>
            {totalCalories ? (
              <p className="text-sm text-muted-foreground">
                총 {totalCalories.toLocaleString()}kcal
              </p>
            ) : null}
          </div>

          {/* 진행률 바 */}
          {totalCount > 0 && (
            <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary/70 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* 완료 오버레이 */}
          {event.status === 'completed' && (
            <div className="absolute inset-0 z-10 rounded-xl bg-background/60 flex items-center justify-center">
              <CheckCircleIcon size={40} weight="fill" className="text-primary" />
            </div>
          )}
        </AppLink>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-full bg-muted/20 rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[200px] active:bg-muted/30 transition-colors"
          >
            <ForkKnifeIcon size={28} weight="duotone" className="text-muted-foreground/60" />
            <p className="text-sm font-medium text-muted-foreground">오늘 식단 없음</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary">
              <PlusIcon size={14} weight="bold" />
              기록 추가
            </span>
          </button>

          <MealAddDrawer
            isOpen={isDrawerOpen}
            onClose={() => setIsDrawerOpen(false)}
            onSelect={handleOption}
          />
          <AddMealSheet
            isOpen={isMealSheetOpen}
            onClose={() => setIsMealSheetOpen(false)}
            date={today}
            onCreated={() => router.push(`/routine/meal/${today}`)}
          />
          <ImportUnitMealSheet
            isOpen={isImportSheetOpen}
            onClose={() => setIsImportSheetOpen(false)}
            date={today}
            onCreated={() => router.push(`/routine/meal/${today}`)}
          />
        </>
      )}
    </div>
  );
}
