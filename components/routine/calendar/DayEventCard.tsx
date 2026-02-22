'use client';

import type { RoutineEvent, WorkoutExercise } from '@/lib/types/routine';
import type { MealData } from '@/lib/types/meal';
import { BarbellIcon, BowlFoodIcon, TrashIcon } from '@phosphor-icons/react';
import { getDisplayStatus, getStatusConfig } from '@/lib/config/eventTheme';
import { isMealData, isWorkoutData } from '@/lib/types/guards';
import AppLink from '@/components/common/AppLink';

interface DayEventCardProps {
  event: RoutineEvent;
  date: string;
  onDelete?: (eventId: string) => void;
}

function EventTypeIcon({ type }: { type: RoutineEvent['type'] }) {
  if (type === 'meal') {
    return <BowlFoodIcon className="w-7 h-7 text-primary flex-shrink-0" />;
  }

  return <BarbellIcon className="w-7 h-7 text-primary flex-shrink-0" />;
}

export default function DayEventCard({ event, date, onDelete }: DayEventCardProps) {
  const displayStatus = getDisplayStatus(event.status, event.date);
  const status = getStatusConfig(displayStatus);
  const StatusIcon = status.icon;

  return (
    <div className="flex items-center rounded-xl">
      <AppLink
        href={`/routine/${event.type}/${date}`}
        className="flex flex-1 items-center gap-4 px-2 py-5 text-left hover:bg-muted/20 active:bg-muted/20 transition-colors rounded-xl min-w-0"
      >
        <EventTypeIcon type={event.type} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-base font-semibold text-foreground truncate">{event.title}</h3>
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${status.badgeClass}`}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {status.label}
            </span>
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

      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(event.id)}
          className="p-2.5 -mr-1 shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          aria-label="삭제"
        >
          <TrashIcon size={18} />
        </button>
      )}
    </div>
  );
}

function getTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

function getMealProtein(data: MealData): number {
  return Math.round(data.meals.reduce((sum, meal) => sum + (meal.totalProtein ?? 0), 0));
}
