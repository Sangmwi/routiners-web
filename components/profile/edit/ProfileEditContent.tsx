'use client';

import { LoadingSpinner } from '@/components/ui/icons';
import ProfilePhotoGallery from '@/components/profile/edit/ProfilePhotoGallery';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileBodyInfoInput from '@/components/profile/edit/ProfileBodyInfoInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import { useProfileEditSuspense, useProfileProgress } from '@/hooks/profile';

// ============================================================
// Sub Components
// ============================================================

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="space-y-2 mb-6">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          프로필 완성도: {progress}%
        </span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

interface SaveButtonProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
}

function SaveButton({ onClick, disabled, isSaving }: SaveButtonProps) {
  return (
    <div className="fixed left-0 right-0 bottom-0 p-4 bg-background border-t border-border/50 pb-safe">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving && <LoadingSpinner size="sm" variant="current" />}
        {isSaving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

// ============================================================
// Main Content Component
// ============================================================

/**
 * 프로필 수정 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 프로필 데이터 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
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

  const progress = useProfileProgress(user);

  return (
    <>
      <ProgressBar progress={progress} />

      {/* Content */}
      <div className="space-y-10">
        <ProfilePhotoGallery
          initialImages={user.profileImages || []}
          isSaving={isSaving}
          onDraftChange={handleDraftChange}
        />

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

        <ProfileBodyInfoInput
          height={formData.height}
          weight={formData.weight}
          isSmoker={formData.isSmoker}
          onHeightChange={(value: string) => updateFormField('height', value)}
          onWeightChange={(value: string) => updateFormField('weight', value)}
          onSmokerChange={(value: boolean) => updateFormField('isSmoker', value)}
        />

        <ProfileInterestsInput
          value={formData.interestedExercises}
          onChange={(value: string[]) => updateFormField('interestedExercises', value)}
        />

        <ProfileLocationsInput
          value={formData.interestedLocations}
          onChange={(value: string[]) => updateFormField('interestedLocations', value)}
        />
      </div>

      <SaveButton
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        isSaving={isSaving}
      />
    </>
  );
}
