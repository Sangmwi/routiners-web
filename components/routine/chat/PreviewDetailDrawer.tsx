'use client';

import { useState } from 'react';
import { Dumbbell, Utensils, Clock, Flame, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { RoutinePreviewData, RoutinePreviewDay, RoutinePreviewExercise } from '@/lib/types/fitness';
import type { MealPlanPreviewData, MealPreviewDay, MealPreviewMeal } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

interface PreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'routine' | 'meal';
  preview: RoutinePreviewData | MealPlanPreviewData;
  onApply: (forceOverwrite?: boolean) => void;
  isApplying?: boolean;
}

/**
 * 루틴/식단 상세 보기 드로어
 *
 * 미니멀하고 구조적인 디자인
 * - 카드 기반 레이아웃
 * - 하단 버튼 고정
 * - 명확한 시각적 계층
 */
export default function PreviewDetailDrawer({
  isOpen,
  onClose,
  type,
  preview,
  onApply,
  isApplying = false,
}: PreviewDetailDrawerProps) {
  const [selectedWeek, setSelectedWeek] = useState(1);

  const weeks = preview.weeks;
  const currentWeek = weeks.find(w => w.weekNumber === selectedWeek);

  const isRoutine = type === 'routine';
  const hasConflicts = (preview.conflicts?.length ?? 0) > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      {/* 헤더 */}
      <div className="px-5 pt-2 pb-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isRoutine ? 'bg-primary/10' : 'bg-meal/10'
          }`}>
            {isRoutine ? (
              <Dumbbell className="w-5 h-5 text-primary" />
            ) : (
              <Utensils className="w-5 h-5 text-meal" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-semibold text-foreground text-lg leading-tight">
              {preview.title}
            </h2>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {preview.description}
            </p>
          </div>
        </div>
      </div>

      {/* 주차 탭 */}
      <div className="flex px-5 gap-2 pb-3 overflow-x-auto scrollbar-hide">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => setSelectedWeek(week.weekNumber)}
            className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all shrink-0 ${
              selectedWeek === week.weekNumber
                ? isRoutine
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-meal text-meal-foreground'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {week.weekNumber}주차
          </button>
        ))}
      </div>

      {/* 일별 상세 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pb-6 space-y-3">
          {currentWeek?.days.map((day, idx) => (
            <DayDetailCard
              key={idx}
              day={day}
              type={type}
            />
          ))}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 p-4 bg-card/95 backdrop-blur-sm border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={() => onApply(hasConflicts)}
          disabled={isApplying}
          className={`w-full py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 active:scale-[0.98] ${
            hasConflicts
              ? 'bg-amber-500 text-white hover:bg-amber-600'
              : isRoutine
                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                : 'bg-meal text-meal-foreground hover:opacity-90'
          }`}
        >
          {isApplying ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              적용 중...
            </span>
          ) : (
            isRoutine ? '이 루틴 적용하기' : '이 식단 적용하기'
          )}
        </button>
      </div>
    </Modal>
  );
}

// =============================================================================
// Day Cards
// =============================================================================

function DayDetailCard({
  day,
  type,
}: {
  day: RoutinePreviewDay | MealPreviewDay;
  type: 'routine' | 'meal';
}) {
  if (type === 'routine') {
    return <RoutineDayCard day={day as RoutinePreviewDay} />;
  }
  return <MealDayCard day={day as MealPreviewDay} />;
}

/**
 * 루틴 일별 카드 - 미니멀 디자인
 */
function RoutineDayCard({ day }: { day: RoutinePreviewDay }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/5 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center shrink-0">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          <span className="font-medium text-foreground truncate">{day.title}</span>
        </div>
        {day.estimatedDuration && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Clock className="w-4 h-4" />
            <span>{day.estimatedDuration}분</span>
          </div>
        )}
      </div>

      {/* 운동 목록 */}
      <div className="px-4 py-3">
        <div className="space-y-0">
          {day.exercises.map((exercise, idx) => (
            <ExerciseItem
              key={idx}
              exercise={exercise}
              isLast={idx === day.exercises.length - 1}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 운동 항목 - 인라인 텍스트로 밀림 방지
 */
function ExerciseItem({
  exercise,
  isLast,
}: {
  exercise: RoutinePreviewExercise;
  isLast: boolean;
}) {
  return (
    <div className={`py-3 ${!isLast ? 'border-b border-border/30' : ''}`}>
      <p className="text-sm text-foreground leading-relaxed">
        {exercise.name}
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        {exercise.sets}세트 · {exercise.reps}회
        {exercise.rest && (
          <span className="text-primary"> · 휴식 {exercise.rest}</span>
        )}
      </p>
    </div>
  );
}

/**
 * 식단 일별 카드
 */
function MealDayCard({ day }: { day: MealPreviewDay }) {
  return (
    <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-meal/5 border-b border-border/40">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="w-9 h-9 rounded-lg bg-meal text-meal-foreground text-sm font-semibold flex items-center justify-center shrink-0">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          <span className="font-medium text-foreground truncate">
            {DAY_NAMES[day.dayOfWeek]}요일
          </span>
        </div>
        {day.totalCalories && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
            <Flame className="w-4 h-4" />
            <span>{day.totalCalories}kcal</span>
          </div>
        )}
      </div>

      {/* 식사 목록 */}
      <div className="p-3 space-y-2">
        {day.meals.map((meal, idx) => (
          <MealCard key={idx} meal={meal} />
        ))}
      </div>
    </div>
  );
}

/**
 * 개별 식사 카드 (아침/점심/저녁/간식)
 */
function MealCard({ meal }: { meal: MealPreviewMeal }) {
  return (
    <div className="bg-meal/5 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-meal">
          {MEAL_TYPE_LABELS[meal.type]}
        </span>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {meal.time && <span>{meal.time}</span>}
          {meal.totalCalories && (
            <span className="flex items-center gap-0.5">
              <Flame className="w-3 h-3" />
              {meal.totalCalories}kcal
            </span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {meal.foods.map((food, idx) => (
          <div key={idx} className="flex justify-between text-sm">
            <span className="text-foreground">{food.name}</span>
            <span className="text-muted-foreground">
              {food.portion}
              {food.protein && (
                <span className="text-meal ml-1">P{food.protein}g</span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
