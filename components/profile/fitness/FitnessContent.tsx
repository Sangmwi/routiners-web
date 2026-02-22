'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ProfileFormChipOption as ChipOption,
  ProfileFormSection as Section,
  ProfileFormSelectOption as SelectOption,
  ProfileFormTagInput as TagInput,
} from '@/components/profile/form/ProfileFormPrimitives';
import { LoadingSpinner } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
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

export default function FitnessContent() {
  const router = useRouter();
  const { data: profile } = useFitnessProfileSuspense();
  const updateProfile = useUpdateFitnessProfile();

  const [formData, setFormData] = useState<FitnessProfileUpdateData>(() =>
    createFormData(profile),
  );
  const [saveError, setSaveError] = useState<string | null>(null);

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

  const handleSave = () => {
    setSaveError(null);

    updateProfile.mutate(formData, {
      onSuccess: () => router.back(),
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
      <div className="space-y-6">
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

        <Section title="주당 운동 일수" description="일주일에 몇 번 운동하시나요?">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <SelectOption
                key={days}
                value={days.toString()}
                label={`${days}일`}
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

        <Section title="1회 운동 시간" description="한 번에 얼마나 운동하시나요?">
          <div className="flex flex-wrap gap-2">
            {[30, 45, 60, 90, 120].map((minutes) => (
              <SelectOption
                key={minutes}
                value={minutes.toString()}
                label={`${minutes}분`}
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

        <Section
          title="부상 및 제한사항"
          description="주의가 필요한 부상이나 제한사항을 입력해 주세요."
        >
          <TagInput
            value={formData.injuries ?? []}
            onChange={(injuries) => setFormData((prev) => ({ ...prev, injuries }))}
            placeholder="예: 허리 통증, 무릎 부상"
          />
        </Section>

        <Section title="선호 운동" description="좋아하는 운동을 입력해 주세요.">
          <TagInput
            value={formData.preferences ?? []}
            onChange={(preferences) =>
              setFormData((prev) => ({ ...prev, preferences }))
            }
            placeholder="예: 벤치프레스, 러닝"
          />
        </Section>

        <Section
          title="피하고 싶은 운동"
          description="피하고 싶은 운동이 있다면 입력해 주세요."
        >
          <TagInput
            value={formData.restrictions ?? []}
            onChange={(restrictions) =>
              setFormData((prev) => ({ ...prev, restrictions }))
            }
            placeholder="예: 점프, 스쿼트"
          />
        </Section>

        {saveError && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {saveError}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background border-t border-border/50">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={updateProfile.isPending || !hasChanges}
        >
          {updateProfile.isPending ? (
            <>
              <LoadingSpinner size="sm" variant="current" className="mr-2" />
              저장 중...
            </>
          ) : (
            '저장하기'
          )}
        </Button>
      </div>
    </>
  );
}
