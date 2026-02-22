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
import { useFitnessProfileSuspense, useUpdateFitnessProfile } from '@/hooks/fitnessProfile';
import {
  FocusArea,
  FITNESS_GOALS,
  EXPERIENCE_LEVELS,
  EQUIPMENT_ACCESS,
  FOCUS_AREAS,
  FITNESS_GOAL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EQUIPMENT_ACCESS_LABELS,
  FOCUS_AREA_LABELS,
  FitnessProfileUpdateData,
} from '@/lib/types/fitness';

function createFormData(
  profile: ReturnType<typeof useFitnessProfileSuspense>['data'],
): FitnessProfileUpdateData {
  return {
    fitnessGoal: profile.fitnessGoal ?? null,
    experienceLevel: profile.experienceLevel ?? null,
    preferredDaysPerWeek: profile.preferredDaysPerWeek ?? null,
    sessionDurationMinutes: profile.sessionDurationMinutes ?? null,
    equipmentAccess: profile.equipmentAccess ?? null,
    focusAreas: profile.focusAreas ?? [],
    injuries: profile.injuries ?? [],
    preferences: profile.preferences ?? [],
    restrictions: profile.restrictions ?? [],
  };
}

// 채워진 필드 수 계산
function countFilledFields(data: FitnessProfileUpdateData): number {
  let count = 0;
  if (data.fitnessGoal) count++;
  if (data.experienceLevel) count++;
  if (data.preferredDaysPerWeek) count++;
  if (data.sessionDurationMinutes) count++;
  if (data.equipmentAccess) count++;
  if (data.focusAreas && data.focusAreas.length > 0) count++;
  if (data.injuries && data.injuries.length > 0) count++;
  if (data.preferences && data.preferences.length > 0) count++;
  if (data.restrictions && data.restrictions.length > 0) count++;
  return count;
}

const TOTAL_FIELDS = 9;

export default function FitnessContent() {
  const router = useRouter();
  const { data: profile } = useFitnessProfileSuspense();
  const updateProfile = useUpdateFitnessProfile();

  const [formData, setFormData] = useState<FitnessProfileUpdateData>(() =>
    createFormData(profile),
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const hasChanges =
    formData.fitnessGoal !== (profile.fitnessGoal ?? null) ||
    formData.experienceLevel !== (profile.experienceLevel ?? null) ||
    formData.preferredDaysPerWeek !== (profile.preferredDaysPerWeek ?? null) ||
    formData.sessionDurationMinutes !== (profile.sessionDurationMinutes ?? null) ||
    formData.equipmentAccess !== (profile.equipmentAccess ?? null) ||
    JSON.stringify(formData.focusAreas) !== JSON.stringify(profile.focusAreas ?? []) ||
    JSON.stringify(formData.injuries) !== JSON.stringify(profile.injuries ?? []) ||
    JSON.stringify(formData.preferences) !== JSON.stringify(profile.preferences ?? []) ||
    JSON.stringify(formData.restrictions) !== JSON.stringify(profile.restrictions ?? []);

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

  const toggleFocusArea = (area: FocusArea) => {
    setFormData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas?.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...(prev.focusAreas ?? []), area],
    }));
  };

  return (
    <>
      {/* 프로그레스바 */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm px-4 py-2 -mx-4 mb-2">
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
        {/* 그룹 1: 목표 & 경험 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-border/30">
          <Section title="운동 목표" description="어떤 목표를 위해 운동하시나요?">
            <div className="flex flex-wrap gap-2">
              {FITNESS_GOALS.map((goal) => (
                <SelectOption
                  key={goal}
                  value={goal}
                  label={FITNESS_GOAL_LABELS[goal]}
                  selected={formData.fitnessGoal === goal}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      fitnessGoal: prev.fitnessGoal === goal ? null : goal,
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-border/20" />

          <Section title="운동 경험" description="현재 운동 수준은 어느 정도인가요?">
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((level) => (
                <SelectOption
                  key={level}
                  value={level}
                  label={EXPERIENCE_LEVEL_LABELS[level]}
                  selected={formData.experienceLevel === level}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      experienceLevel: prev.experienceLevel === level ? null : level,
                    }))
                  }
                />
              ))}
            </div>
          </Section>
        </div>

        {/* 그룹 2: 스케줄 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-border/30">
          <Section title="주당 운동 일수" description="일주일에 몇 번 운동하시나요?">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                <NumberOption
                  key={days}
                  value={days}
                  label={`${days}`}
                  variant="circle"
                  selected={formData.preferredDaysPerWeek === days}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      preferredDaysPerWeek:
                        prev.preferredDaysPerWeek === days ? null : days,
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-border/20" />

          <Section title="1회 운동 시간" description="한 번에 얼마나 운동하시나요?">
            <div className="flex gap-2">
              {[30, 45, 60, 90, 120].map((minutes) => (
                <NumberOption
                  key={minutes}
                  value={minutes}
                  label={`${minutes}분`}
                  variant="pill"
                  selected={formData.sessionDurationMinutes === minutes}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      sessionDurationMinutes:
                        prev.sessionDurationMinutes === minutes ? null : minutes,
                    }))
                  }
                />
              ))}
            </div>
          </Section>
        </div>

        {/* 그룹 3: 장비 & 집중 부위 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-border/30">
          <Section title="장비 접근성" description="어떤 장비를 사용할 수 있나요?">
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_ACCESS.map((access) => (
                <SelectOption
                  key={access}
                  value={access}
                  label={EQUIPMENT_ACCESS_LABELS[access]}
                  selected={formData.equipmentAccess === access}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      equipmentAccess: prev.equipmentAccess === access ? null : access,
                    }))
                  }
                />
              ))}
            </div>
          </Section>

          <div className="border-t border-border/20" />

          <Section
            title="집중 부위"
            description="발달시키고 싶은 부위를 선택해 주세요."
          >
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <ChipOption
                  key={area}
                  label={FOCUS_AREA_LABELS[area]}
                  selected={formData.focusAreas?.includes(area) ?? false}
                  onClick={() => toggleFocusArea(area)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* 그룹 4: 자유 입력 */}
        <div className="bg-card rounded-2xl p-4 space-y-5 border border-border/30">
          <Section
            title="부상 및 제한사항"
            description="주의가 필요한 부상이나 제한사항을 입력해 주세요."
            optional
          >
            <TagInput
              value={formData.injuries ?? []}
              onChange={(injuries) => setFormData((prev) => ({ ...prev, injuries }))}
              placeholder="예: 허리 통증, 무릎 부상"
            />
          </Section>

          <div className="border-t border-border/20" />

          <Section title="선호 운동" description="좋아하는 운동을 입력해 주세요." optional>
            <TagInput
              value={formData.preferences ?? []}
              onChange={(preferences) =>
                setFormData((prev) => ({ ...prev, preferences }))
              }
              placeholder="예: 벤치프레스, 러닝"
            />
          </Section>

          <div className="border-t border-border/20" />

          <Section
            title="피하고 싶은 운동"
            description="피하고 싶은 운동이 있다면 입력해 주세요."
            optional
          >
            <TagInput
              value={formData.restrictions ?? []}
              onChange={(restrictions) =>
                setFormData((prev) => ({ ...prev, restrictions }))
              }
              placeholder="예: 점프, 스쿼트"
            />
          </Section>
        </div>

        {saveError && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
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
