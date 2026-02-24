'use client';

import { FireIcon, BarbellIcon, BreadIcon, DropIcon } from '@phosphor-icons/react';
import type { MealData } from '@/lib/types/meal';

interface NutritionSummaryProps {
  /** 식단 데이터 */
  data: MealData;
}

// ============================================================================
// 모드 A: 총량 요약 (목표 미설정 시)
// ============================================================================

const MACRO_CONFIG = [
  { key: 'protein', label: '단백질', unit: 'g' },
  { key: 'carbs', label: '탄수화물', unit: 'g' },
  { key: 'fat', label: '지방', unit: 'g' },
] as const;

interface NutritionOverviewProps {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * 총량 요약 (히어로 칼로리 + 3열 3대 영양소 그리드)
 * Big3LiftCard, InBodyMiniCard 패턴 적용
 */
function NutritionOverview({ calories, protein, carbs, fat }: NutritionOverviewProps) {
  const macros = { protein, carbs, fat };

  return (
    <div>
      {/* 히어로 칼로리 */}
      <div className="flex items-center gap-2 mb-5">
        <FireIcon size={20} className="text-orange-500" weight="fill" />
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-foreground tabular-nums">
            {calories.toLocaleString()}
          </span>
          <span className="text-sm font-normal text-muted-foreground">kcal</span>
        </div>
      </div>

      {/* 3대 영양소 3열 그리드 */}
      <div className="grid grid-cols-3 gap-3">
        {MACRO_CONFIG.map(({ key, label, unit }) => (
          <div key={key} className="text-center">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-base font-bold text-foreground tabular-nums">
              {macros[key]}
              <span className="text-xs font-normal text-muted-foreground ml-1">{unit}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 모드 B: 목표 대비 (목표 설정 시)
// ============================================================================

interface NutrientRowProps {
  icon: typeof FireIcon;
  label: string;
  current: number;
  target?: number;
  unit: string;
}

/**
 * 개별 영양소 행
 * - target 있으면: 현재/목표 + 프로그레스 바
 * - target 없으면: 값만 표시
 */
function NutrientRow({ icon: Icon, label, current, target, unit }: NutrientRowProps) {
  const hasTarget = !!target && target > 0;
  const percentage = hasTarget ? Math.min((current / target!) * 100, 100) : 0;
  const isOver = hasTarget && current > target!;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className="text-muted-foreground" weight="fill" />
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <div className="text-sm tabular-nums">
          {hasTarget ? (
            <>
              <span className={isOver ? 'text-red-500 font-medium' : 'text-foreground'}>
                {current.toLocaleString()}
              </span>
              <span className="text-muted-foreground">
                {' / '}
                {target!.toLocaleString()}
                {unit}
              </span>
            </>
          ) : (
            <span className="text-foreground font-medium">
              {current.toLocaleString()}
              <span className="text-muted-foreground font-normal">{unit}</span>
            </span>
          )}
        </div>
      </div>

      {/* 프로그레스 바 (target 있을 때만) */}
      {hasTarget && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isOver ? 'bg-red-500' : 'bg-primary'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums w-8 text-right">
            {percentage.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * 하루 총 영양소 컴포넌트
 *
 * - 목표 미설정: 총량 요약 (히어로 칼로리 + 3열 3대 영양소 그리드)
 * - 목표 설정: 목표 대비 프로그레스 바
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

  // 목표 설정 여부 판단
  const hasTargets = !!(
    data.targetCalories ||
    data.targetProtein ||
    data.targetCarbs ||
    data.targetFat
  );

  return (
    <div className="bg-surface-secondary rounded-2xl p-4">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        하루 총 영양소
      </h3>

      {hasTargets ? (
        /* 모드 B: 목표 대비 */
        <div className="space-y-3">
          <NutrientRow
            icon={FireIcon}
            label="칼로리"
            current={estimatedCalories}
            target={data.targetCalories}
            unit="kcal"
          />
          <NutrientRow
            icon={BarbellIcon}
            label="단백질"
            current={totals.protein}
            target={data.targetProtein}
            unit="g"
          />
          <NutrientRow
            icon={BreadIcon}
            label="탄수화물"
            current={totals.carbs}
            target={data.targetCarbs}
            unit="g"
          />
          <NutrientRow
            icon={DropIcon}
            label="지방"
            current={totals.fat}
            target={data.targetFat}
            unit="g"
          />
        </div>
      ) : (
        /* 모드 A: 총량 요약 */
        <NutritionOverview
          calories={estimatedCalories}
          protein={totals.protein}
          carbs={totals.carbs}
          fat={totals.fat}
        />
      )}

      {/* 수분 섭취 권장 */}
      {data.waterIntake && (
        <div className="mt-4 pt-4 border-t border-edge-subtle">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DropIcon size={16} className="text-muted-foreground" weight="fill" />
              <span className="text-muted-foreground">수분 섭취 권장</span>
            </div>
            <span className="font-medium text-foreground">{data.waterIntake}L</span>
          </div>
        </div>
      )}

      {/* AI 팁 */}
      {data.tips && data.tips.length > 0 && (
        <div className="mt-4 pt-4 border-t border-edge-subtle">
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
