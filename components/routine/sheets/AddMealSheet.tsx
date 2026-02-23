'use client';

import { useState } from 'react';
import Modal, { ModalBody } from '@/components/ui/Modal';
import {
  MagnifyingGlassIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import ChipButton from '@/components/ui/ChipButton';
import SheetFooterAction from '@/components/ui/SheetFooterAction';
import {
  useCatalogSelection,
  useCreateRoutineEvent,
  useUpdateMealData,
} from '@/hooks/routine';
import { useShowError } from '@/lib/stores/errorStore';
import { useRouter } from 'next/navigation';
import { searchFoods, FOOD_CATEGORY_LABELS } from '@/lib/data/foods';
import type { FoodInfo } from '@/lib/data/foods';
import type { FoodItem, Meal, MealType, MealData } from '@/lib/types/meal';
import { MEAL_TYPE_LABELS } from '@/lib/types/meal';
import type { RoutineEvent, RoutineEventCreateData } from '@/lib/types/routine';
import type { FoodCategory } from '@/lib/types/meal';

// ============================================================================
// Types
// ============================================================================

interface AddMealSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  onCreated?: () => void;
  /**
   * 전달 시 → 기존 이벤트에 끼니를 append (PATCH)
   * 미전달 시 → 새 이벤트 생성 (POST)
   */
  existingEvent?: RoutineEvent;
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

export default function AddMealSheet({ isOpen, onClose, date, onCreated, existingEvent }: AddMealSheetProps) {
  const router = useRouter();
  const showError = useShowError();
  const createEvent = useCreateRoutineEvent();
  const updateMeal = useUpdateMealData();

  // 식사 시간 선택
  const [mealType, setMealType] = useState<MealType>('lunch');

  // 선택된 음식 목록
  const [foods, setFoods] = useState<FoodItem[]>([]);

  const {
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    searchResults,
    resetSelection,
  } = useCatalogSelection<FoodCategory, FoodInfo>({
    search: searchFoods,
  });

  // 영양소 합계
  const totals = sumNutrition(foods);

  const handleAddFood = (info: FoodInfo) => {
    setFoods((prev) => [...prev, catalogToFoodItem(info)]);
    setQuery('');
  };

  const handleRemoveFood = (index: number) => {
    setFoods((prev) => prev.filter((_, i) => i !== index));
  };

  const resetState = () => {
    setFoods([]);
    setMealType('lunch');
    resetSelection();
  };

  const handleSave = () => {
    if (foods.length === 0) return;

    const newMeal = {
      type: mealType,
      foods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
    };

    // ── Update 모드: 기존 이벤트에 끼니 append (같은 type이면 foods 병합) ──
    if (existingEvent) {
      const prevMealData = existingEvent.data as MealData;
      const prevMeals = prevMealData.meals ?? [];
      const existingIndex = prevMeals.findIndex((m) => m.type === mealType);

      let updatedMeals: Meal[];
      if (existingIndex !== -1) {
        const existing = prevMeals[existingIndex];
        const merged: Meal = {
          ...existing,
          foods: [...(existing.foods ?? []), ...foods],
          totalCalories: (existing.totalCalories ?? 0) + totals.calories,
          totalProtein: (existing.totalProtein ?? 0) + totals.protein,
          totalCarbs: (existing.totalCarbs ?? 0) + totals.carbs,
          totalFat: (existing.totalFat ?? 0) + totals.fat,
        };
        updatedMeals = prevMeals.map((m, i) => (i === existingIndex ? merged : m));
      } else {
        updatedMeals = [...prevMeals, newMeal];
      }

      const updatedCalories = updatedMeals.reduce((sum, m) => sum + (m.totalCalories ?? 0), 0);
      const nextMealData: MealData = {
        ...prevMealData,
        meals: updatedMeals,
        estimatedTotalCalories: updatedCalories,
      };

      updateMeal.mutate(
        { id: existingEvent.id, data: nextMealData, date: existingEvent.date, type: existingEvent.type },
        {
          onSuccess: () => {
            onClose();
            resetState();
            onCreated?.();
          },
          onError: () => showError('식사 추가에 실패했어요'),
        }
      );
      return;
    }

    // ── Create 모드: 새 이벤트 생성 ──────────────────────────────────────
    const mealData: MealData = {
      meals: [newMeal],
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
        resetState();
        router.refresh();
        onCreated?.();
      },
      onError: () => showError('식단 저장에 실패했어요'),
    });
  };

  const handleClose = () => {
    onClose();
    resetState();
  };

  const isPending = existingEvent ? updateMeal.isPending : createEvent.isPending;
  const foodCategories = Object.entries(FOOD_CATEGORY_LABELS) as [FoodCategory, string][];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={existingEvent ? '식사 추가' : '식단 추가'}
      position="bottom"
      enableSwipe
      height="full"
      showCloseButton
      stickyFooter={
        <SheetFooterAction
          label="저장하기"
          pendingLabel="저장 중..."
          onClick={handleSave}
          disabled={foods.length === 0}
          isLoading={isPending}
        />
      }
    >
      <ModalBody className="p-4 space-y-5">
        {/* 식사 시간 선택 */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">식사 시간</h3>
          <div className="flex gap-2">
            {MEAL_TYPES.map((type) => (
              <ChipButton
                key={type}
                selected={mealType === type}
                onClick={() => setMealType(type)}
              >
                {MEAL_TYPE_LABELS[type]}
              </ChipButton>
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
            <ChipButton
              selected={!categoryFilter}
              onClick={() => setCategoryFilter(null)}
            >
              전체
            </ChipButton>
            {foodCategories.map(([key, label]) => (
              <ChipButton
                key={key}
                selected={categoryFilter === key}
                onClick={() => setCategoryFilter(key === categoryFilter ? null : key)}
              >
                {label}
              </ChipButton>
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

          {/* 빠른 선택 (검색어 없을 때 항상 표시, 추가된 항목 있으면 높이 축소) */}
          {!query && (
            <div className={`overflow-y-auto rounded-xl border border-border/50 divide-y divide-border/30 ${
              foods.length === 0 ? 'max-h-80' : 'max-h-32'
            }`}>
              {searchResults.slice(0, 20).map((item) => (
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
              <NutritionChip label="단백질" value={totals.protein} unit="g" color="text-foreground" />
              <NutritionChip label="탄수화물" value={totals.carbs} unit="g" color="text-foreground" />
              <NutritionChip label="지방" value={totals.fat} unit="g" color="text-foreground" />
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
    </Modal>
  );
}
