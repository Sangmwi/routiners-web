'use client';

import { ClockIcon, FireIcon } from '@phosphor-icons/react';
import { getMealTimeConfig } from '@/lib/config/theme';
import type { Meal, FoodItem } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';

interface MealCardProps {
  /** 식사 데이터 */
  meal: Meal;
  /** 완료 상태 */
  isCompleted?: boolean;
}

/**
 * 음식 아이템 행
 */
function FoodItemRow({ food }: { food: FoodItem }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
      <div className="flex-1 min-w-0">
        <span className="text-sm text-foreground truncate block">{food.name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 ml-2">
        <span className="text-muted-foreground/70">{food.portion}</span>
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
export default function MealCard({ meal, isCompleted = false }: MealCardProps) {
  const mealConfig = getMealTimeConfig(meal.type);

  return (
    <div className={`bg-card border border-border rounded-xl overflow-hidden ${
      isCompleted ? 'opacity-75' : ''
    }`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 bg-primary/5 border-b border-border/50">
        <div className="flex items-center gap-2">
          <mealConfig.icon size={20} className="text-primary" weight="fill" />
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
        <div className="flex items-center gap-3 text-xs">
          {meal.totalCalories && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <FireIcon size={14} className="text-orange-500" />
              {meal.totalCalories}kcal
            </span>
          )}
          {meal.totalProtein && (
            <span className="text-primary font-medium">
              단백질 {meal.totalProtein}g
            </span>
          )}
        </div>
      </div>

      {/* 음식 목록 */}
      <div className="p-4">
        {meal.foods.map((food, idx) => (
          <FoodItemRow key={food.id || idx} food={food} />
        ))}
      </div>

      {/* 팁 (있는 경우) */}
      {meal.tips && meal.tips.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-warning-muted rounded-lg p-3">
            <p className="text-xs text-warning">
              💡 {meal.tips[0]}
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
