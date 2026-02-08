/**
 * 식품 카탈로그 데이터 (하드코딩)
 *
 * TODO: 외부 API 연동 (식약처 공공 API 등)
 *
 * 영양 정보 단위: calories(kcal), protein/carbs/fat(g)
 * 기준: 1인분 기준 대략적 영양소 (참고용)
 */

import type { FoodCategory } from '@/lib/types/meal';

// ============================================================================
// Types
// ============================================================================

export interface FoodInfo {
  id: string;
  name: string;
  category: FoodCategory;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  rice: '밥/면',
  soup: '국/탕/찌개',
  main: '주찬',
  side: '부찬/반찬',
  protein: '단백질',
  vegetable: '채소/샐러드',
  snack: '간식',
  drink: '음료',
};

// ============================================================================
// Data
// ============================================================================

export const FOODS: FoodInfo[] = [
  // === 밥/면 ===
  { id: 'rice-white', name: '쌀밥', category: 'rice', portion: '1공기 (210g)', calories: 313, protein: 5, carbs: 69, fat: 1 },
  { id: 'rice-brown', name: '현미밥', category: 'rice', portion: '1공기 (210g)', calories: 310, protein: 6, carbs: 65, fat: 2 },
  { id: 'rice-mixed', name: '잡곡밥', category: 'rice', portion: '1공기 (210g)', calories: 305, protein: 7, carbs: 64, fat: 2 },
  { id: 'ramen-instant', name: '라면', category: 'rice', portion: '1봉 (120g)', calories: 500, protein: 10, carbs: 70, fat: 18 },
  { id: 'udon', name: '우동', category: 'rice', portion: '1인분', calories: 380, protein: 12, carbs: 65, fat: 5 },
  { id: 'bibimbap', name: '비빔밥', category: 'rice', portion: '1인분', calories: 550, protein: 18, carbs: 75, fat: 15 },
  { id: 'kimbap', name: '김밥', category: 'rice', portion: '1줄', calories: 420, protein: 12, carbs: 60, fat: 12 },
  { id: 'triangular-kimbap', name: '삼각김밥', category: 'rice', portion: '1개', calories: 200, protein: 5, carbs: 35, fat: 3 },

  // === 국/탕/찌개 ===
  { id: 'doenjang-jjigae', name: '된장찌개', category: 'soup', portion: '1인분', calories: 120, protein: 8, carbs: 10, fat: 5 },
  { id: 'kimchi-jjigae', name: '김치찌개', category: 'soup', portion: '1인분', calories: 180, protein: 12, carbs: 10, fat: 10 },
  { id: 'miyeok-guk', name: '미역국', category: 'soup', portion: '1인분', calories: 80, protein: 5, carbs: 6, fat: 4 },
  { id: 'budae-jjigae', name: '부대찌개', category: 'soup', portion: '1인분', calories: 350, protein: 18, carbs: 25, fat: 18 },
  { id: 'yukgaejang', name: '육개장', category: 'soup', portion: '1인분', calories: 250, protein: 20, carbs: 12, fat: 14 },
  { id: 'seolleongtang', name: '설렁탕', category: 'soup', portion: '1인분', calories: 280, protein: 22, carbs: 5, fat: 18 },
  { id: 'tteokguk', name: '떡국', category: 'soup', portion: '1인분', calories: 420, protein: 15, carbs: 60, fat: 12 },

  // === 주찬 (육류/해산물) ===
  { id: 'jeyuk-bokkeum', name: '제육볶음', category: 'main', portion: '1인분 (150g)', calories: 380, protein: 25, carbs: 15, fat: 24 },
  { id: 'bulgogi', name: '불고기', category: 'main', portion: '1인분 (150g)', calories: 350, protein: 28, carbs: 18, fat: 16 },
  { id: 'samgyeopsal', name: '삼겹살', category: 'main', portion: '1인분 (200g)', calories: 580, protein: 30, carbs: 0, fat: 50 },
  { id: 'dakgalbi', name: '닭갈비', category: 'main', portion: '1인분', calories: 350, protein: 28, carbs: 20, fat: 15 },
  { id: 'dakbokkeum', name: '닭볶음탕', category: 'main', portion: '1인분', calories: 320, protein: 25, carbs: 18, fat: 15 },
  { id: 'galbi-jjim', name: '갈비찜', category: 'main', portion: '1인분', calories: 450, protein: 35, carbs: 20, fat: 25 },
  { id: 'godeungeo-gui', name: '고등어구이', category: 'main', portion: '1토막', calories: 220, protein: 22, carbs: 0, fat: 14 },
  { id: 'galchi-jorim', name: '갈치조림', category: 'main', portion: '1토막', calories: 200, protein: 20, carbs: 8, fat: 10 },
  { id: 'donkatsu', name: '돈까스', category: 'main', portion: '1인분', calories: 550, protein: 28, carbs: 40, fat: 30 },
  { id: 'tteokbokki', name: '떡볶이', category: 'main', portion: '1인분', calories: 380, protein: 8, carbs: 65, fat: 10 },

  // === 부찬/반찬 ===
  { id: 'kimchi', name: '배추김치', category: 'side', portion: '1접시 (50g)', calories: 15, protein: 1, carbs: 2, fat: 0 },
  { id: 'kkakdugi', name: '깍두기', category: 'side', portion: '1접시 (50g)', calories: 20, protein: 1, carbs: 3, fat: 0 },
  { id: 'gyeran-mari', name: '계란말이', category: 'side', portion: '2조각', calories: 130, protein: 10, carbs: 2, fat: 9 },
  { id: 'gyeran-jjim', name: '계란찜', category: 'side', portion: '1인분', calories: 100, protein: 8, carbs: 2, fat: 7 },
  { id: 'japchae', name: '잡채', category: 'side', portion: '1접시', calories: 200, protein: 5, carbs: 30, fat: 7 },
  { id: 'myeolchi-bokkeum', name: '멸치볶음', category: 'side', portion: '1접시', calories: 80, protein: 8, carbs: 5, fat: 3 },
  { id: 'dubu-jorim', name: '두부조림', category: 'side', portion: '1접시', calories: 120, protein: 10, carbs: 5, fat: 7 },
  { id: 'eomuk-bokkeum', name: '어묵볶음', category: 'side', portion: '1접시', calories: 110, protein: 7, carbs: 12, fat: 4 },

  // === 채소 ===
  { id: 'sigeumchi-namul', name: '시금치나물', category: 'vegetable', portion: '1접시', calories: 40, protein: 3, carbs: 3, fat: 2 },
  { id: 'kongnamul', name: '콩나물무침', category: 'vegetable', portion: '1접시', calories: 35, protein: 3, carbs: 3, fat: 1 },
  { id: 'salad-mix', name: '샐러드', category: 'vegetable', portion: '1접시', calories: 50, protein: 2, carbs: 8, fat: 1 },
  { id: 'broccoli', name: '브로콜리', category: 'vegetable', portion: '100g', calories: 35, protein: 3, carbs: 5, fat: 0 },
  { id: 'sweet-potato', name: '고구마', category: 'vegetable', portion: '1개 (150g)', calories: 190, protein: 2, carbs: 44, fat: 0 },

  // === 단백질 보충 ===
  { id: 'chicken-breast', name: '닭가슴살', category: 'protein', portion: '100g', calories: 165, protein: 31, carbs: 0, fat: 4 },
  { id: 'chicken-breast-salad', name: '닭가슴살 샐러드', category: 'protein', portion: '1인분', calories: 220, protein: 30, carbs: 8, fat: 7 },
  { id: 'boiled-egg', name: '삶은 계란', category: 'protein', portion: '1개', calories: 72, protein: 6, carbs: 1, fat: 5 },
  { id: 'protein-shake', name: '프로틴 쉐이크', category: 'protein', portion: '1잔 (30g 분말)', calories: 120, protein: 24, carbs: 3, fat: 1 },
  { id: 'protein-bar', name: '프로틴바', category: 'protein', portion: '1개', calories: 200, protein: 20, carbs: 20, fat: 7 },
  { id: 'tofu', name: '두부', category: 'protein', portion: '1/2모 (150g)', calories: 130, protein: 13, carbs: 3, fat: 7 },
  { id: 'greek-yogurt', name: '그릭요거트', category: 'protein', portion: '1개 (100g)', calories: 90, protein: 10, carbs: 5, fat: 3 },
  { id: 'milk', name: '우유', category: 'protein', portion: '1잔 (200ml)', calories: 130, protein: 6, carbs: 10, fat: 7 },
  { id: 'tuna-can', name: '참치캔', category: 'protein', portion: '1캔 (100g)', calories: 130, protein: 25, carbs: 0, fat: 3 },

  // === 간식 ===
  { id: 'banana', name: '바나나', category: 'snack', portion: '1개', calories: 93, protein: 1, carbs: 23, fat: 0 },
  { id: 'apple', name: '사과', category: 'snack', portion: '1개', calories: 80, protein: 0, carbs: 21, fat: 0 },
  { id: 'nuts-mixed', name: '믹스넛', category: 'snack', portion: '1봉 (30g)', calories: 180, protein: 5, carbs: 6, fat: 16 },
  { id: 'chocopie', name: '초코파이', category: 'snack', portion: '1개', calories: 160, protein: 2, carbs: 24, fat: 6 },
  { id: 'cup-ramen', name: '컵라면', category: 'snack', portion: '1개', calories: 300, protein: 6, carbs: 42, fat: 12 },
  { id: 'bread-cream', name: '크림빵', category: 'snack', portion: '1개', calories: 280, protein: 5, carbs: 40, fat: 10 },
  { id: 'rice-cake', name: '떡', category: 'snack', portion: '3개', calories: 150, protein: 2, carbs: 33, fat: 0 },

  // === 음료 ===
  { id: 'americano', name: '아메리카노', category: 'drink', portion: '1잔', calories: 5, protein: 0, carbs: 1, fat: 0 },
  { id: 'latte', name: '카페라떼', category: 'drink', portion: '1잔', calories: 150, protein: 6, carbs: 12, fat: 8 },
  { id: 'energy-drink', name: '에너지 드링크', category: 'drink', portion: '1캔', calories: 110, protein: 0, carbs: 28, fat: 0 },
  { id: 'sports-drink', name: '이온음료', category: 'drink', portion: '1병 (500ml)', calories: 125, protein: 0, carbs: 31, fat: 0 },
  { id: 'orange-juice', name: '오렌지주스', category: 'drink', portion: '1잔 (200ml)', calories: 90, protein: 1, carbs: 21, fat: 0 },
  { id: 'soy-milk', name: '두유', category: 'drink', portion: '1팩 (200ml)', calories: 130, protein: 6, carbs: 14, fat: 5 },
];

// ============================================================================
// Helpers
// ============================================================================

/**
 * 음식 검색 (이름 prefix match)
 */
export function searchFoods(query: string, category?: FoodCategory): FoodInfo[] {
  const normalized = query.trim().toLowerCase();
  let results = FOODS;

  if (category) {
    results = results.filter((f) => f.category === category);
  }

  if (!normalized) return results;

  return results.filter((f) => f.name.toLowerCase().includes(normalized));
}

/**
 * 카테고리별 음식 그룹핑
 */
export function getFoodsByCategory(): Record<FoodCategory, FoodInfo[]> {
  return FOODS.reduce(
    (acc, food) => {
      if (!acc[food.category]) acc[food.category] = [];
      acc[food.category].push(food);
      return acc;
    },
    {} as Record<FoodCategory, FoodInfo[]>,
  );
}
