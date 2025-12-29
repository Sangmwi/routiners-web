'use client';

import { useRouter } from 'next/navigation';
import { useProfileProgress, useProfileEdit } from '@/hooks';
import { Loader2 } from 'lucide-react';
import { PageSkeleton } from '@/components/ui/Skeleton';
import PageHeader from '@/components/common/PageHeader';
import ProfilePhotoGallery from '@/components/profile/edit/ProfilePhotoGallery';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileHeightWeightInput from '@/components/profile/edit/ProfileHeightWeightInput';
import ProfileInbodyInput from '@/components/profile/edit/ProfileInbodyInput';
import ProfileSmokingInput from '@/components/profile/edit/ProfileSmokingInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';

// ============================================================
// Sub Components
// ============================================================

function LoadingState() {
  return <PageSkeleton />;
}

function ErrorState() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          프로필을 불러올 수 없습니다
        </p>
        <button
          onClick={() => router.push('/login')}
          className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          로그인하기
        </button>
      </div>
    </div>
  );
}

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="px-4 py-4">
      <div className="space-y-2">
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
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border/50">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
        {isSaving ? '저장 중...' : '저장하기'}
      </button>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProfileEditPage() {
  const {
    user,
    isLoading,
    error,
    formData,
    updateFormField,
    handleDraftChange,
    handleSave,
    handleBack,
    isSaving,
  } = useProfileEdit();

  const progress = useProfileProgress(user);

  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Error state
  if (error || !user) {
    return <ErrorState />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="프로필 만들기" centered onBack={handleBack} />
      <ProgressBar progress={progress} />

      {/* Content */}
      <div className="px-4 pb-32 space-y-8">
        <ProfilePhotoGallery
          initialImages={user.profileImages || []}
          isSaving={isSaving}
          onDraftChange={handleDraftChange}
        />

        <ProfileNicknameInput
          value={formData.nickname}
          onChange={(value) => updateFormField('nickname', value)}
        />

        <ProfileBioInput
          value={formData.bio}
          onChange={(value) => updateFormField('bio', value)}
        />

        <ProfileHeightWeightInput
          height={formData.height}
          weight={formData.weight}
          onHeightChange={(value) => updateFormField('height', value)}
          onWeightChange={(value) => updateFormField('weight', value)}
        />

        <ProfileInbodyInput
          showInbodyPublic={formData.showInbodyPublic}
          onShowInbodyPublicChange={(value) => updateFormField('showInbodyPublic', value)}
        />

        <ProfileSmokingInput
          value={formData.isSmoker}
          onChange={(value) => updateFormField('isSmoker', value)}
        />

        <ProfileLocationsInput
          value={formData.interestedLocations}
          onChange={(value) => updateFormField('interestedLocations', value)}
        />

        <ProfileInterestsInput
          value={formData.interestedExercises}
          onChange={(value) => updateFormField('interestedExercises', value)}
        />
      </div>

      <SaveButton
        onClick={handleSave}
        disabled={isSaving}
        isSaving={isSaving}
      />
    </div>
  );
}
