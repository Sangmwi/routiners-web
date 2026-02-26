'use client';

import { ReactNode } from 'react';
import {
  CigaretteSlashIcon,
  CigaretteIcon,
} from '@phosphor-icons/react';
import ViewMoreButton from '@/components/ui/ViewMoreButton';
import { useInBodySummarySuspense, useUserInBodySummarySuspense } from '@/hooks/inbody';
import { useProgressSummarySuspense, useUserProgressSummarySuspense } from '@/hooks/progress';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import BodyCompositionSummary from '@/components/inbody/BodyCompositionSummary';
import ProfileBig3Section from '@/components/profile/ProfileBig3Section';
import ProfileFitnessSection from '@/components/profile/ProfileFitnessSection';
import ProfileDietarySection from '@/components/profile/ProfileDietarySection';
import type { User, InBodySummary } from '@/lib/types';

// ============================================================
// Sub Components
// ============================================================

function InfoTabSection({
  title,
  action,
  className,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1 flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
        {action && (
          <ViewMoreButton href={action.href} variant="primary">
            {action.label}
          </ViewMoreButton>
        )}
      </div>
      <div className={`bg-surface-secondary rounded-2xl p-4 ${className || ''}`}>
        {children}
      </div>
    </div>
  );
}

// ============================================================
// Main Component
// ============================================================

interface ProfileInfoTabProps {
  user: User;
  isOwnProfile?: boolean;
  userId?: string;
}

export default function ProfileInfoTab({ user, isOwnProfile = true, userId }: ProfileInfoTabProps) {
  return isOwnProfile
    ? <OwnInfoTabContent user={user} />
    : <OtherInfoTabContent user={user} userId={userId!} />;
}

function OwnInfoTabContent({ user }: { user: User }) {
  const { data: inbodySummary } = useInBodySummarySuspense();
  const { data: progressSummary } = useProgressSummarySuspense(6);
  return <InfoTabDisplay user={user} inbodySummary={inbodySummary} hasBig3Data={!!progressSummary.big3?.latest} isOwnProfile />;
}

function OtherInfoTabContent({ user, userId }: { user: User; userId: string }) {
  const { data: inbodySummary } = useUserInBodySummarySuspense(userId);
  const { data: progressSummary } = useUserProgressSummarySuspense(userId, 6);
  return <InfoTabDisplay user={user} inbodySummary={inbodySummary} hasBig3Data={!!progressSummary.big3?.latest} isOwnProfile={false} userId={userId} />;
}

// ============================================================
// Shared Display Component
// ============================================================

interface InfoTabDisplayProps {
  user: User;
  inbodySummary: InBodySummary;
  hasBig3Data: boolean;
  isOwnProfile: boolean;
  userId?: string;
}

function InfoTabDisplay({ user, inbodySummary, hasBig3Data, isOwnProfile, userId }: InfoTabDisplayProps) {
  const hasInBodyData = !!inbodySummary?.latest;

  const hasInterests =
    (user.interestedExercises?.length ?? 0) > 0 ||
    (user.interestedLocations?.length ?? 0) > 0;
  const hasLifestyle = user.isSmoker !== undefined || hasInterests;

  return (
    <div className="space-y-4 pt-2">
      {/* 1. 인바디 */}
      <InfoTabSection
        title="인바디"
        action={isOwnProfile && hasInBodyData ? { label: '관리', href: '/profile/inbody' } : undefined}
      >
        <BodyCompositionSummary
          height={inbodySummary?.latest?.height}
          measuredAt={inbodySummary?.latest?.measuredAt}
        >
          <ProfileInbodySection
            renderHeader={false}
            isOwnProfile={isOwnProfile}
            userId={userId}
          />
        </BodyCompositionSummary>
      </InfoTabSection>

      {/* 2. 3대운동 */}
      <InfoTabSection
        title="3대운동"
        action={isOwnProfile && hasBig3Data ? { label: '관리', href: '/profile/big3' } : undefined}
      >
        <ProfileBig3Section renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      {/* 3. 운동 프로필 */}
      <InfoTabSection title="운동 프로필">
        <ProfileFitnessSection renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      {/* 4. 식단 프로필 */}
      <InfoTabSection title="식단 프로필">
        <ProfileDietarySection renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      {/* 5. 라이프스타일 */}
      {hasLifestyle && (
        <InfoTabSection title="라이프스타일" className="space-y-3">
          {user.isSmoker !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              {user.isSmoker ? (
                <>
                  <CigaretteIcon size={14} className="text-orange-500" />
                  <span className="text-foreground">흡연</span>
                </>
              ) : (
                <>
                  <CigaretteSlashIcon size={14} className="text-emerald-500" />
                  <span className="text-foreground">비흡연</span>
                </>
              )}
            </div>
          )}
          {user.isSmoker !== undefined && hasInterests && (
            <div className="border-t border-edge-faint" />
          )}
          {(user.interestedExercises?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">관심 종목</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interestedExercises!.map((exercise) => (
                  <span
                    key={exercise}
                    className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground"
                  >
                    {exercise}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(user.interestedLocations?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">선호 장소</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interestedLocations!.map((location) => (
                  <span
                    key={location}
                    className="px-2.5 py-1 rounded-full bg-muted text-xs text-foreground"
                  >
                    {location}
                  </span>
                ))}
              </div>
            </div>
          )}
        </InfoTabSection>
      )}
    </div>
  );
}
