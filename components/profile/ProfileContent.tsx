'use client';

import { useCurrentUserProfileSuspense } from '@/hooks/profile';
import { useLogout, useWithdrawal } from '@/hooks';
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

/**
 * 프로필 페이지 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 사용자 프로필 조회
 * - 상위 page.tsx의 Suspense boundary에서 로딩 처리
 */
export default function ProfileContent() {
  const { data: user } = useCurrentUserProfileSuspense();
  const { logout, isLoggingOut } = useLogout();
  const { withdraw, isWithdrawing } = useWithdrawal();

  // 방어적 null 가드 - 프로필이 없는 경우 (가입 미완료 등)
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>프로필 정보를 불러올 수 없어요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* AI 트레이너용: 인바디, 운동 프로필 */}
      <ProfileInbodySection
        showInbodyPublic={user.showInbodyPublic}
        isOwnProfile={true}
      />

      <ProfileFitnessSection />

      {/* Logout & Withdrawal Buttons */}
      <div className="pt-4 space-y-2">
        <button
          onClick={logout}
          disabled={isLoggingOut || isWithdrawing}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg text-sm text-muted-foreground/50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
