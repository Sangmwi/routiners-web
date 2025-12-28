'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useUserProfile } from '@/hooks';
import PageHeader from '@/components/common/PageHeader';
import ProfileHeroSection from '@/components/profile/ProfileHeroSection';
import ProfileLocationCard from '@/components/profile/ProfileLocationCard';
import ProfileBioSection from '@/components/profile/ProfileBioSection';
import ProfileInfoTags from '@/components/profile/ProfileInfoTags';
import ProfileInterestsTags from '@/components/profile/ProfileInterestsTags';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import ProfileMilitarySection from '@/components/profile/ProfileMilitarySection';
import ProfileLocationsSection from '@/components/profile/ProfileLocationsSection';
import FloatingChatButton from '@/components/profile/FloatingChatButton';
import { PageSkeleton } from '@/components/ui/Skeleton';

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  // React Query로 데이터 페칭
  const { data: user, isLoading, error } = useUserProfile(userId);

  const handleChat = () => {
    // TODO: Navigate to chat with this user
    router.push(`/chat/${userId}`);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  if (error || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-background">
        <div className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">프로필을 불러올 수 없습니다</p>
          <button
            onClick={() => router.back()}
            className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader title="프로필" centered />

      {/* Content */}
      <div className="p-4 space-y-6 pb-32">
        {/* Hero Section */}
        <ProfileHeroSection user={user} />

        {/* Location Card */}
        <ProfileLocationCard
          location={`${user.unitName} 체력단련실 및 연무장`}
        />

        {/* Bio Section */}
        <ProfileBioSection bio={user.bio} />

        {/* Military Info */}
        <ProfileMilitarySection
          rank={user.rank}
          unitName={user.unitName}
          specialty={user.specialty}
        />

        {/* Personal Info */}
        <ProfileInfoTags user={user} />

        {/* Inbody Info */}
        <ProfileInbodySection
          muscleMass={user.muscleMass}
          bodyFatPercentage={user.bodyFatPercentage}
          weight={user.weight}
          showInbodyPublic={user.showInbodyPublic}
        />

        {/* Favorite Locations */}
        <ProfileLocationsSection locations={user.interestedLocations} />

        {/* Interests */}
        <ProfileInterestsTags interests={user.interestedExercises} />
      </div>

      {/* Floating Chat Button - Only shown for other users' profiles */}
      <FloatingChatButton onClick={handleChat} />
    </div>
  );
}
