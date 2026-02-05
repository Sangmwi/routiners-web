'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SpinnerGapIcon, CheckIcon } from '@phosphor-icons/react';
import Button from '@/components/ui/Button';
import { useFitnessProfileSuspense, useUpdateFitnessProfile } from '@/hooks/fitnessProfile';
import {
  FitnessGoal,
  ExperienceLevel,
  EquipmentAccess,
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

// ============================================================
// Sub Components
// ============================================================

interface SelectOptionProps<T extends string> {
  value: T;
  label: string;
  selected: boolean;
  onClick: () => void;
}

function SelectOption<T extends string>({
  label,
  selected,
  onClick,
}: SelectOptionProps<T>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
        selected
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {label}
    </button>
  );
}

interface ChipOptionProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function ChipOption({ label, selected, onClick }: ChipOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm transition-all ${
        selected
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      }`}
    >
      {selected && <CheckIcon size={12} />}
      {label}
    </button>
  );
}

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

function Section({ title, description, children }: SectionProps) {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

interface TagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

function TagInput({ value, onChange, placeholder }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-muted border-none text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 outline-none"
      />
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-sm text-foreground"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Main Content Component
// ============================================================

/**
 * 운동 프로필 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 운동 프로필 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function FitnessContent() {
  const router = useRouter();
  const { data: profile } = useFitnessProfileSuspense();
  const updateProfile = useUpdateFitnessProfile();

  // Form state
  const [formData, setFormData] = useState<FitnessProfileUpdateData>({
    fitnessGoal: null,
    experienceLevel: null,
    preferredDaysPerWeek: null,
    sessionDurationMinutes: null,
    equipmentAccess: null,
    focusAreas: [],
    injuries: [],
    preferences: [],
    restrictions: [],
  });

  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // 프로필 데이터로 폼 초기화
  useEffect(() => {
    if (profile) {
      setFormData({
        fitnessGoal: profile.fitnessGoal ?? null,
        experienceLevel: profile.experienceLevel ?? null,
        preferredDaysPerWeek: profile.preferredDaysPerWeek ?? null,
        sessionDurationMinutes: profile.sessionDurationMinutes ?? null,
        equipmentAccess: profile.equipmentAccess ?? null,
        focusAreas: profile.focusAreas ?? [],
        injuries: profile.injuries ?? [],
        preferences: profile.preferences ?? [],
        restrictions: profile.restrictions ?? [],
      });
    }
  }, [profile]);

  // 변경 감지
  useEffect(() => {
    if (!profile) return;

    const changed =
      formData.fitnessGoal !== (profile.fitnessGoal ?? null) ||
      formData.experienceLevel !== (profile.experienceLevel ?? null) ||
      formData.preferredDaysPerWeek !== (profile.preferredDaysPerWeek ?? null) ||
      formData.sessionDurationMinutes !== (profile.sessionDurationMinutes ?? null) ||
      formData.equipmentAccess !== (profile.equipmentAccess ?? null) ||
      JSON.stringify(formData.focusAreas) !== JSON.stringify(profile.focusAreas ?? []) ||
      JSON.stringify(formData.injuries) !== JSON.stringify(profile.injuries ?? []) ||
      JSON.stringify(formData.preferences) !== JSON.stringify(profile.preferences ?? []) ||
      JSON.stringify(formData.restrictions) !== JSON.stringify(profile.restrictions ?? []);

    setHasChanges(changed);
  }, [formData, profile]);

  // Handlers
  const handleSave = () => {
    setSaveError(null);

    updateProfile.mutate(formData, {
      onSuccess: () => router.back(),
      onError: () => setSaveError('저장에 실패했습니다.'),
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
        {/* 운동 목표 */}
        <Section title="운동 목표" description="어떤 목표를 향해 운동하시나요?">
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

        {/* 운동 경험 */}
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

        {/* 주당 운동 횟수 */}
        <Section title="주당 운동 횟수" description="일주일에 몇 번 운동하시나요?">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((days) => (
              <SelectOption
                key={days}
                value={days.toString()}
                label={`${days}회`}
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

        {/* 운동 시간 */}
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

        {/* 장비 접근성 */}
        <Section title="장비 접근성" description="어떤 장비를 이용할 수 있나요?">
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

        {/* 집중 부위 */}
        <Section
          title="집중 부위"
          description="특별히 발달시키고 싶은 부위를 선택하세요"
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

        {/* 부상/제한사항 */}
        <Section
          title="부상/제한사항"
          description="주의가 필요한 부상이나 제한사항을 입력하세요"
        >
          <TagInput
            value={formData.injuries ?? []}
            onChange={(injuries) => setFormData((prev) => ({ ...prev, injuries }))}
            placeholder="예: 허리 디스크, 무릎 통증 (Enter로 추가)"
          />
        </Section>

        {/* 선호 운동 */}
        <Section title="선호 운동" description="좋아하는 운동을 입력하세요">
          <TagInput
            value={formData.preferences ?? []}
            onChange={(preferences) =>
              setFormData((prev) => ({ ...prev, preferences }))
            }
            placeholder="예: 벤치프레스, 스쿼트 (Enter로 추가)"
          />
        </Section>

        {/* 운동 제한 */}
        <Section
          title="피하고 싶은 운동"
          description="피하고 싶은 운동이 있다면 입력하세요"
        >
          <TagInput
            value={formData.restrictions ?? []}
            onChange={(restrictions) =>
              setFormData((prev) => ({ ...prev, restrictions }))
            }
            placeholder="예: 런지, 풀업 (Enter로 추가)"
          />
        </Section>

        {/* 에러 메시지 */}
        {saveError && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {saveError}
          </div>
        )}
      </div>

      {/* 저장 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-background border-t border-border/50">
        <Button
          onClick={handleSave}
          className="w-full"
          disabled={updateProfile.isPending || !hasChanges}
        >
          {updateProfile.isPending ? (
            <>
              <SpinnerGapIcon size={16} className="mr-2 animate-spin" />
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
