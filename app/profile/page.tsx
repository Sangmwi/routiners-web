'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useCurrentUserProfile } from '@/lib/hooks/useProfile';
import { createClient } from '@/utils/supabase/client';
import ProfileHeroSection from '@/components/profile/ProfileHeroSection';
import ProfileLocationCard from '@/components/profile/ProfileLocationCard';
import ProfileBioSection from '@/components/profile/ProfileBioSection';
import ProfileInfoTags from '@/components/profile/ProfileInfoTags';
import ProfileInterestsTags from '@/components/profile/ProfileInterestsTags';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import ProfileMilitarySection from '@/components/profile/ProfileMilitarySection';
import ProfileLocationsSection from '@/components/profile/ProfileLocationsSection';
import { Loader2, ArrowLeft, Settings, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, isLoading, error } = useCurrentUserProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const supabase = createClient();

  const handleEdit = () => {
    router.push('/profile/edit');
  };

  const handleBack = () => {
    router.back();
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
    }
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
          <h1 className="text-base font-bold text-card-foreground">내 프로필</h1>
          {/* Edit button - only show for own profile */}
          <button
            onClick={handleEdit}
            className="p-1.5 hover:bg-muted/50 rounded-lg transition-colors"
            aria-label="설정"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-8 space-y-6 pb-32">
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

        {/* Logout Button */}
        <div className="pt-8">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>로그아웃 중...</span>
              </>
            ) : (
              <>
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Chat Button - NOT shown for own profile */}
    </div>
  );
}

