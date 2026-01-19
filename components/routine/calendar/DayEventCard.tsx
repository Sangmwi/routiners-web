'use client';

import { useRouter } from 'next/navigation';
import { RoutineEvent, WorkoutExercise, WorkoutData } from '@/lib/types/routine';
import { CaretRightIcon } from '@phosphor-icons/react';
import { getEventIcon, getStatusConfig } from '@/lib/config/eventTheme';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';
import type { MealData } from '@/lib/types/meal';

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

/**
 * 타입 가드: MealData인지 확인
 */
function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
}

interface DayEventCardProps {
  event: RoutineEvent | null;
  date: string;
}

/**
 * 선택된 날짜의 이벤트 카드
 */
export default function DayEventCard({ event, date }: DayEventCardProps) {
  const router = useRouter();

  // 날짜 포맷
  const formattedDate = formatKoreanDate(date, { year: false, weekday: true });

  // 이벤트 없음
  if (!event) {
    return (
      <div className="bg-muted/30 rounded-xl p-5">
        <p className="text-sm text-muted-foreground mb-1">{formattedDate}</p>
        <p className="text-foreground">예정된 운동이 없습니다.</p>
      </div>
    );
  }

  const status = getStatusConfig(event.status);
  const StatusIcon = status.icon;

  return (
    <button
      onClick={() => router.push(`/routine/${event.type}/${date}`)}
      className="w-full bg-card rounded-xl p-5 text-left hover:bg-muted/50 transition-colors"
    >
      {/* 상단: 날짜 + 상태 */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{formattedDate}</p>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.badgeClass}`}
        >
          {StatusIcon && <StatusIcon className="w-3 h-3" />}
          {status.label}
        </span>
      </div>

      {/* 제목 */}
      <div className="flex items-start gap-3">
        {(() => {
          const Icon = getEventIcon(event.type);
          return (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
          );
        })()}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-foreground truncate">
            {event.title}
          </h3>
          {event.rationale && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
              {event.rationale}
            </p>
          )}
        </div>
        <CaretRightIcon size={20} weight="bold" className="text-muted-foreground flex-shrink-0" />
      </div>

      {/* 이벤트 정보 요약 */}
      {event.data && (
        <div className="mt-4">
          {isWorkoutData(event.data) && event.data.exercises.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {event.data.exercises.length}개 운동 •{' '}
              {getTotalSets(event.data.exercises)}세트
            </p>
          )}
          {isMealData(event.data) && event.data.meals.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {event.data.meals.length}끼 •{' '}
              {event.data.estimatedTotalCalories || event.data.targetCalories || 0}kcal
            </p>
          )}
        </div>
      )}
    </button>
  );
}

function getTotalSets(exercises: WorkoutExercise[]): number {
  return exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}
