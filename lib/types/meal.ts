/**
 * Meal Types
 *
 * 식단 AI 및 routine_events 식단 데이터 타입 정의
 * 운동 AI (WorkoutData)와 병렬 구조
 */

// ============================================================================
// Food Item Types (음식 항목)
// ============================================================================

/**
 * 음식 카테고리
 */
export type FoodCategory =
  | 'main'      // 주찬
  | 'side'      // 부찬
  | 'soup'      // 국/탕
  | 'rice'      // 밥/면
  | 'protein'   // 단백질원
  | 'vegetable' // 채소
  | 'snack'     // 간식
  | 'drink';    // 음료

/**
 * 음식 출처
 */
export type FoodSource =
  | 'canteen'   // 부대 식당
  | 'px'        // PX
  | 'outside'   // 외출/외박 외식
  | 'homemade'; // 직접 조리

/**
 * 개별 음식 항목
 */
export interface FoodItem {
  /** 음식 ID */
  id: string;
  /** 음식명 (한국어) */
  name: string;
  /** 음식 카테고리 */
  category?: FoodCategory;
  /** 분량/양 (예: "1공기", "200g", "1개") */
  portion: string;
  /** 칼로리 (kcal) */
  calories?: number;
  /** 단백질 (g) */
  protein?: number;
  /** 탄수화물 (g) */
  carbs?: number;
  /** 지방 (g) */
  fat?: number;
  /** 음식 출처 */
  source?: FoodSource;
  /** 대체 음식 목록 */
  alternatives?: string[];
  /** 메모/조리법 */
  notes?: string;
}

// ============================================================================
// Meal Types (식사)
// ============================================================================

/**
 * 식사 타입
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * 단일 식사 (아침/점심/저녁/간식)
 */
export interface Meal {
  /** 식사 타입 */
  type: MealType;
  /** 식사 시간 (예: "07:00", "12:00") */
  time?: string;
  /** 음식 목록 */
  foods: FoodItem[];
  /** 총 칼로리 */
  totalCalories?: number;
  /** 총 단백질 */
  totalProtein?: number;
  /** 총 탄수화물 */
  totalCarbs?: number;
  /** 총 지방 */
  totalFat?: number;
  /** 식사 팁/조언 */
  tips?: string[];
  /** 메모 */
  notes?: string;
}

/**
 * 하루 식단 데이터 (routine_events.data JSONB)
 * WorkoutData와 병렬 구조
 */
export interface MealData {
  /** 식사 목록 */
  meals: Meal[];
  /** 하루 목표 칼로리 */
  targetCalories?: number;
  /** 하루 목표 단백질 */
  targetProtein?: number;
  /** 하루 목표 탄수화물 */
  targetCarbs?: number;
  /** 하루 목표 지방 */
  targetFat?: number;
  /** 하루 총 예상 칼로리 */
  estimatedTotalCalories?: number;
  /** 수분 섭취 권장량 (L) */
  waterIntake?: number;
  /** 식단 유형 */
  dietType?: string;
  /** AI 조언 */
  tips?: string[];
  /** 전체 메모 */
  notes?: string;
}

// ============================================================================
// Dietary Profile Types (식단 프로필)
// ============================================================================

/**
 * 식단 목표
 */
export const DIETARY_GOALS = [
  'muscle_gain',    // 근육 증가 (벌크업)
  'fat_loss',       // 체지방 감소 (커팅)
  'maintenance',    // 체중 유지
  'health',         // 건강 유지
  'performance',    // 운동 퍼포먼스
] as const;

export type DietaryGoal = (typeof DIETARY_GOALS)[number];

/**
 * 식단 유형
 */
export const DIET_TYPES = [
  'regular',        // 일반식
  'high_protein',   // 고단백
  'low_carb',       // 저탄수화물
  'balanced',       // 균형 잡힌
  'bulking',        // 벌크업
  'cutting',        // 커팅
] as const;

export type DietType = (typeof DIET_TYPES)[number];

/**
 * 음식 제한사항
 */
export const FOOD_RESTRICTIONS = [
  'none',           // 없음
  'dairy',          // 유제품
  'seafood',        // 해산물
  'nuts',           // 견과류
  'gluten',         // 글루텐
  'egg',            // 계란
  'pork',           // 돼지고기
  'beef',           // 소고기
  'spicy',          // 매운 음식
] as const;

export type FoodRestriction = (typeof FOOD_RESTRICTIONS)[number];

/**
 * 이용 가능한 음식 출처
 */
export const AVAILABLE_SOURCES = [
  'canteen',        // 부대 식당
  'px',             // PX
  'outside',        // 외출/외박 시 외식
  'delivery',       // 배달 (휴가 중)
] as const;

export type AvailableSource = (typeof AVAILABLE_SOURCES)[number];

/**
 * 식습관
 */
export const EATING_HABITS = [
  'regular',        // 규칙적 식사
  'late_night',     // 야식 자주
  'eating_out',     // 외식 많음
  'snacking',       // 간식 많음
  'skipping_meals', // 식사 거르기
  'overeating',     // 과식
  'fast_eating',    // 빨리 먹음
] as const;

export type EatingHabit = (typeof EATING_HABITS)[number];

// ============================================================================
// Korean Labels (한국어 레이블)
// ============================================================================

export const DIETARY_GOAL_LABELS: Record<DietaryGoal, string> = {
  muscle_gain: '근육 증가 (벌크업)',
  fat_loss: '체지방 감소 (커팅)',
  maintenance: '체중 유지',
  health: '건강 유지',
  performance: '운동 퍼포먼스',
};

