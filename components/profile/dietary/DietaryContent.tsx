'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProfileFormChipOption as ChipOption,
  ProfileFormSection as Section,
  ProfileFormSelectOption as SelectOption,
  ProfileFormNumberOption as NumberOption,
  ProfileFormTagInput as TagInput,
} from '@/components/profile/form/ProfileFormPrimitives';
import FloatingSaveButton from '@/components/ui/FloatingSaveButton';
import { useDietaryProfileSuspense, useUpdateDietaryProfile } from '@/hooks/dietaryProfile';
import {
  DietaryGoal,
  DietType,
  FoodRestriction,
  AvailableSource,
  EatingHabit,
  DIETARY_GOALS,
  DIET_TYPES,
  FOOD_RESTRICTIONS,
  AVAILABLE_SOURCES,
  EATING_HABITS,
  MEALS_PER_DAY_OPTIONS,
  DIETARY_GOAL_LABELS,
  DIET_TYPE_LABELS,
  FOOD_RESTRICTION_LABELS,
  AVAILABLE_SOURCE_LABELS,
  EATING_HABIT_LABELS,
  DietaryProfileUpdateData,
  DietaryProfile,
} from '@/lib/types/meal';

function createFormData(profile: DietaryProfile | null): DietaryProfileUpdateData {
  return {
    dietaryGoal: profile?.dietaryGoal ?? null,
    dietType: profile?.dietType ?? null,
    targetCalories: profile?.targetCalories ?? null,
    targetProtein: profile?.targetProtein ?? null,
    mealsPerDay: profile?.mealsPerDay ?? null,
    foodRestrictions: profile?.foodRestrictions ?? [],
    availableSources: profile?.availableSources ?? [],
    eatingHabits: profile?.eatingHabits ?? [],
    budgetPerMonth: profile?.budgetPerMonth ?? null,
    preferences: profile?.preferences ?? [],
  };
}

// 채워진 필드 수 계산
function countFilledFields(data: DietaryProfileUpdateData): number {
  let count = 0;
  if (data.dietaryGoal) count++;
  if (data.dietType) count++;
  if (data.mealsPerDay) count++;
  if (data.targetCalories) count++;
  if (data.targetProtein) count++;
  if (data.budgetPerMonth) count++;
  if (data.foodRestrictions && data.foodRestrictions.length > 0) count++;
  if (data.availableSources && data.availableSources.length > 0) count++;
  if (data.eatingHabits && data.eatingHabits.length > 0) count++;
  if (data.preferences && data.preferences.length > 0) count++;
  return count;
}

const TOTAL_FIELDS = 10;

