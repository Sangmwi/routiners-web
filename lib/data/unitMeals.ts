/**
 * 부대 식단 더미데이터
 *
 * 요일별(0=일~6=토) 3끼(아침/점심/저녁) 식단 템플릿
 * MVP용 하드코딩 데이터 — 향후 실제 API로 교체 예정
 *
 * 각 끼니: 밥 + 국/찌개 + 주찬 + 반찬 + 김치 (전형적 군대 식단)
 * 일일 총칼로리: ~1800-2100kcal
 */

import type { UnitMealItem } from '@/lib/types/unitMeal';
import type { FoodCategory } from '@/lib/types/meal';

// ============================================================================
// Helper
// ============================================================================

interface FoodEntry {
  id: string;
  name: string;
  category: FoodCategory;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function makeMeal(
  type: UnitMealItem['type'],
  time: string,
  foods: FoodEntry[],
): UnitMealItem {
  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
  const totalProtein = foods.reduce((s, f) => s + f.protein, 0);
  const totalCarbs = foods.reduce((s, f) => s + f.carbs, 0);
  const totalFat = foods.reduce((s, f) => s + f.fat, 0);
  return { type, time, foods, totalCalories, totalProtein, totalCarbs, totalFat };
}

// ============================================================================
// 요일별 식단 템플릿 (0=일, 1=월, ..., 6=토)
// ============================================================================

const UNIT_MEAL_TEMPLATES: UnitMealItem[][] = [
  // ── 일요일 (0) ──
  [
    makeMeal('breakfast', '07:30', [
      { id: 'um-0-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-0-b-2', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
      { id: 'um-0-b-3', name: '계란말이', category: 'side', portion: '2조각', calories: 130, protein: 10, carbs: 2, fat: 9 },
      { id: 'um-0-b-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-0-l-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-0-l-2', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
      { id: 'um-0-l-3', name: '불고기', category: 'main', portion: '1인분', calories: 350, protein: 28, carbs: 18, fat: 16 },
      { id: 'um-0-l-4', name: '콩나물무침', category: 'vegetable', portion: '1접시', calories: 35, protein: 3, carbs: 3, fat: 1 },
      { id: 'um-0-l-5', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-0-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-0-d-2', name: '미역국', category: 'soup', portion: '1인분', calories: 80, protein: 5, carbs: 6, fat: 4 },
      { id: 'um-0-d-3', name: '돈까스', category: 'main', portion: '1인분', calories: 550, protein: 28, carbs: 40, fat: 30 },
      { id: 'um-0-d-4', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
  ],

  // ── 월요일 (1) ──
  [
    makeMeal('breakfast', '07:00', [
      { id: 'um-1-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-1-b-2', name: '미역국', category: 'soup', portion: '1인분', calories: 80, protein: 5, carbs: 6, fat: 4 },
      { id: 'um-1-b-3', name: '계란찜', category: 'side', portion: '1인분', calories: 100, protein: 8, carbs: 2, fat: 7 },
      { id: 'um-1-b-4', name: '멸치볶음', category: 'side', portion: '1접시', calories: 80, protein: 8, carbs: 5, fat: 3 },
      { id: 'um-1-b-5', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-1-l-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-1-l-2', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
      { id: 'um-1-l-3', name: '제육볶음', category: 'main', portion: '1인분', calories: 380, protein: 25, carbs: 15, fat: 24 },
      { id: 'um-1-l-4', name: '시금치나물', category: 'vegetable', portion: '1접시', calories: 40, protein: 3, carbs: 3, fat: 2 },
      { id: 'um-1-l-5', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-1-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-1-d-2', name: '육개장', category: 'soup', portion: '1인분', calories: 250, protein: 20, carbs: 12, fat: 14 },
      { id: 'um-1-d-3', name: '두부조림', category: 'side', portion: '1접시', calories: 120, protein: 10, carbs: 5, fat: 7 },
      { id: 'um-1-d-4', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
  ],

  // ── 화요일 (2) ──
  [
    makeMeal('breakfast', '07:00', [
      { id: 'um-2-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-2-b-2', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
      { id: 'um-2-b-3', name: '계란말이', category: 'side', portion: '2조각', calories: 130, protein: 10, carbs: 2, fat: 9 },
      { id: 'um-2-b-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-2-l-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-2-l-2', name: '부대찌개', category: 'soup', portion: '1인분', calories: 350, protein: 18, carbs: 25, fat: 18 },
      { id: 'um-2-l-3', name: '닭갈비', category: 'main', portion: '1인분', calories: 350, protein: 28, carbs: 20, fat: 15 },
      { id: 'um-2-l-4', name: '콩나물무침', category: 'vegetable', portion: '1접시', calories: 35, protein: 3, carbs: 3, fat: 1 },
      { id: 'um-2-l-5', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-2-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-2-d-2', name: '설렁탕', category: 'soup', portion: '1인분', calories: 280, protein: 22, carbs: 5, fat: 18 },
      { id: 'um-2-d-3', name: '잡채', category: 'side', portion: '1접시', calories: 200, protein: 5, carbs: 30, fat: 7 },
      { id: 'um-2-d-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
  ],

  // ── 수요일 (3) ──
  [
    makeMeal('breakfast', '07:00', [
      { id: 'um-3-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-3-b-2', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
      { id: 'um-3-b-3', name: '어묵볶음', category: 'side', portion: '1접시', calories: 110, protein: 7, carbs: 12, fat: 4 },
      { id: 'um-3-b-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-3-l-1', name: '비빔밥', category: 'rice', portion: '1인분', calories: 550, protein: 18, carbs: 75, fat: 15 },
      { id: 'um-3-l-2', name: '미역국', category: 'soup', portion: '1인분', calories: 80, protein: 5, carbs: 6, fat: 4 },
      { id: 'um-3-l-3', name: '고등어구이', category: 'main', portion: '1토막', calories: 220, protein: 22, carbs: 0, fat: 14 },
      { id: 'um-3-l-4', name: '시금치나물', category: 'vegetable', portion: '1접시', calories: 40, protein: 3, carbs: 3, fat: 2 },
      { id: 'um-3-l-5', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-3-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-3-d-2', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
      { id: 'um-3-d-3', name: '닭볶음탕', category: 'main', portion: '1인분', calories: 320, protein: 25, carbs: 18, fat: 15 },
      { id: 'um-3-d-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
  ],

  // ── 목요일 (4) ──
  [
    makeMeal('breakfast', '07:00', [
      { id: 'um-4-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-4-b-2', name: '설렁탕', category: 'soup', portion: '1인분', calories: 280, protein: 22, carbs: 5, fat: 18 },
      { id: 'um-4-b-3', name: '멸치볶음', category: 'side', portion: '1접시', calories: 80, protein: 8, carbs: 5, fat: 3 },
      { id: 'um-4-b-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-4-l-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-4-l-2', name: '육개장', category: 'soup', portion: '1인분', calories: 250, protein: 20, carbs: 12, fat: 14 },
      { id: 'um-4-l-3', name: '갈비찜', category: 'main', portion: '1인분', calories: 450, protein: 35, carbs: 20, fat: 25 },
      { id: 'um-4-l-4', name: '브로콜리', category: 'vegetable', portion: '100g', calories: 35, protein: 3, carbs: 5, fat: 0 },
      { id: 'um-4-l-5', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-4-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-4-d-2', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
      { id: 'um-4-d-3', name: '갈치조림', category: 'main', portion: '1토막', calories: 200, protein: 20, carbs: 8, fat: 10 },
      { id: 'um-4-d-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
  ],

  // ── 금요일 (5) ──
  [
    makeMeal('breakfast', '07:00', [
      { id: 'um-5-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-5-b-2', name: '미역국', category: 'soup', portion: '1인분', calories: 80, protein: 5, carbs: 6, fat: 4 },
      { id: 'um-5-b-3', name: '계란찜', category: 'side', portion: '1인분', calories: 100, protein: 8, carbs: 2, fat: 7 },
      { id: 'um-5-b-4', name: '콩나물무침', category: 'vegetable', portion: '1접시', calories: 35, protein: 3, carbs: 3, fat: 1 },
      { id: 'um-5-b-5', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-5-l-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-5-l-2', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
      { id: 'um-5-l-3', name: '삼겹살', category: 'main', portion: '1인분', calories: 580, protein: 30, carbs: 0, fat: 50 },
      { id: 'um-5-l-4', name: '샐러드', category: 'vegetable', portion: '1접시', calories: 50, protein: 2, carbs: 8, fat: 1 },
      { id: 'um-5-l-5', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-5-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-5-d-2', name: '부대찌개', category: 'soup', portion: '1인분', calories: 350, protein: 18, carbs: 25, fat: 18 },
      { id: 'um-5-d-3', name: '계란말이', category: 'side', portion: '2조각', calories: 130, protein: 10, carbs: 2, fat: 9 },
      { id: 'um-5-d-4', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
  ],

  // ── 토요일 (6) ──
  [
    makeMeal('breakfast', '08:00', [
      { id: 'um-6-b-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-6-b-2', name: '떡국', category: 'soup', portion: '1인분', calories: 420, protein: 15, carbs: 60, fat: 12 },
      { id: 'um-6-b-3', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
    makeMeal('lunch', '12:00', [
      { id: 'um-6-l-1', name: '비빔밥', category: 'rice', portion: '1인분', calories: 550, protein: 18, carbs: 75, fat: 15 },
      { id: 'um-6-l-2', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
      { id: 'um-6-l-3', name: '두부조림', category: 'side', portion: '1접시', calories: 120, protein: 10, carbs: 5, fat: 7 },
      { id: 'um-6-l-4', name: '깍두기', category: 'side', portion: '1접시', calories: 20, protein: 1, carbs: 3, fat: 0 },
    ]),
    makeMeal('dinner', '18:00', [
      { id: 'um-6-d-1', name: '쌀밥', category: 'rice', portion: '1공기', calories: 313, protein: 5, carbs: 69, fat: 1 },
      { id: 'um-6-d-2', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
      { id: 'um-6-d-3', name: '제육볶음', category: 'main', portion: '1인분', calories: 380, protein: 25, carbs: 15, fat: 24 },
      { id: 'um-6-d-4', name: '시금치나물', category: 'vegetable', portion: '1접시', calories: 40, protein: 3, carbs: 3, fat: 2 },
      { id: 'um-6-d-5', name: '배추김치', category: 'side', portion: '1접시', calories: 15, protein: 1, carbs: 2, fat: 0 },
    ]),
  ],
];

// ============================================================================
// Public API
// ============================================================================

/**
 * 날짜에 해당하는 부대 식단 템플릿 반환
 *
 * MVP: unitId 무시, 요일 기반 동일 데이터 반환
 * 타임존 안전하게 YYYY-MM-DD 직접 파싱
 */
export function getUnitMealTemplate(date: string): UnitMealItem[] {
  const [y, m, d] = date.split('-').map(Number);
  const dayOfWeek = new Date(y, m - 1, d).getDay();
  return UNIT_MEAL_TEMPLATES[dayOfWeek] ?? UNIT_MEAL_TEMPLATES[1];
}
