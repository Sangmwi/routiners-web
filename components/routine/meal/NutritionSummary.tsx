'use client';

import { FireIcon, BarbellIcon, BreadIcon, DropIcon } from '@phosphor-icons/react';
import type { MealData } from '@/lib/types/meal';

interface NutritionSummaryProps {
  /** 식단 데이터 */
  data: MealData;
}

interface NutrientBarProps {
  /** 아이콘 */
  icon: typeof FireIcon;
  /** 레이블 */
  label: string;
  /** 현재 값 */
  current?: number;
  /** 목표 값 */
  target?: number;
  /** 단위 */
  unit: string;
  /** 아이콘 색상 */
  iconColor: string;
  /** 바 색상 */
  barColor: string;
}

/**
 * 영양소 진행 바
 */
function NutrientBar({
  icon: Icon,
  label,
  current = 0,
  target = 0,
  unit,
  iconColor,
  barColor,
}: NutrientBarProps) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  const isOver = current > target && target > 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} weight="fill" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="text-sm">
          <span className={isOver ? 'text-red-500 font-medium' : 'text-foreground'}>
            {current.toLocaleString()}
          </span>
          <span className="text-muted-foreground">
            {' / '}
            {target.toLocaleString()}
            {unit}
          </span>
        </div>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor} ${
            isOver ? 'bg-red-500' : ''
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-muted-foreground text-right">
        {percentage.toFixed(0)}%
      </div>
    </div>
  );
}

/**
 * 하루 영양소 요약 컴포넌트
 *
 * 칼로리, 단백질, 탄수화물, 지방 섭취량을 목표 대비로 표시
 */
export default function NutritionSummary({ data }: NutritionSummaryProps) {
  // 식사별 영양소 합계 계산
  const totals = data.meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + (meal.totalCalories || 0),
      protein: acc.protein + (meal.totalProtein || 0),
      carbs: acc.carbs + (meal.totalCarbs || 0),
      fat: acc.fat + (meal.totalFat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // 예상 총 칼로리 사용 (있으면)
  const estimatedCalories = data.estimatedTotalCalories || totals.calories;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        하루 영양소 요약
      </h3>

      <div className="space-y-4">
        <NutrientBar
          icon={FireIcon}
          label="칼로리"
          current={estimatedCalories}
          target={data.targetCalories}
          unit="kcal"
          iconColor="text-orange-500"
          barColor="bg-orange-500"
        />

        <NutrientBar
          icon={BarbellIcon}
          label="단백질"
          current={totals.protein}
          target={data.targetProtein}
          unit="g"
          iconColor="text-primary"
          barColor="bg-primary"
        />

        <NutrientBar
          icon={BreadIcon}
          label="탄수화물"
          current={totals.carbs}
          target={data.targetCarbs}
          unit="g"
          iconColor="text-amber-500"
          barColor="bg-amber-500"
        />

        <NutrientBar
          icon={DropIcon}
          label="지방"
          current={totals.fat}
          target={data.targetFat}
          unit="g"
          iconColor="text-purple-500"
          barColor="bg-purple-500"
        />
      </div>

      {/* 수분 섭취 권장 */}
      {data.waterIntake && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DropIcon size={16} className="text-blue-500" weight="fill" />
              <span className="text-muted-foreground">수분 섭취 권장</span>
            </div>
            <span className="font-medium text-foreground">{data.waterIntake}L</span>
          </div>
        </div>
      )}

      {/* AI 팁 */}
      {data.tips && data.tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="bg-primary/5 rounded-lg p-3">
            <p className="text-xs text-primary font-medium mb-1">AI 조언</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              {data.tips.slice(0, 3).map((tip, idx) => (
                <li key={idx}>• {tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
