'use client';

import { useState } from 'react';
import { Dumbbell, Utensils, Clock, Flame, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import type { RoutinePreviewData, RoutinePreviewDay } from '@/lib/types/fitness';
import type { MealPlanPreviewData, MealPreviewDay, MealPreviewMeal } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

interface PreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'routine' | 'meal';
  preview: RoutinePreviewData | MealPlanPreviewData;
  onApply: () => void;
  isApplying?: boolean;
}

/**
 * 루틴/식단 상세 보기 드로어
 *
 * 요약 카드에서 "상세 보기" 클릭 시 열리는 하단 드로어
 * 주차별 탭 + 일별 상세 내용 표시
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
  const accentColor = isRoutine ? 'primary' : 'meal';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      {/* 커스텀 헤더 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {isRoutine ? (
            <Dumbbell className="w-5 h-5 text-primary" />
          ) : (
            <Utensils className="w-5 h-5 text-meal" />
          )}
          <h2 className="font-semibold text-foreground">{preview.title}</h2>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{preview.description}</p>
      </div>

      {/* 주차 탭 */}
      <div className="flex border-b border-border overflow-x-auto scrollbar-hide">
        {weeks.map((week) => (
          <button
            key={week.weekNumber}
            onClick={() => setSelectedWeek(week.weekNumber)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors shrink-0 ${
              selectedWeek === week.weekNumber
                ? isRoutine
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-meal border-b-2 border-meal'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {week.weekNumber}주차
          </button>
        ))}
      </div>

      {/* 일별 상세 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {currentWeek?.days.map((day, idx) => (
            <DayDetailCard
              key={idx}
              day={day}
              type={type}
              isLast={idx === currentWeek.days.length - 1}
            />
          ))}
        </div>
      </div>

      {/* 하단 적용 버튼 */}
      <div className="p-4 border-t border-border bg-background">
        <button
          onClick={onApply}
          disabled={isApplying}
          className={`w-full py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
            isRoutine
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

/**
 * 일별 상세 카드
 */
function DayDetailCard({
  day,
  type,
  isLast,
}: {
  day: RoutinePreviewDay | MealPreviewDay;
  type: 'routine' | 'meal';
  isLast: boolean;
}) {
  if (type === 'routine') {
    return <RoutineDayCard day={day as RoutinePreviewDay} isLast={isLast} />;
  }
  return <MealDayCard day={day as MealPreviewDay} isLast={isLast} />;
}

/**
 * 루틴 일별 카드
 */
function RoutineDayCard({
  day,
  isLast,
}: {
  day: RoutinePreviewDay;
  isLast: boolean;
}) {
  return (
    <div className={`pb-4 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          <span className="font-medium text-foreground">{day.title}</span>
        </div>
        {day.estimatedDuration && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {day.estimatedDuration}분
          </span>
        )}
      </div>
      <div className="space-y-2 ml-10">
        {day.exercises.map((ex, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{ex.name}</span>
            <span className="text-muted-foreground">
              {ex.sets}x{ex.reps}
              {ex.rest && <span className="ml-1 text-xs">({ex.rest})</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 식단 일별 카드
 */
function MealDayCard({
  day,
  isLast,
}: {
  day: MealPreviewDay;
  isLast: boolean;
}) {
  return (
    <div className={`pb-4 ${!isLast ? 'border-b border-border' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-meal/10 text-meal text-sm font-medium flex items-center justify-center">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          <span className="font-medium text-foreground">
            {DAY_NAMES[day.dayOfWeek]}요일
          </span>
        </div>
        {day.totalCalories && (
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Flame className="w-3.5 h-3.5" />
            {day.totalCalories}kcal
          </span>
        )}
      </div>
      <div className="space-y-3 ml-10">
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
    <div className="bg-meal/5 rounded-lg p-3">
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
