'use client';

import { ReactNode } from 'react';
import {
  CigaretteSlashIcon,
  CigaretteIcon,
} from '@phosphor-icons/react';
import { useInBodySummarySuspense } from '@/hooks/inbody';
import ProfileInbodySection from '@/components/profile/ProfileInbodySection';
import BodyCompositionSummary from '@/components/inbody/BodyCompositionSummary';
import ProfileBig3Section from '@/components/profile/ProfileBig3Section';
import ProfileFitnessSection from '@/components/profile/ProfileFitnessSection';
import ProfileDietarySection from '@/components/profile/ProfileDietarySection';
import type { User } from '@/lib/types';

// ============================================================
// Sub Components
// ============================================================

function InfoTabSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="px-1">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {title}
        </h4>
      </div>
      <div className={`bg-muted/20 rounded-2xl p-4 ${className || ''}`}>
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
}

export default function ProfileInfoTab({ user }: ProfileInfoTabProps) {
  const { data: inbodySummary } = useInBodySummarySuspense();
  const hasInBodyData = !!inbodySummary?.latest;

  const hasInterests =
    (user.interestedExercises?.length ?? 0) > 0 ||
    (user.interestedLocations?.length ?? 0) > 0;
  const hasLifestyle = user.isSmoker !== undefined || hasInterests;

  return (
    <div className="space-y-4 py-4 px-1">
      {/* 1. 신체 정보 */}
      <InfoTabSection title="신체 정보">
        <BodyCompositionSummary
          height={user.height}
          measuredAt={inbodySummary?.latest?.measuredAt}
        >
          {/* 인바디 없을 때 직접입력 몸무게 fallback */}
          {!hasInBodyData && user.weight && (
            <p className="text-xs text-muted-foreground mb-3">
              몸무게 <span className="font-medium text-foreground">{user.weight}kg</span>
            </p>
          )}
          <ProfileInbodySection
            renderHeader={false}
            isOwnProfile={true}
          />
        </BodyCompositionSummary>
      </InfoTabSection>

      {/* 2. 3대운동 */}
      <InfoTabSection title="3대운동">
        <ProfileBig3Section renderHeader={false} isOwnProfile={true} />
      </InfoTabSection>

      {/* 3. 운동 프로필 */}
      <InfoTabSection title="운동 프로필">
        <ProfileFitnessSection renderHeader={false} />
      </InfoTabSection>

      {/* 4. 식단 프로필 */}
      <InfoTabSection title="식단 프로필">
        <ProfileDietarySection renderHeader={false} />
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
            <div className="border-t border-border/30" />
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
