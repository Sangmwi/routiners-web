'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import {
  MagnifyingGlassIcon,
  TrashIcon,
  SpinnerGapIcon,
} from '@phosphor-icons/react';
import { useCreateRoutineEvent } from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { useRouter } from 'next/navigation';
import { searchFoods, FOOD_CATEGORY_LABELS } from '@/lib/data/foods';
import type { FoodInfo } from '@/lib/data/foods';
import type { FoodItem, MealType, MealData } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';
import type { RoutineEventCreateData } from '@/lib/types/routine';
import type { FoodCategory } from '@/lib/types/meal';

// ============================================================================
// Types
// ============================================================================

interface AddMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
}

// ============================================================================
// Helpers
// ============================================================================

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

function catalogToFoodItem(info: FoodInfo): FoodItem {
  return {
    id: crypto.randomUUID(),
    name: info.name,
    category: info.category,
    portion: info.portion,
    calories: info.calories,
    protein: info.protein,
    carbs: info.carbs,
    fat: info.fat,
  };
}

function sumNutrition(foods: FoodItem[]) {
  return foods.reduce(
    (acc, f) => ({
      calories: acc.calories + (f.calories ?? 0),
      protein: acc.protein + (f.protein ?? 0),
      carbs: acc.carbs + (f.carbs ?? 0),
      fat: acc.fat + (f.fat ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// ============================================================================
// Sub Components
// ============================================================================

interface NutritionChipProps {
  label: string;
  value: number;
  unit: string;
  color: string;
}

function NutritionChip({ label, value, unit, color }: NutritionChipProps) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`text-lg font-bold tabular-nums ${color}`}>
        {value}
        <span className="text-xs font-normal">{unit}</span>
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

interface FoodItemRowProps {
  food: FoodItem;
  onRemove: () => void;
}

function FoodItemRow({ food, onRemove }: FoodItemRowProps) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium">{food.name}</span>
        <span className="text-xs text-muted-foreground ml-2">{food.portion}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {food.calories}kcal
        </span>
        <button type="button" onClick={onRemove} className="p-1 text-muted-foreground/50">
          <TrashIcon size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function AddMealSheet({ isOpen, onClose, date }: AddMealSheetProps) {
  const router = useRouter();
  const showError = useShowError();
  const createEvent = useCreateRoutineEvent();

  // 식사 시간 선택
  const [mealType, setMealType] = useState<MealType>('lunch');

  // 검색 상태
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<FoodCategory | null>(null);

  // 선택된 음식 목록
  const [foods, setFoods] = useState<FoodItem[]>([]);

  // 검색 결과
  const searchResults = searchFoods(query, categoryFilter ?? undefined);

  // 영양소 합계
  const totals = sumNutrition(foods);

  const handleAddFood = (info: FoodInfo) => {
    setFoods((prev) => [...prev, catalogToFoodItem(info)]);
    setQuery('');
  };

  const handleRemoveFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (foods.length === 0) return;

    const mealData: MealData = {
      meals: [
        {
          type: mealType,
          foods,
          totalCalories: totals.calories,
          totalProtein: totals.protein,
          totalCarbs: totals.carbs,
          totalFat: totals.fat,
        },
      ],
      estimatedTotalCalories: totals.calories,
    };

    const eventData: RoutineEventCreateData = {
      type: 'meal',
      date,
      title: `${MEAL_TYPE_LABELS[mealType]} 식단`,
      source: 'user',
      data: mealData,
    };

    createEvent.mutate(eventData, {
      onSuccess: () => {
        onClose();
        setFoods([]);
        setQuery('');
        setMealType('lunch');
        setCategoryFilter(null);
        router.refresh();
      },
      onError: () => showError('식단 저장에 실패했어요'),
    });
  };

  const handleClose = () => {
    onClose();
    setFoods([]);
    setQuery('');
    setMealType('lunch');
    setCategoryFilter(null);
  };

  const foodCategories = Object.entries(FOOD_CATEGORY_LABELS) as [FoodCategory, string][];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="식단 추가"
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton
    >
      <ModalBody className="p-4 space-y-5 pb-32">
        {/* 식사 시간 선택 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">식사 시간</h3>
          <div className="flex gap-2">
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMealType(type)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full ${
                  mealType === type
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {MEAL_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        {/* 음식 검색 */}
        <div className="space-y-3">
          <div className="relative">
            <MagnifyingGlassIcon
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="음식 검색..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setCategoryFilter(null)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                !categoryFilter
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/50 text-muted-foreground'
              }`}
            >
              전체
            </button>
            {foodCategories.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key === categoryFilter ? null : key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap ${
                  categoryFilter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 검색 결과 */}
          {query && (
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/30">
              {searchResults.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground text-center">
                  결과 없음
                </p>
              ) : (
                searchResults.slice(0, 20).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleAddFood(item)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                  >
                    <div>
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.portion}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {item.calories}kcal
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* 빠른 선택 (검색어 없을 때, 음식 미선택) */}
          {!query && foods.length === 0 && (
            <div className="max-h-60 overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/30">
              {searchResults.slice(0, 15).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleAddFood(item)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                >
                  <div>
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.portion}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {item.calories}kcal
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 선택된 음식 목록 + 영양소 요약 */}
        {foods.length > 0 && (
          <div className="space-y-4">
            {/* 영양소 요약 */}
            <div className="bg-muted/20 rounded-xl p-4 flex justify-around">
              <NutritionChip label="칼로리" value={totals.calories} unit="kcal" color="text-orange-500" />
              <NutritionChip label="단백질" value={totals.protein} unit="g" color="text-blue-500" />
              <NutritionChip label="탄수화물" value={totals.carbs} unit="g" color="text-green-500" />
              <NutritionChip label="지방" value={totals.fat} unit="g" color="text-yellow-500" />
            </div>

            {/* 음식 리스트 */}
            <div>
              <h3 className="text-sm font-semibold mb-2">
                추가된 음식 ({foods.length}개)
              </h3>
              <div className="divide-y divide-border/30">
                {foods.map((food, index) => (
                  <FoodItemRow
                    key={food.id}
                    food={food}
                    onRemove={() => handleRemoveFood(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </ModalBody>

      {/* 저장 버튼 (고정) */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-card border-t border-border/50 pb-safe">
        <button
          type="button"
          onClick={handleSave}
          disabled={foods.length === 0 || createEvent.isPending}
          className="w-full py-3.5 rounded-xl font-medium bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {createEvent.isPending && <SpinnerGapIcon size={16} className="animate-spin" />}
          {createEvent.isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </Modal>
  );
}
