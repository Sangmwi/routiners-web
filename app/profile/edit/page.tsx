'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/lib/hooks/useAuth';
import { ArrowLeft } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ProfilePhotoUploadSection from '@/components/profile/edit/ProfilePhotoUploadSection';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileDetailsSection from '@/components/profile/edit/ProfileDetailsSection';
import ProfileInbodyInput from '@/components/profile/edit/ProfileInbodyInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUser();
  const [progress, setProgress] = useState(45);

  const handleBack = () => {
    router.back();
  };

  const handleSave = async () => {
    // TODO: Implement save functionality
    console.log('Save profile');
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
        {/* Profile Photo Upload */}
        <ProfilePhotoUploadSection user={user} />

        {/* Bio Input */}
        <ProfileBioInput defaultValue={user.bio} />

        {/* My Details */}
        <ProfileDetailsSection user={user} />

        {/* Inbody Input */}
        <ProfileInbodyInput
          defaultMuscleMass={user.muscleMass}
          defaultBodyFatPercentage={user.bodyFatPercentage}
          defaultShowInbodyPublic={user.showInbodyPublic}
        />

        {/* Favorite Locations Input */}
        <ProfileLocationsInput defaultLocations={user.interestedLocations} />

        {/* Interests Input */}
        <ProfileInterestsInput defaultInterests={user.interestedExercises} />
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border/50">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          저장하기
        </button>
      </div>
    </div>
  );
}
