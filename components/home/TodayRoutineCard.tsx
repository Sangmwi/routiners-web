'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import {
  BarbellIcon,
  BedIcon,
  BowlFoodIcon,
  CheckCircleIcon,
  PlusIcon,
} from '@phosphor-icons/react';
import AppLink from '@/components/common/AppLink';
import MealAddDrawer, { type MealAddOption } from '@/components/routine/meal/MealAddDrawer';
import WorkoutAddDrawer, {
  type WorkoutAddOption,
} from '@/components/routine/workout/WorkoutAddDrawer';
import AddMealSheet from '@/components/routine/sheets/AddMealSheet';
import AddWorkoutSheet from '@/components/routine/sheets/AddWorkoutSheet';
import ImportUnitMealSheet from '@/components/routine/sheets/ImportUnitMealSheet';
import { MEAL_TIME } from '@/lib/config/theme/event';
import type { RoutineEvent, WorkoutExercise } from '@/lib/types/routine';
import { isMealData, isWorkoutData } from '@/lib/types/guards';
import { formatDate, formatKoreanDate } from '@/lib/utils/dateHelpers';

interface TodayRoutineCardProps {
  workoutEvent: RoutineEvent | null;
  mealEvent: RoutineEvent | null;
  nextScheduledWorkout?: RoutineEvent | null;
}

interface RoutineColumnCardProps {
  href?: string;
  title: string;
  summary?: string;
  progressPercent?: number;
  avatarItems?: ReactNode[];
  extraAvatarCount?: number;
  completed?: boolean;
  emptyAction?: {
    label: string;
    subLabel: string;
    icon: ReactNode;
    onClick: () => void;
  };
  fallback?: {
    icon: ReactNode;
    title: string;
    subLabel: string;
  };
}

function AvatarStack({
  items,
  extraCount,
}: {
  items: ReactNode[];
  extraCount?: number;
}) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center">
      {items.map((item, index, arr) => (
        <div
          key={index}
          className="relative size-10 rounded-full bg-background ring-1 ring-surface-secondary flex items-center justify-center"
          style={{
            marginLeft: index > 0 ? -10 : undefined,
            zIndex: arr.length - index,
          }}
        >
          {item}
        </div>
      ))}
      {!!extraCount && extraCount > 0 && (
        <span className="text-xs text-muted-foreground ml-1.5">+{extraCount}</span>
      )}
    </div>
  );
}

