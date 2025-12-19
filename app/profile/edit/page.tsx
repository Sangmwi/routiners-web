'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserProfile, useUpdateProfile, useProfileProgress } from '@/lib/hooks/useProfile';
import { ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ProfilePhotoGallery from '@/components/profile/edit/ProfilePhotoGallery';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileHeightWeightInput from '@/components/profile/edit/ProfileHeightWeightInput';
import ProfileInbodyInput from '@/components/profile/edit/ProfileInbodyInput';
import ProfileSmokingInput from '@/components/profile/edit/ProfileSmokingInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUserProfile();
  const updateProfile = useUpdateProfile();

  // Form state - 모든 입력 필드를 한 곳에서 관리
  const [formData, setFormData] = useState({
    nickname: '',
    bio: '',
    height: '',
    weight: '',
    muscleMass: '',
    bodyFatPercentage: '',
    showInbodyPublic: true,
    isSmoker: undefined as boolean | undefined,
    interestedLocations: [] as string[],
    interestedExercises: [] as string[],
  });

  // Photo state - now managed by ProfilePhotoGallery component
  const [profileImages, setProfileImages] = useState<string[]>([]);

  // User 데이터가 로드되면 form 초기화
  useEffect(() => {
    if (user) {
      setFormData({
        nickname: user.nickname || '',
        bio: user.bio || '',
        height: user.height?.toString() || '',
        weight: user.weight?.toString() || '',
        muscleMass: user.muscleMass?.toString() || '',
        bodyFatPercentage: user.bodyFatPercentage?.toString() || '',
        showInbodyPublic: user.showInbodyPublic ?? true,
        isSmoker: user.isSmoker,
        interestedLocations: user.interestedLocations || [],
        interestedExercises: user.interestedExercises || [],
      });
      setProfileImages(user.profileImages || []);
    }
  }, [user]);

  // 프로필 완성도 계산
  const progress = useProfileProgress(user);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    if (!user) return;

    // Build update object (photos are now saved immediately via ProfilePhotoGallery)
    const updates: Record<string, unknown> = {
      nickname: formData.nickname.trim() || undefined,
      bio: formData.bio.trim() || undefined,
      height: formData.height ? Number(formData.height) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      muscleMass: formData.muscleMass ? Number(formData.muscleMass) : undefined,
      bodyFatPercentage: formData.bodyFatPercentage ? Number(formData.bodyFatPercentage) : undefined,
      showInbodyPublic: formData.showInbodyPublic,
      isSmoker: formData.isSmoker,
      interestedLocations: formData.interestedLocations,
      interestedExercises: formData.interestedExercises,
    };

    // Mutation 실행
    updateProfile.mutate(updates, {
      onSuccess: () => {
        router.push('/profile');
      },
      onError: (err: Error) => {
        console.error('Failed to update profile:', err);
        alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
        <div className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">프로필을 불러올 수 없습니다</p>
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-6 h-6 text-card-foreground" />
          </button>
          <h1 className="text-base font-bold text-card-foreground">프로필 만들기</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="px-5 py-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">프로필 완성도: {progress}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pb-32 space-y-8">
        {/* Profile Photo Gallery */}
        <ProfilePhotoGallery
          user={user}
          onImagesChange={setProfileImages}
        />

        {/* Nickname Input */}
        <ProfileNicknameInput
          value={formData.nickname}
          onChange={(value) => setFormData({ ...formData, nickname: value })}
        />

        {/* Bio Input */}
        <ProfileBioInput
          value={formData.bio}
          onChange={(value) => setFormData({ ...formData, bio: value })}
        />

        {/* Height & Weight Input */}
        <ProfileHeightWeightInput
          height={formData.height}
          weight={formData.weight}
          onHeightChange={(value) => setFormData({ ...formData, height: value })}
          onWeightChange={(value) => setFormData({ ...formData, weight: value })}
        />

        {/* Inbody Input */}
        <ProfileInbodyInput
          muscleMass={formData.muscleMass}
          bodyFatPercentage={formData.bodyFatPercentage}
          showInbodyPublic={formData.showInbodyPublic}
          onMuscleMassChange={(value) => setFormData({ ...formData, muscleMass: value })}
          onBodyFatPercentageChange={(value) => setFormData({ ...formData, bodyFatPercentage: value })}
          onShowInbodyPublicChange={(value) => setFormData({ ...formData, showInbodyPublic: value })}
        />

        {/* Smoking Input */}
        <ProfileSmokingInput
          value={formData.isSmoker}
          onChange={(value) => setFormData({ ...formData, isSmoker: value })}
        />

        {/* Favorite Locations Input */}
        <ProfileLocationsInput
          value={formData.interestedLocations}
          onChange={(value) => setFormData({ ...formData, interestedLocations: value })}
        />

        {/* Interests Input */}
        <ProfileInterestsInput
          value={formData.interestedExercises}
          onChange={(value) => setFormData({ ...formData, interestedExercises: value })}
        />
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border/50">
        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {updateProfile.isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
