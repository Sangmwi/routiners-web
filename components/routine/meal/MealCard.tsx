'use client';

import { CheckCircleIcon, CircleIcon, ClockIcon, FireIcon, TrashIcon } from '@phosphor-icons/react';
import { getMealTimeConfig } from '@/lib/config/theme';
import type { Meal, FoodItem } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';

interface MealCardProps {
  /** 식사 데이터 */
  meal: Meal;
  /** 이벤트 레벨 완료 상태 */
  isCompleted?: boolean;
  /** 완료 토글 표시 여부 */
  showCompletionToggle?: boolean;
  /** 완료 토글 핸들러 */
  onToggleComplete?: () => void;
  /** 삭제 버튼 표시 여부 (편집 모드) */
  showDeleteButton?: boolean;
  /** 삭제 핸들러 */
  onDelete?: () => void;
}

/**
 * 음식 아이템 행
 */
function FoodItemRow({ food }: { food: FoodItem }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-edge-faint last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-foreground truncate block">{food.name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
        <span className="text-hint-strong">{food.portion}</span>
        {food.calories && (
          <span className="text-foreground/80">{food.calories}kcal</span>
        )}
        {food.protein && (
          <span className="text-primary font-medium">P{food.protein}g</span>
        )}
      </div>
    </div>
  );
}

/**
 * 식사 카드 컴포넌트
 *
 * 아침/점심/저녁/간식 단위의 식사 정보를 표시
 */
export default function MealCard({
  meal,
  isCompleted = false,
  showCompletionToggle = false,
  onToggleComplete,
  showDeleteButton = false,
  onDelete,
}: MealCardProps) {
  const mealConfig = getMealTimeConfig(meal.type);

  return (
    <div className={`bg-surface-secondary rounded-2xl overflow-hidden ${
      isCompleted || meal.completed ? 'opacity-60' : ''
    }`}>
      {/* Row 1: 제목 + 액션 */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <div className="flex items-center gap-2">
          <mealConfig.icon size={18} className={mealConfig.color} weight={mealConfig.weight} />
          <span className="font-semibold text-foreground">
            {MEAL_TYPE_LABELS[meal.type]}
          </span>
          {meal.time && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <ClockIcon size={12} />
              {meal.time}
            </span>
          )}
        </div>

        {/* 오른쪽 액션 영역 - 고정 크기로 레이아웃 시프트 방지 */}
        <div className="flex items-center justify-end w-8 h-8">
          {showCompletionToggle ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleComplete?.(); }}
              className="p-1"
              aria-label={meal.completed ? '완료 취소' : '완료'}
            >
              {meal.completed
                ? <CheckCircleIcon size={24} weight="fill" className="text-primary" />
                : <CircleIcon size={24} className="text-hint-faint" />
              }
            </button>
          ) : showDeleteButton ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
              className="p-1.5 rounded-lg text-muted-foreground"
              aria-label="끼니 삭제"
            >
              <TrashIcon size={16} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Row 2: 영양 요약 */}
      <div className="flex items-center gap-3 px-4 pb-3 text-xs min-h-[20px]">
        {meal.totalCalories ? (
          <span className="flex items-center gap-1 text-muted-foreground">
            <FireIcon size={14} className="text-orange-500" />
            {meal.totalCalories}kcal
          </span>
        ) : null}
        {meal.totalProtein ? (
          <span className="text-primary font-medium">
            단백질 {meal.totalProtein}g
          </span>
        ) : null}
      </div>

      {/* 음식 목록 */}
      <div className="px-4 pb-4">
        {meal.foods.map((food, idx) => (
          <FoodItemRow key={food.id || idx} food={food} />
        ))}
      </div>

      {/* 팁 (있는 경우) */}
      {meal.tips && meal.tips.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-warning-muted rounded-lg p-3">
            <p className="text-xs text-warning">
              {meal.tips[0]}
            </p>
          </div>
        </div>
      )}

      {/* 메모 (있는 경우) */}
      {meal.notes && (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground italic">{meal.notes}</p>
        </div>
      )}
    </div>
  );
}
