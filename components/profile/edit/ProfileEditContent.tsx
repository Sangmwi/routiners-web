'use client';

import { useRouter } from 'next/navigation';
import { CaretRightIcon } from '@phosphor-icons/react';
import ProfilePhotoEdit from '@/components/profile/edit/ProfilePhotoEdit';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileBodyInfoInput from '@/components/profile/edit/ProfileBodyInfoInput';
import ProfileRankInput from '@/components/profile/edit/ProfileRankInput';
import ProfileUnitInput from '@/components/profile/edit/ProfileUnitInput';
import ProfileSpecialtyInput from '@/components/profile/edit/ProfileSpecialtyInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import FloatingSaveButton from '@/components/ui/FloatingSaveButton';
import { useProfileEditSuspense } from '@/hooks/profile';
import { useFitnessProfile } from '@/hooks/fitnessProfile';
import { useDietaryProfile } from '@/hooks/dietaryProfile';
import { hasFitnessProfileData } from '@/hooks/fitnessProfile';
import { hasDietaryProfileData } from '@/hooks/dietaryProfile';
import { FITNESS_GOAL_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/lib/types/fitness';
import { DIETARY_GOAL_LABELS, DIET_TYPE_LABELS } from '@/lib/types/meal';
import type { Rank, Specialty } from '@/lib/types';

// ============================================================
// Sub Components
// ============================================================

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      <div className="bg-card rounded-2xl border border-border/30 p-4 space-y-4">
        {children}
      </div>
    </div>
  );
}

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
    <div className="space-y-3">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider px-1">
        {title}
      </h3>
      <button
        onClick={() => router.push(href)}
        className="w-full bg-card rounded-2xl border border-border/30 p-4 flex items-center gap-3 text-left hover:bg-muted/20 transition-colors"
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

// ============================================================
// Main Content Component
// ============================================================

export default function ProfileEditContent() {
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
        {/* 프로필 사진 */}
        <ProfilePhotoEdit
          initialImage={user.profilePhotoUrl}
          isSaving={isSaving}
          onDraftChange={handleDraftChange}
        />

        {/* 기본 정보 */}
        <SectionCard title="기본 정보">
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
        </SectionCard>

        {/* 신체 정보 */}
        <SectionCard title="신체 정보">
          <ProfileBodyInfoInput
            height={formData.height}
            weight={formData.weight}
            isSmoker={formData.isSmoker}
            onHeightChange={(value: string) => updateFormField('height', value)}
            onWeightChange={(value: string) => updateFormField('weight', value)}
            onSmokerChange={(value: boolean) => updateFormField('isSmoker', value)}
          />
        </SectionCard>

        {/* 군 정보 */}
        <SectionCard title="군 정보">
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
        </SectionCard>

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

        {/* 관심 종목 */}
        <SectionCard title="관심 종목">
          <ProfileInterestsInput
            value={formData.interestedExercises}
            onChange={(value: string[]) => updateFormField('interestedExercises', value)}
          />
        </SectionCard>

        {/* 자주 가는 장소 */}
        <SectionCard title="자주 가는 장소">
          <ProfileLocationsInput
            value={formData.interestedLocations}
            onChange={(value: string[]) => updateFormField('interestedLocations', value)}
          />
        </SectionCard>

        {/* 공개 설정 */}
        <SectionCard title="공개 설정">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">인바디 정보 공개</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                다른 사용자에게 인바디 정보를 공개합니다
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateFormField('showInbodyPublic', !formData.showInbodyPublic)}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
                formData.showInbodyPublic ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  formData.showInbodyPublic ? 'translate-x-[22px]' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </SectionCard>
      </div>

      <FloatingSaveButton
        visible={hasChanges}
        onSave={handleSave}
        isPending={isSaving}
      />
    </>
  );
}
