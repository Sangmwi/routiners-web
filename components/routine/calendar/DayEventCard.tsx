'use client';

import type { RoutineEvent, WorkoutExercise } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';
import { BarbellIcon, BowlFoodIcon } from '@phosphor-icons/react';
import { getDisplayStatus, EVENT_STATUS, type DisplayStatus } from '@/lib/config/theme';
import EventStatusBadge from '@/components/routine/event/EventStatusBadge';
import { isMealData, isWorkoutData } from '@/lib/types/guards';
import AppLink from '@/components/common/AppLink';
import { useLongPress } from '@/hooks/ui';

interface DayEventCardProps {
  event: RoutineEvent;
  date: string;
  onLongPress?: () => void;
}

function EventTypeIcon({ type, displayStatus }: { type: RoutineEvent['type']; displayStatus: DisplayStatus }) {
  const { eventIconClass, eventIconWeight } = EVENT_STATUS[displayStatus];
  const Icon = type === 'meal' ? BowlFoodIcon : BarbellIcon;

  return <Icon className={`w-7 h-7 flex-shrink-0 ${eventIconClass}`} weight={eventIconWeight} />;
}

export default function DayEventCard({ event, date, onLongPress }: DayEventCardProps) {
  const displayStatus = getDisplayStatus(event.status, event.date);
  const longPressHandlers = useLongPress(onLongPress ?? (() => {}));
  const handlers = onLongPress ? longPressHandlers : {};

  return (
    <AppLink
      href={`/routine/${event.type}/${date}`}
      className="flex items-center gap-4 px-2 py-5 text-left transition-colors rounded-xl min-w-0 w-full active:bg-surface-secondary"
      {...handlers}
    >
      <EventTypeIcon type={event.type} displayStatus={displayStatus} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
          <EventStatusBadge status={event.status} date={event.date} />
        </div>

        <div className="text-sm text-muted-foreground">
          {event.data && isWorkoutData(event.data) && event.data.exercises.length > 0 && (
            <span>
              {event.data.exercises.length}개 운동 · {getTotalSets(event.data.exercises)}세트
              {event.data.estimatedDuration ? ` · 약 ${event.data.estimatedDuration}분` : ''}
              {event.data.estimatedCaloriesBurned
                ? ` · ${event.data.estimatedCaloriesBurned}kcal`
                : ''}
            </span>
          )}
          {event.data && isMealData(event.data) && event.data.meals.length > 0 && (
            <span>
              {event.data.meals.length}식 ·{' '}
              {event.data.estimatedTotalCalories || event.data.targetCalories || 0}kcal
              {getMealProtein(event.data) > 0 ? ` · 단백질 ${getMealProtein(event.data)}g` : ''}
            </span>
          )}
          {!event.data && event.rationale && (
            <span className="line-clamp-1">{event.rationale}</span>
          )}
        </div>
      </div>
    </AppLink>
  );
}

function getTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

function getMealProtein(data: MealData): number {
  return Math.round(data.meals.reduce((sum, meal) => sum + (meal.totalProtein ?? 0), 0));
}
