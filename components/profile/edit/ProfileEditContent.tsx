'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CaretRightIcon } from '@phosphor-icons/react';
import ProfilePhotoEdit from '@/components/profile/edit/ProfilePhotoEdit';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileBodyInfoInput from '@/components/profile/edit/ProfileBodyInfoInput';
import ProfileInbodyInput from '@/components/profile/edit/ProfileInbodyInput';
import ProfileRankInput from '@/components/profile/edit/ProfileRankInput';
import ProfileUnitInput from '@/components/profile/edit/ProfileUnitInput';
import ProfileSpecialtyInput from '@/components/profile/edit/ProfileSpecialtyInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import ProfileEditTabBar, { type EditTab } from '@/components/profile/edit/ProfileEditTabBar';
import FloatingSaveButton from '@/components/ui/FloatingSaveButton';
import { useProfileEditSuspense } from '@/hooks/profile';
import { useFitnessProfile, hasFitnessProfileData } from '@/hooks/fitnessProfile';
import { useDietaryProfile, hasDietaryProfileData } from '@/hooks/dietaryProfile';
import { FITNESS_GOAL_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/lib/types/fitness';
import { DIETARY_GOAL_LABELS, DIET_TYPE_LABELS } from '@/lib/types/meal';
import type { Rank, Specialty } from '@/lib/types';

// ============================================================
// Sub Components
// ============================================================

function LinkedSectionCard({
  title,
  summary,
  emptyText,
  href,
}: {
  title: string;
  summary: string | null;
  emptyText: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground block">{title}</label>
      <button
        onClick={() => router.push(href)}
        className="w-full rounded-xl border border-edge-subtle px-4 py-3 flex items-center gap-3 text-left hover:bg-surface-secondary transition-colors"
      >
        <div className="flex-1 min-w-0">
          {summary ? (
            <p className="text-sm text-foreground line-clamp-2">{summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{emptyText}</p>
          )}
        </div>
        <CaretRightIcon size={16} className="text-muted-foreground/50 flex-shrink-0" />
      </button>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-7">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${value ? 'bg-primary' : 'bg-muted'
          }`}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
        />
      </button>
    </div>
  );
}

// ============================================================
// Main Content Component
// ============================================================

const EDIT_TABS: EditTab[] = ['basic', 'details', 'military'];

export default function ProfileEditContent() {
  const [activeTab, setActiveTab] = useState<EditTab>('basic');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const prevTab = useRef<EditTab>('basic');

  useEffect(() => {
    if (prevTab.current !== activeTab) {
      const prevIdx = EDIT_TABS.indexOf(prevTab.current);
      const nextIdx = EDIT_TABS.indexOf(activeTab);
      setDirection(nextIdx > prevIdx ? 'right' : 'left');
      prevTab.current = activeTab;
    }
  }, [activeTab]);

  const {
    user,
    formData,
    updateFormField,
    handleDraftChange,
    handleSave,
    isSaving,
    hasChanges,
  } = useProfileEditSuspense();

  // Fitness & Dietary summaries (non-blocking)
  const { data: fitnessProfile } = useFitnessProfile();
  const { data: dietaryProfile } = useDietaryProfile();

  const fitnessSummary = hasFitnessProfileData(fitnessProfile)
    ? [
      fitnessProfile?.fitnessGoal && FITNESS_GOAL_LABELS[fitnessProfile.fitnessGoal],
      fitnessProfile?.experienceLevel && EXPERIENCE_LEVEL_LABELS[fitnessProfile.experienceLevel],
      fitnessProfile?.preferredDaysPerWeek && `주 ${fitnessProfile.preferredDaysPerWeek}일`,
    ].filter(Boolean).join(' · ')
    : null;

  const dietarySummary = hasDietaryProfileData(dietaryProfile)
    ? [
      dietaryProfile?.dietaryGoal && DIETARY_GOAL_LABELS[dietaryProfile.dietaryGoal],
      dietaryProfile?.dietType && DIET_TYPE_LABELS[dietaryProfile.dietType],
      dietaryProfile?.targetCalories && `${dietaryProfile.targetCalories}kcal`,
    ].filter(Boolean).join(' · ')
    : null;

  return (
    <>
      <div className="space-y-6 pb-24">
        {/* 프로필 사진 (탭 위에 항상 표시) */}
        <ProfilePhotoEdit
          initialImage={user.profilePhotoUrl}
          isSaving={isSaving}
          onDraftChange={handleDraftChange}
        />

        {/* 탭바 */}
        <ProfileEditTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* 탭 콘텐츠 */}
        <div className="overflow-hidden">
          <div
            key={activeTab}
            className="animate-tab-slide"
            style={{
              '--slide-from': direction === 'right' ? '30px' : '-30px',
            } as React.CSSProperties}
          >
            {/* === 기본 탭 === */}
            {activeTab === 'basic' && (
              <div className="space-y-6">
                <ProfileNicknameInput
                  value={formData.nickname}
                  originalNickname={user.nickname}
                  userId={user.id}
                  onChange={(value) => updateFormField('nickname', value)}
                />
                <ProfileBioInput
                  value={formData.bio}
                  onChange={(value) => updateFormField('bio', value)}
                />

                {/* 공개 설정 */}
                <div className="space-y-3 pt-4 border-t border-edge-faint">
                  <ToggleRow
                    label="활동 공개"
                    description="게시글과 활동 기록을 다른 사용자에게 공개해요"
                    value={formData.showActivityPublic}
                    onChange={(v) => updateFormField('showActivityPublic', v)}
                  />
                  <ToggleRow
                    label="정보 공개"
                    description="신체 정보, 운동/식단 프로필 등을 다른 사용자에게 공개해요"
                    value={formData.showInfoPublic}
                    onChange={(v) => updateFormField('showInfoPublic', v)}
                  />
                </div>
              </div>
            )}

            {/* === 상세 탭 === */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* 신체 정보 */}
                <div className="space-y-2">
                  <ProfileBodyInfoInput
                    height={formData.height}
                    weight={formData.weight}
                    isSmoker={formData.isSmoker}
                    onHeightChange={(value: string) => updateFormField('height', value)}
                    onWeightChange={(value: string) => updateFormField('weight', value)}
                    onSmokerChange={(value: boolean) => updateFormField('isSmoker', value)}
                  />
                </div>

                {/* 관심 종목 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block">관심 종목</label>
                  <ProfileInterestsInput
                    value={formData.interestedExercises}
                    onChange={(value: string[]) => updateFormField('interestedExercises', value)}
                  />
                </div>

                {/* 자주 가는 장소 */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground block">자주 가는 장소</label>
                  <ProfileLocationsInput
                    value={formData.interestedLocations}
                    onChange={(value: string[]) => updateFormField('interestedLocations', value)}
                  />
                </div>

                {/* 운동 프로필 (링크) */}
                <LinkedSectionCard
                  title="운동 프로필"
                  summary={fitnessSummary}
                  emptyText="운동 목표와 경험을 설정해 보세요"
                  href="/profile/fitness"
                />

                {/* 식단 프로필 (링크) */}
                <LinkedSectionCard
                  title="식단 프로필"
                  summary={dietarySummary}
                  emptyText="식단 목표와 유형을 설정해 보세요"
                  href="/profile/dietary"
                />

                {/* 인바디 정보 (요약 + 관리) */}
                <ProfileInbodyInput />
              </div>
            )}

            {/* === 군 정보 탭 === */}
            {activeTab === 'military' && (
              <div className="space-y-6">
                <ProfileRankInput
                  value={formData.rank}
                  onChange={(value: Rank) => updateFormField('rank', value)}
                />
                <ProfileUnitInput
                  value={formData.unitName}
                  onChange={(value: string) => updateFormField('unitName', value)}
                />
                <ProfileSpecialtyInput
                  value={formData.specialty}
                  onChange={(value: Specialty) => updateFormField('specialty', value)}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <FloatingSaveButton
        visible={hasChanges}
        onSave={handleSave}
        isPending={isSaving}
      />
    </>
  );
}
