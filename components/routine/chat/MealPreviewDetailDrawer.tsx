'use client';

import { CheckIcon, ProhibitIcon } from '@phosphor-icons/react';
import { LoadingSpinner } from '@/components/ui/icons';
import Modal from '@/components/ui/Modal';
import type { MealPlanPreviewData, MealPreviewDay, MealPreviewMeal } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';
import type { RoutinePreviewStatus } from '@/lib/types/chat';

const DAY_NAMES = ['', '월', '화', '수', '목', '금', '토', '일'];

interface MealPreviewDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  preview: MealPlanPreviewData;
  status?: RoutinePreviewStatus;
  onApply: () => void;
  isApplying?: boolean;
}

/**
 * 식단 상세 보기 드로어
 *
 * PreviewDetailDrawer(루틴)와 병렬 구조
 * 차이: 주차 선택 없음, 대체/추가 모드 없음 (식단 API가 미지원)
 */
export default function MealPreviewDetailDrawer({
  isOpen,
  onClose,
  preview,
  status = 'pending',
  onApply,
  isApplying = false,
}: MealPreviewDetailDrawerProps) {
  if (!preview?.weeks) return null;

  const firstWeek = preview.weeks[0];
  const isActionable = status === 'pending' && !isApplying;
  const mealsPerDay = firstWeek?.days[0]?.meals.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton={false}
    >
      {/* 헤더 - 배지 + 타이틀 + 설명 */}
      <div className="px-5 pt-2 pb-4">
        {/* 배지들 */}
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
            {preview.durationWeeks}주
          </span>
          {mealsPerDay > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium bg-muted/50 text-muted-foreground rounded-full">
              하루 {mealsPerDay}끼
            </span>
          )}
          {preview.targetCalories > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
              {preview.targetCalories}kcal
            </span>
          )}
        </div>

        {/* 타이틀 */}
        <h2 className="font-semibold text-foreground text-lg leading-tight">
          {preview.title}
        </h2>

        {/* 설명 */}
        {preview.description && (
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            {preview.description}
          </p>
        )}
      </div>

      {/* 일별 상세 (스크롤 영역) */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-6 space-y-4">
          {firstWeek?.days.map((day, idx) => (
            <MealDayCard key={idx} day={day} />
          ))}
        </div>
      </div>

      {/* 하단 고정: 적용 버튼 또는 상태 표시 */}
      <div className="sticky bottom-0 p-4 bg-card">
        {status === 'pending' ? (
          <button
            onClick={onApply}
            disabled={!isActionable}
            className="w-full py-3.5 rounded-xl font-medium transition-all disabled:opacity-50 active:scale-[0.98] bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isApplying ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" variant="current" />
                적용 중...
              </span>
            ) : (
              '식단 적용하기'
            )}
          </button>
        ) : (
          <div className="flex items-center justify-center py-3.5">
            <span className={`text-sm font-medium flex items-center gap-1.5 ${
              status === 'applied' ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {status === 'applied' ? (
                <>
                  <CheckIcon size={16} weight="bold" />
                  이미 적용된 식단이에요
                </>
              ) : (
                <>
                  <ProhibitIcon size={16} />
                  취소된 식단이에요
                </>
              )}
            </span>
          </div>
        )}
      </div>
    </Modal>
  );
}

// =============================================================================
// Day Card
// =============================================================================

function MealDayCard({ day }: { day: MealPreviewDay }) {
  return (
    <div className="bg-muted/20 rounded-2xl overflow-hidden">
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 bg-primary/10">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
            {DAY_NAMES[day.dayOfWeek]}
          </span>
          {day.title && (
            <span className="text-sm font-medium text-foreground truncate">{day.title}</span>
          )}
        </div>
        {day.totalCalories != null && day.totalCalories > 0 && (
          <span className="text-xs font-medium text-muted-foreground shrink-0">
            {day.totalCalories}kcal
          </span>
        )}
      </div>

      {/* 식사 목록 */}
      <div className="px-4 py-4 space-y-4">
        {day.meals.map((meal, idx) => (
          <MealSection
            key={idx}
            meal={meal}
            isLast={idx === day.meals.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// Meal Section
// =============================================================================

function MealSection({ meal, isLast }: { meal: MealPreviewMeal; isLast: boolean }) {
  return (
    <div className={`pb-3 ${!isLast ? 'border-b border-border/20' : ''}`}>
      {/* 식사 유형 라벨 */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">
          {MEAL_TYPE_LABELS[meal.type]}
        </span>
        {meal.totalCalories != null && meal.totalCalories > 0 && (
          <span className="text-xs text-muted-foreground">
            {meal.totalCalories}kcal
          </span>
        )}
      </div>

      {/* 음식 목록 */}
      <div className="space-y-1.5">
        {meal.foods.map((food, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm">
            <span className="text-foreground">{food.name}</span>
            <div className="flex items-center gap-2 text-muted-foreground text-xs shrink-0">
              <span>{food.portion}</span>
              {food.calories != null && food.calories > 0 && (
                <span className="text-foreground font-medium">{food.calories}kcal</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