function RoutineColumnCard({
  href,
  title,
  summary,
  progressPercent,
  avatarItems = [],
  extraAvatarCount = 0,
  completed = false,
  emptyAction,
  fallback,
}: RoutineColumnCardProps) {
  const content = (
    <>
      <AvatarStack items={avatarItems} extraCount={extraAvatarCount} />

      <div className="flex-1 flex flex-col justify-center">
        <h3 className="text-base font-semibold text-foreground leading-snug line-clamp-2 text-left">
          {title}
        </h3>
      </div>

      {summary && (
        <div className="flex flex-col gap-1.5 mt-3">
          <p className="text-xs text-muted-foreground text-left">{summary}</p>
          {progressPercent != null && (
            <div className="h-1.5 bg-surface-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      )}

      {completed && (
        <div className="absolute inset-0 z-10 rounded-xl bg-surface-glass flex items-center justify-center">
          <CheckCircleIcon size={40} weight="fill" className="text-primary" />
        </div>
      )}
    </>
  );

  if (emptyAction) {
    return (
      <button
        type="button"
        onClick={emptyAction.onClick}
        className="w-full bg-surface-secondary rounded-xl p-4 flex flex-col items-center justify-center gap-2 min-h-[200px] active:bg-surface-hover transition-colors"
      >
        {emptyAction.icon}
        <p className="text-sm font-medium text-muted-foreground">{emptyAction.label}</p>
        <span className="inline-flex items-center gap-1 text-sm text-primary">
          <PlusIcon size={14} weight="bold" />
          {emptyAction.subLabel}
        </span>
      </button>
    );
  }

  if (fallback) {
    return (
      <div className="w-full bg-surface-secondary rounded-xl p-4 flex flex-col min-h-[200px]">
        {fallback.icon}
        <div className="flex-1 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-foreground leading-snug">{fallback.title}</h3>
        </div>
        <p className="text-xs text-hint-strong">{fallback.subLabel}</p>
      </div>
    );
  }

  if (href) {
    return (
      <AppLink
        href={href}
        className="relative w-full bg-surface-secondary rounded-xl p-4 flex flex-col active:bg-surface-hover transition-colors min-h-[200px]"
      >
        {content}
      </AppLink>
    );
  }

  return (
    <div className="relative w-full bg-surface-secondary rounded-xl p-4 flex flex-col min-h-[200px]">
      {content}
    </div>
  );
}

function getWorkoutModel(event: RoutineEvent | null) {
  if (!event || !isWorkoutData(event.data)) return null;

  const exercises = event.data.exercises ?? [];
  const completedCount = exercises.filter((exercise) => exercise.completed).length;
  const totalCount = exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
  const summaryParts: string[] = [];
  if (totalCount > 0) summaryParts.push(`${totalCount}종목`);
  if (totalSets > 0) summaryParts.push(`${totalSets}세트`);

  const maxIcons = 4;
  const visible = exercises.slice(0, maxIcons);
  const avatarItems = visible.map((exercise: WorkoutExercise) => (
    <BarbellIcon key={exercise.id} size={20} weight="fill" className="text-foreground" />
  ));

  return {
    href: `/routine/workout/${event.date}`,
    title: event.title,
    summary: summaryParts.join(' · '),
    progressPercent,
    avatarItems,
    extraAvatarCount: Math.max(0, exercises.length - maxIcons),
    completed: event.status === 'completed',
  };
}

function getMealModel(event: RoutineEvent | null) {
  if (!event || !isMealData(event.data)) return null;

  const meals = event.data.meals ?? [];
  const completedCount = meals.filter((meal) => meal.completed).length;
  const totalCount = meals.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const totalCalories = event.data.estimatedTotalCalories;

  const uniqueMealTypes = [...new Set(meals.map((meal) => meal.type))];
  const avatarItems = uniqueMealTypes.map((type) => {
    const config = MEAL_TIME[type as keyof typeof MEAL_TIME];
    const Icon = config.icon;
    return <Icon key={type} size={20} weight={config.weight} className={config.color} />;
  });

  return {
    href: `/routine/meal/${event.date}`,
    title: event.title,
    summary: `${totalCount}식${totalCalories ? ` · ${totalCalories.toLocaleString()}kcal` : ''}`,
    progressPercent,
    avatarItems,
    completed: event.status === 'completed',
  };
}

function WorkoutColumn({
  event,
  nextScheduledWorkout,
}: {
  event: RoutineEvent | null;
  nextScheduledWorkout?: RoutineEvent | null;
}) {
  const router = useRouter();
  const today = formatDate(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const model = getWorkoutModel(event);

  const handleOption = (option: WorkoutAddOption) => {
    setIsDrawerOpen(false);
    if (option === 'ai') {
      router.push('/routine/counselor');
    } else {
      setIsSheetOpen(true);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-1.5">
          <BarbellIcon size={14} weight="fill" className="text-foreground" />
          <span className="text-xs font-medium text-muted-foreground">운동</span>
        </div>
      </div>

      {model ? (
        <RoutineColumnCard {...model} />
      ) : nextScheduledWorkout ? (
        <RoutineColumnCard
          title="쉬는 날"
          fallback={{
            icon: <BedIcon size={40} weight="duotone" className="text-hint-strong" />,
            title: '쉬는 날',
            subLabel: `다음 운동 · ${formatKoreanDate(nextScheduledWorkout.date, {
              year: false,
              weekday: true,
              weekdayFormat: 'short',
            })}`,
          }}
        />
      ) : (
        <>
          <RoutineColumnCard
            title=""
            emptyAction={{
              label: '오늘 운동 없음',
              subLabel: '기록 추가',
              icon: <BarbellIcon size={40} weight="duotone" className="text-hint-strong" />,
              onClick: () => setIsDrawerOpen(true),
            }}
          />
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

function MealColumn({ event }: { event: RoutineEvent | null }) {
  const router = useRouter();
  const today = formatDate(new Date());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMealSheetOpen, setIsMealSheetOpen] = useState(false);
  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);

  const model = getMealModel(event);

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

  return (
    <div>
      <div className="flex items-center mb-3">
        <div className="flex items-center gap-1.5">
          <BowlFoodIcon size={14} weight="fill" className="text-foreground" />
          <span className="text-xs font-medium text-muted-foreground">식단</span>
        </div>
      </div>

      {model ? (
        <RoutineColumnCard {...model} />
      ) : (
        <>
          <RoutineColumnCard
            title=""
            emptyAction={{
              label: '오늘 식단 없음',
              subLabel: '기록 추가',
              icon: <BowlFoodIcon size={40} weight="duotone" className="text-hint-strong" />,
              onClick: () => setIsDrawerOpen(true),
            }}
          />
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

export default function TodayRoutineCard({
  workoutEvent,
  mealEvent,
  nextScheduledWorkout,
}: TodayRoutineCardProps) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-6">
        <h2 className="text-xl font-bold text-card-foreground">오늘의 루틴</h2>
        <span className="text-sm font-light text-muted-foreground">
          {formatKoreanDate(new Date(), { weekday: true })}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <WorkoutColumn event={workoutEvent} nextScheduledWorkout={nextScheduledWorkout} />
        <MealColumn event={mealEvent} />
      </div>
    </section>
  );
}
