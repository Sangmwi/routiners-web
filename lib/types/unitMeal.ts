/**
 * Unit Meal Types (부대 식단)
 *
 * 부대 식단 불러오기 API 응답 타입 정의
 * 기존 Meal 인터페이스와 호환되어 MealData 변환이 단순 매핑으로 가능
 */

import type { MealType, FoodItem } from './meal';
import type { RoutineEvent, RoutineEventCreateData } from './routine';

/**
 * 부대 단일 식사 메뉴 (아침/점심/저녁)
 */
export interface UnitMealItem {
  type: MealType;
  time?: string;
  foods: FoodItem[];
  totalCalories?: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
}

/**
 * 부대 하루 식단 메뉴 (API 응답)
 */
export interface UnitMealMenu {
  unitId: string;
  unitName: string;
  date: string;
  meals: UnitMealItem[];
  estimatedTotalCalories?: number;
  source: 'dummy';
}

// ============================================================================
// Batch Import Types
// ============================================================================

/**
 * 배치 식단 생성 요청 (aiSessionId 불필요)
 */
export interface MealBatchCreateData {
  events: RoutineEventCreateData[];
}

/**
 * 배치 식단 생성 결과
 */
export interface MealBatchResult {
  created: RoutineEvent[];
  skipped: string[];
}