export const DIET_TYPE_LABELS: Record<DietType, string> = {
  regular: '일반식',
  high_protein: '고단백',
  low_carb: '저탄수화물',
  balanced: '균형 잡힌 식단',
  bulking: '벌크업 식단',
  cutting: '커팅 식단',
};

export const FOOD_RESTRICTION_LABELS: Record<FoodRestriction, string> = {
  none: '없음',
  dairy: '유제품',
  seafood: '해산물',
  nuts: '견과류',
  gluten: '글루텐',
  egg: '계란',
  pork: '돼지고기',
  beef: '소고기',
  spicy: '매운 음식',
};

export const AVAILABLE_SOURCE_LABELS: Record<AvailableSource, string> = {
  canteen: '부대 식당',
  px: 'PX',
  outside: '외출/외박 외식',
  delivery: '배달 (휴가 중)',
};

export const EATING_HABIT_LABELS: Record<EatingHabit, string> = {
  regular: '규칙적 식사',
  late_night: '야식 자주 먹음',
  eating_out: '외식 많음',
  snacking: '간식 많음',
  skipping_meals: '식사 자주 거름',
  overeating: '과식하는 편',
  fast_eating: '빨리 먹는 편',
};

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: '아침',
  lunch: '점심',
  dinner: '저녁',
  snack: '간식',
};

// ============================================================================
// Database Types (dietary_profiles 테이블)
// ============================================================================

/**
 * DB 식단 프로필 (snake_case)
 */
export interface DbDietaryProfile {
  user_id: string;
  dietary_goal: DietaryGoal | null;
  diet_type: DietType | null;
  target_calories: number | null;
  target_protein: number | null;
  meals_per_day: number | null;
  food_restrictions: FoodRestriction[];
  available_sources: AvailableSource[];
  eating_habits: EatingHabit[];
  budget_per_month: number | null;
  preferences: string[];
  ai_notes: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * 클라이언트 식단 프로필 (camelCase)
 */
export interface DietaryProfile {
  userId: string;
  dietaryGoal?: DietaryGoal;
  dietType?: DietType;
  targetCalories?: number;
  targetProtein?: number;
  mealsPerDay?: number;
  foodRestrictions: FoodRestriction[];
  availableSources: AvailableSource[];
  eatingHabits: EatingHabit[];
  budgetPerMonth?: number;
  preferences: string[];
  aiNotes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/**
 * DB → 클라이언트 변환
 */
export function transformDbDietaryProfile(db: DbDietaryProfile): DietaryProfile {
  return {
    userId: db.user_id,
    dietaryGoal: db.dietary_goal ?? undefined,
    dietType: db.diet_type ?? undefined,
    targetCalories: db.target_calories ?? undefined,
    targetProtein: db.target_protein ?? undefined,
    mealsPerDay: db.meals_per_day ?? undefined,
    foodRestrictions: db.food_restrictions ?? [],
    availableSources: db.available_sources ?? [],
    eatingHabits: db.eating_habits ?? [],
    budgetPerMonth: db.budget_per_month ?? undefined,
    preferences: db.preferences ?? [],
    aiNotes: db.ai_notes ?? {},
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ============================================================================
// Meal Plan Preview Types (AI 미리보기)
// ============================================================================

/**
 * 미리보기용 음식 항목
 */
export interface MealPreviewFoodItem {
  name: string;
  portion: string;
  calories?: number;
  protein?: number;
  source?: string;
}

/**
 * 미리보기용 단일 식사
 */
export interface MealPreviewMeal {
  type: MealType;
  time?: string;
  foods: MealPreviewFoodItem[];
  totalCalories?: number;
}

/**
 * 미리보기용 하루 식단
 */
export interface MealPreviewDay {
  dayOfWeek: number; // 1=월, 2=화, ..., 7=일
  meals: MealPreviewMeal[];
  totalCalories?: number;
  notes?: string;
}

/**
 * 미리보기용 주간 식단
 */
export interface MealPreviewWeek {
  weekNumber: number;
  days: MealPreviewDay[];
}

/**
 * 식단 충돌 정보
 */
export interface MealPlanConflict {
  date: string;
  existingTitle: string;
}

/**
 * 식단 미리보기 데이터 (ChatMealPreview에서 사용)
 */
export interface MealPlanPreviewData {
  id: string;
  title: string;
  description: string;
  durationWeeks: number;
  targetCalories: number;
  targetProtein: number;
  weeks: MealPreviewWeek[];
  rawMealData?: Record<string, unknown>;
  conflicts?: MealPlanConflict[];
}

// ============================================================================
// AI Tool Types (도구 결과 타입)
// ============================================================================

/**
 * 식단 프로필 조회 결과
 */
export interface DietaryProfileResult {
  dietaryGoal: DietaryGoal | null;
  dietType: DietType | null;
  targetCalories: number | null;
  targetProtein: number | null;
  mealsPerDay: number | null;
  foodRestrictions: FoodRestriction[];
  availableSources: AvailableSource[];
  eatingHabits: EatingHabit[];
  budgetPerMonth: number | null;
  preferences: string[];
}

/**
 * 일일 영양 필요량 계산 결과
 */
export interface DailyNeedsResult {
  tdee: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  recommendation: string;
}

/**
 * 식단 적용 결과
 */
export interface MealPlanApplyResult {
  saved: boolean;
  eventsCreated: number;
  startDate: string;
}
