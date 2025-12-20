'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserProfile, useUpdateProfile, useProfileProgress } from '@/lib/hooks/useProfile';
import { useProfileImagesDraft } from '@/lib/hooks';
import { ArrowLeft, Loader2 } from 'lucide-react';
import ProfilePhotoGallery from '@/components/profile/edit/ProfilePhotoGallery';
import ProfileNicknameInput from '@/components/profile/edit/ProfileNicknameInput';
import ProfileBioInput from '@/components/profile/edit/ProfileBioInput';
import ProfileHeightWeightInput from '@/components/profile/edit/ProfileHeightWeightInput';
import ProfileInbodyInput from '@/components/profile/edit/ProfileInbodyInput';
import ProfileSmokingInput from '@/components/profile/edit/ProfileSmokingInput';
import ProfileLocationsInput from '@/components/profile/edit/ProfileLocationsInput';
import ProfileInterestsInput from '@/components/profile/edit/ProfileInterestsInput';

// ============================================================
// Types
// ============================================================

interface FormData {
  nickname: string;
  bio: string;
  height: string;
  weight: string;
  muscleMass: string;
  bodyFatPercentage: string;
  showInbodyPublic: boolean;
  isSmoker: boolean | undefined;
  interestedLocations: string[];
  interestedExercises: string[];
}

const initialFormData: FormData = {
  nickname: '',
  bio: '',
  height: '',
  weight: '',
  muscleMass: '',
  bodyFatPercentage: '',
  showInbodyPublic: true,
  isSmoker: undefined,
  interestedLocations: [],
  interestedExercises: [],
};

// ============================================================
// API Functions
// ============================================================

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('/api/upload/profile-image', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Upload failed');
  }

  const data = await response.json();
  return data.url;
}

async function deleteImage(imageUrl: string): Promise<void> {
  await fetch('/api/user/profile/image', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ imageUrl }),
  });
}

// ============================================================
// Main Component
// ============================================================

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUserProfile();
  const updateProfile = useUpdateProfile();

  // Form state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Image draft ref (받은 draft를 저장)
  const imageDraftRef = useRef<ReturnType<typeof useProfileImagesDraft> | null>(null);

  // User 데이터 로드 시 form 초기화
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
    }
  }, [user]);

  // 프로필 완성도
  const progress = useProfileProgress(user);

  // Draft 변경 핸들러
  const handleDraftChange = useCallback(
    (draft: ReturnType<typeof useProfileImagesDraft>) => {
      imageDraftRef.current = draft;
    },
    []
  );

  // 뒤로가기
  const handleBack = useCallback(() => {
    const hasImageChanges = imageDraftRef.current?.hasChanges;
    if (hasImageChanges) {
      if (confirm('저장하지 않은 변경사항이 있습니다. 정말 나가시겠습니까?')) {
        router.back();
      }
    } else {
      router.back();
    }
  }, [router]);

  // 저장하기
  const handleSave = useCallback(async () => {
    if (!user) return;

    setIsSaving(true);

    try {
      const draft = imageDraftRef.current;
      let finalImageUrls: string[] = [];

      if (draft) {
        const changes = draft.getChanges();

        // 1. 새 이미지들 업로드
        const uploadedUrls = new Map<string, string>();
        for (const { file, id } of changes.newImages) {
          try {
            const url = await uploadImage(file);
            uploadedUrls.set(id, url);
          } catch (err) {
            console.error('Image upload failed:', err);
            throw new Error('이미지 업로드에 실패했습니다.');
          }
        }

        // 2. 최종 이미지 URL 배열 생성
        finalImageUrls = changes.finalOrder.map((img) => {
          if (img.isNew && uploadedUrls.has(img.id)) {
            return uploadedUrls.get(img.id)!;
          }
          return img.originalUrl || img.displayUrl;
        });

        // 3. 삭제할 이미지들 처리 (백그라운드)
        for (const url of changes.deletedUrls) {
          deleteImage(url).catch(console.error);
        }
      }

      // 4. 프로필 업데이트
      const updates: Record<string, unknown> = {
        nickname: formData.nickname.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        height: formData.height ? Number(formData.height) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        muscleMass: formData.muscleMass ? Number(formData.muscleMass) : undefined,
        bodyFatPercentage: formData.bodyFatPercentage
          ? Number(formData.bodyFatPercentage)
          : undefined,
        showInbodyPublic: formData.showInbodyPublic,
        isSmoker: formData.isSmoker,
        interestedLocations: formData.interestedLocations,
        interestedExercises: formData.interestedExercises,
        profileImages: finalImageUrls,
      };

      updateProfile.mutate(updates, {
        onSuccess: () => {
          router.push('/profile');
        },
        onError: (err: Error) => {
          console.error('Failed to update profile:', err);
          alert('프로필 저장에 실패했습니다. 다시 시도해주세요.');
          setIsSaving(false);
        },
      });
    } catch (err) {
      console.error('Save failed:', err);
      alert(err instanceof Error ? err.message : '저장에 실패했습니다.');
      setIsSaving(false);
    }
  }, [user, formData, updateProfile, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-background">
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

  const isPending = isSaving || updateProfile.isPending;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background border-b border-border/50">
        <div className="flex items-center justify-between px-5 py-4">
          <button
            onClick={handleBack}
            className="p-1 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-6 h-6 text-card-foreground" />
          </button>
          <h1 className="text-base font-bold text-card-foreground">
            프로필 만들기
          </h1>
          <div className="w-9" />
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-5 py-4">
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

      {/* Content */}
      <div className="px-5 pb-32 space-y-8">
        <ProfilePhotoGallery
          initialImages={user.profileImages || []}
          onDraftChange={handleDraftChange}
        />

        <ProfileNicknameInput
          value={formData.nickname}
          onChange={(value) => setFormData((prev) => ({ ...prev, nickname: value }))}
        />

        <ProfileBioInput
          value={formData.bio}
          onChange={(value) => setFormData((prev) => ({ ...prev, bio: value }))}
        />

        <ProfileHeightWeightInput
          height={formData.height}
          weight={formData.weight}
          onHeightChange={(value) => setFormData((prev) => ({ ...prev, height: value }))}
          onWeightChange={(value) => setFormData((prev) => ({ ...prev, weight: value }))}
        />

        <ProfileInbodyInput
          muscleMass={formData.muscleMass}
          bodyFatPercentage={formData.bodyFatPercentage}
          showInbodyPublic={formData.showInbodyPublic}
          onMuscleMassChange={(value) =>
            setFormData((prev) => ({ ...prev, muscleMass: value }))
          }
          onBodyFatPercentageChange={(value) =>
            setFormData((prev) => ({ ...prev, bodyFatPercentage: value }))
          }
          onShowInbodyPublicChange={(value) =>
            setFormData((prev) => ({ ...prev, showInbodyPublic: value }))
          }
        />

        <ProfileSmokingInput
          value={formData.isSmoker}
          onChange={(value) => setFormData((prev) => ({ ...prev, isSmoker: value }))}
        />

        <ProfileLocationsInput
          value={formData.interestedLocations}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, interestedLocations: value }))
          }
        />

        <ProfileInterestsInput
          value={formData.interestedExercises}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, interestedExercises: value }))
          }
        />
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-background border-t border-border/50">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? '저장 중...' : '저장하기'}
        </button>
      </div>
    </div>
  );
}