export default function DietaryContent() {
  const router = useRouter();
  const { data: profile } = useDietaryProfileSuspense();
  const updateProfile = useUpdateDietaryProfile();

  const [formData, setFormData] = useState<DietaryProfileUpdateData>(() =>
    createFormData(profile),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges =
    formData.dietaryGoal !== (profile?.dietaryGoal ?? null) ||
    formData.dietType !== (profile?.dietType ?? null) ||
    formData.targetCalories !== (profile?.targetCalories ?? null) ||
    formData.targetProtein !== (profile?.targetProtein ?? null) ||
    formData.mealsPerDay !== (profile?.mealsPerDay ?? null) ||
    formData.budgetPerMonth !== (profile?.budgetPerMonth ?? null) ||
    JSON.stringify(formData.foodRestrictions) !==
      JSON.stringify(profile?.foodRestrictions ?? []) ||
    JSON.stringify(formData.availableSources) !==
      JSON.stringify(profile?.availableSources ?? []) ||
    JSON.stringify(formData.eatingHabits) !==
      JSON.stringify(profile?.eatingHabits ?? []) ||
    JSON.stringify(formData.preferences) !==
      JSON.stringify(profile?.preferences ?? []);

  const filledCount = countFilledFields(formData);
  const filledPercentage = Math.round((filledCount / TOTAL_FIELDS) * 100);

  const handleSave = () => {
    setSaveError(null);

    updateProfile.mutate(formData, {
      onSuccess: () => {
        setShowSuccess(true);
        setTimeout(() => router.back(), 600);
      },
      onError: () => setSaveError('저장에 실패했어요.'),
    });
  };

  const toggleFoodRestriction = (restriction: FoodRestriction) => {
    setFormData((prev) => ({
      ...prev,
      foodRestrictions: prev.foodRestrictions?.includes(restriction)
        ? prev.foodRestrictions.filter((r) => r !== restriction)
        : [...(prev.foodRestrictions ?? []), restriction],
    }));
  };

  const toggleAvailableSource = (source: AvailableSource) => {
    setFormData((prev) => ({
      ...prev,
      availableSources: prev.availableSources?.includes(source)
        ? prev.availableSources.filter((s) => s !== source)
        : [...(prev.availableSources ?? []), source],
    }));
  };

  const toggleEatingHabit = (habit: EatingHabit) => {
    setFormData((prev) => ({
      ...prev,
      eatingHabits: prev.eatingHabits?.includes(habit)
        ? prev.eatingHabits.filter((h) => h !== habit)
        : [...(prev.eatingHabits ?? []), habit],
    }));
  };

  return (
    <>
      {/* 프로그레스바 */}
      <div className="sticky top-0 z-10 bg-surface-glass backdrop-blur-sm px-4 py-2 -mx-4 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {filledCount}/{TOTAL_FIELDS}
          </span>
        </div>
      </div>

      <div className="space-y-4 pb-24">
        {/* 그룹 1: 목표 & 유형 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-edge-faint">
          <Section title="식단 목표" description="어떤 목표로 식단을 관리하고 있나요?">
            <div className="flex flex-wrap gap-2">
              {DIETARY_GOALS.map((goal) => (
                <SelectOption<DietaryGoal>
                  key={goal}
                  value={goal}
                  label={DIETARY_GOAL_LABELS[goal]}
                  selected={formData.dietaryGoal === goal}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      dietaryGoal: prev.dietaryGoal === goal ? null : goal,
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-edge-divider" />

          <Section title="식단 유형" description="선호하는 식단 유형을 선택해 주세요.">
            <div className="flex flex-wrap gap-2">
              {DIET_TYPES.map((type) => (
                <SelectOption<DietType>
                  key={type}
                  value={type}
                  label={DIET_TYPE_LABELS[type]}
                  selected={formData.dietType === type}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      dietType: prev.dietType === type ? null : type,
                    }))
                  }
                />
              ))}
            </div>
          </Section>
        </div>

        {/* 그룹 2: 식사 횟수 & 예산 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-edge-faint">
          <Section title="하루 식사 횟수" description="하루에 몇 끼를 드시나요?">
            <div className="flex flex-wrap gap-2">
              {MEALS_PER_DAY_OPTIONS.map((count) => (
                <NumberOption
                  key={count}
                  value={count}
                  label={`${count}`}
                  variant="circle"
                  selected={formData.mealsPerDay === count}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      mealsPerDay: prev.mealsPerDay === count ? null : count,
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-edge-divider" />

          <Section title="월 식단 예산" description="PX, 외식 등을 포함한 월 식단 예산" optional>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={formData.budgetPerMonth ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    budgetPerMonth: e.target.value ? parseInt(e.target.value) : null,
                  }))
                }
                placeholder="예: 100000"
                className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-surface-muted border border-edge-faint text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/40 focus:border-primary/30 outline-none transition-all"
              />
              <span className="text-sm text-muted-foreground">원</span>
            </div>
          </Section>
        </div>

        {/* 그룹 3: 제한사항 & 출처 & 식습관 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-edge-faint">
          <Section
            title="음식 제한사항"
            description="알레르기나 먹지 않는 음식이 있다면 선택해 주세요."
          >
            <div className="flex flex-wrap gap-2">
              {FOOD_RESTRICTIONS.filter((r) => r !== 'none').map((restriction) => (
                <ChipOption
                  key={restriction}
                  label={FOOD_RESTRICTION_LABELS[restriction]}
                  selected={formData.foodRestrictions?.includes(restriction) ?? false}
                  onClick={() => toggleFoodRestriction(restriction)}
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-edge-divider" />

          <Section
            title="이용 가능한 식단 출처"
            description="주로 어디에서 식사를 하시나요?"
          >
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SOURCES.map((source) => (
                <ChipOption
                  key={source}
                  label={AVAILABLE_SOURCE_LABELS[source]}
                  selected={formData.availableSources?.includes(source) ?? false}
                  onClick={() => toggleAvailableSource(source)}
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-edge-divider" />

          <Section title="식습관" description="해당하는 식습관을 선택해 주세요.">
            <div className="flex flex-wrap gap-2">
              {EATING_HABITS.map((habit) => (
                <ChipOption
                  key={habit}
                  label={EATING_HABIT_LABELS[habit]}
                  selected={formData.eatingHabits?.includes(habit) ?? false}
                  onClick={() => toggleEatingHabit(habit)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* 그룹 4: 자유 입력 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-edge-faint">
          <Section title="식단 선호사항" description="식단에 대한 추가 요청사항을 입력해 주세요." optional>
            <TagInput
              value={formData.preferences ?? []}
              onChange={(preferences) =>
                setFormData((prev) => ({ ...prev, preferences }))
              }
              placeholder="예: 해산물 제외, 단백질 위주"
            />
          </Section>
        </div>

        {saveError && (
          <div className="p-4 rounded-xl bg-surface-danger text-destructive text-sm text-center">
            {saveError}
          </div>
        )}
      </div>

      <FloatingSaveButton
        visible={hasChanges}
        onSave={handleSave}
        isPending={updateProfile.isPending}
        showSuccess={showSuccess}
      />
    </>
  );
}
