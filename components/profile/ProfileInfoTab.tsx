'use client';

import { ReactNode } from 'react';
import { CigaretteSlashIcon, CigaretteIcon } from '@phosphor-icons/react';
import ViewMoreButton from '@/components/ui/ViewMoreButton';
import Surface from '@/components/ui/Surface';
import Tag from '@/components/ui/Tag';
import { useInBodySummarySuspense, useUserInBodySummarySuspense } from '@/hooks/inbody';
import { useProgressSummarySuspense, useUserProgressSummarySuspense } from '@/hooks/progress';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import BodyCompositionSummary from '@/components/inbody/BodyCompositionSummary';
import ProfileBig3Section from '@/components/profile/ProfileBig3Section';
import ProfileFitnessSection from '@/components/profile/ProfileFitnessSection';
import ProfileDietarySection from '@/components/profile/ProfileDietarySection';
import type { User, InBodySummary } from '@/lib/types';

function InfoTabSection({
  title,
  action,
  beforeNavigate,
  className,
  children,
}: {
  title: string;
  action?: { label: string; href: string };
  beforeNavigate?: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1 flex items-center justify-between">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h4>
        {action ? (
          <ViewMoreButton href={action.href} variant="primary" beforeNavigate={beforeNavigate}>
            {action.label}
          </ViewMoreButton>
        ) : null}
      </div>
      <Surface rounded="2xl" className={className}>{children}</Surface>
    </div>
  );
}

interface ProfileInfoTabProps {
  user: User;
  isOwnProfile?: boolean;
  userId?: string;
  beforeNavigate?: () => void;
}

export default function ProfileInfoTab({
  user,
  isOwnProfile = true,
  userId,
  beforeNavigate,
}: ProfileInfoTabProps) {
  return isOwnProfile ? (
    <OwnInfoTabContent user={user} beforeNavigate={beforeNavigate} />
  ) : (
    <OtherInfoTabContent user={user} userId={userId!} beforeNavigate={beforeNavigate} />
  );
}

function OwnInfoTabContent({ user, beforeNavigate }: { user: User; beforeNavigate?: () => void }) {
  const { data: inbodySummary } = useInBodySummarySuspense();
  const { data: progressSummary } = useProgressSummarySuspense(6);

  return (
    <InfoTabDisplay
      user={user}
      inbodySummary={inbodySummary}
      hasBig3Data={!!progressSummary.big3?.latest}
      isOwnProfile
      beforeNavigate={beforeNavigate}
    />
  );
}

function OtherInfoTabContent({
  user,
  userId,
  beforeNavigate,
}: {
  user: User;
  userId: string;
  beforeNavigate?: () => void;
}) {
  const { data: inbodySummary } = useUserInBodySummarySuspense(userId);
  const { data: progressSummary } = useUserProgressSummarySuspense(userId, 6);

  return (
    <InfoTabDisplay
      user={user}
      inbodySummary={inbodySummary}
      hasBig3Data={!!progressSummary.big3?.latest}
      isOwnProfile={false}
      userId={userId}
      beforeNavigate={beforeNavigate}
    />
  );
}

interface InfoTabDisplayProps {
  user: User;
  inbodySummary: InBodySummary;
  hasBig3Data: boolean;
  isOwnProfile: boolean;
  userId?: string;
  beforeNavigate?: () => void;
}

function InfoTabDisplay({
  user,
  inbodySummary,
  hasBig3Data,
  isOwnProfile,
  userId,
  beforeNavigate,
}: InfoTabDisplayProps) {
  const hasInBodyData = !!inbodySummary?.latest;

  const hasInterests =
    (user.interestedExercises?.length ?? 0) > 0 ||
    (user.interestedLocations?.length ?? 0) > 0;
  const hasLifestyle = user.isSmoker !== undefined || hasInterests;

  return (
    <div className="space-y-4 pt-2">
      <InfoTabSection
        title="인바디"
        action={isOwnProfile && hasInBodyData ? { label: '관리', href: '/profile/inbody' } : undefined}
        beforeNavigate={beforeNavigate}
      >
        <BodyCompositionSummary
          height={inbodySummary?.latest?.height}
          measuredAt={inbodySummary?.latest?.measuredAt}
          score={inbodySummary?.latest?.inbodyScore}
        >
          <ProfileInbodySection renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
        </BodyCompositionSummary>
      </InfoTabSection>

      <InfoTabSection
        title="3대 운동"
        action={isOwnProfile && hasBig3Data ? { label: '관리', href: '/profile/big3' } : undefined}
        beforeNavigate={beforeNavigate}
      >
        <ProfileBig3Section renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      <InfoTabSection title="운동 프로필">
        <ProfileFitnessSection renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      <InfoTabSection title="식단 프로필">
        <ProfileDietarySection renderHeader={false} isOwnProfile={isOwnProfile} userId={userId} />
      </InfoTabSection>

      {hasLifestyle ? (
        <InfoTabSection title="라이프스타일" className="space-y-3">
          {user.isSmoker !== undefined ? (
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
          ) : null}

          {user.isSmoker !== undefined && hasInterests ? <div className="border-t border-edge-faint" /> : null}

          {(user.interestedExercises?.length ?? 0) > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">관심 종목</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interestedExercises!.map((exercise) => (
                  <Tag key={exercise} variant="muted">{exercise}</Tag>
                ))}
              </div>
            </div>
          ) : null}

          {(user.interestedLocations?.length ?? 0) > 0 ? (
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">선호 장소</p>
              <div className="flex flex-wrap gap-1.5">
                {user.interestedLocations!.map((location) => (
                  <Tag key={location} variant="muted">{location}</Tag>
                ))}
              </div>
            </div>
          ) : null}
        </InfoTabSection>
      ) : null}
    </div>
  );
}

