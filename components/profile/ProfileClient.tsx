'use client';

import { Suspense } from 'react';
import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import { useLogout, useWithdrawal } from '@/hooks';
import MainTabLayout from '@/components/common/MainTabLayout';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileHeroSection from '@/components/profile/ProfileHeroSection';
import ProfileLocationCard from '@/components/profile/ProfileLocationCard';
import ProfileBioSection from '@/components/profile/ProfileBioSection';
import ProfileInfoTags from '@/components/profile/ProfileInfoTags';
import ProfileInterestsTags from '@/components/profile/ProfileInterestsTags';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import ProfileFitnessSection from '@/components/profile/ProfileFitnessSection';
import ProfileMilitarySection from '@/components/profile/ProfileMilitarySection';
import ProfileLocationsSection from '@/components/profile/ProfileLocationsSection';
import { SignOutIcon, UserMinusIcon, SpinnerGapIcon } from '@phosphor-icons/react';
import { PulseLoader } from '@/components/ui/PulseLoader';

// ============================================================================
// ProfileContent - Suspense 내부 컴포넌트
// ============================================================================

function ProfileContent() {
  // API가 User를 반환 (null 아님) - 404는 ErrorBoundary가 처리
  const { data: user } = useCurrentUserProfileSuspense();
  const { logout, isLoggingOut } = useLogout();
  const { withdraw, isWithdrawing } = useWithdrawal();

  return (
    <>
      <ProfileHeroSection user={user} />

      <ProfileLocationCard
        location={`${user.unitName} 체력단련실 및 연무장`}
      />

      <ProfileBioSection bio={user.bio} />

      <ProfileMilitarySection
        rank={user.rank}
        unitName={user.unitName}
        specialty={user.specialty}
      />

      <ProfileInfoTags user={user} />

      {/* 소셜/매칭용: 관심종목, 자주가는 장소 */}
      <ProfileInterestsTags interests={user.interestedExercises} />

      <ProfileLocationsSection locations={user.interestedLocations} />

      {/* AI 트레이너용: 인바디, 운동 프로필 - 그룹 간 간격 추가 */}
      <div className="pt-4" />

      <ProfileInbodySection
        showInbodyPublic={user.showInbodyPublic}
        isOwnProfile={true}
      />

      <ProfileFitnessSection />

      {/* Logout & Withdrawal Buttons */}
      <div className="pt-2 space-y-2">
        <button
          onClick={logout}
          disabled={isLoggingOut || isWithdrawing}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoggingOut ? (
            <>
              <SpinnerGapIcon size={16} className="animate-spin" />
              <span>로그아웃 중...</span>
            </>
          ) : (
            <>
              <SignOutIcon size={16} />
              <span>로그아웃</span>
            </>
          )}
        </button>

        <button
          onClick={withdraw}
          disabled={isWithdrawing || isLoggingOut}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isWithdrawing ? (
            <>
              <SpinnerGapIcon size={16} className="animate-spin" />
              <span>탈퇴 처리 중...</span>
            </>
          ) : (
            <>
              <UserMinusIcon size={16} />
              <span>회원 탈퇴</span>
            </>
          )}
        </button>
      </div>
    </>
  );
}

// ============================================================================
// ProfileClient - 메인 export
// ============================================================================

export default function ProfileClient() {
  return (
    <MainTabLayout>
      <ProfileHeader />
      <QueryErrorBoundary>
        <Suspense fallback={<PulseLoader />}>
          <ProfileContent />
        </Suspense>
      </QueryErrorBoundary>
    </MainTabLayout>
  );
}
