'use client';

import { useState } from 'react';
import { BarbellIcon, CaretRightIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import { useFitnessProfileSuspense, useUserFitnessProfileSuspense, hasFitnessProfileData } from '@/hooks/fitnessProfile';
import {
  FITNESS_GOAL_LABELS,
  EXPERIENCE_LEVEL_LABELS,
  EQUIPMENT_ACCESS_LABELS,
  FOCUS_AREA_LABELS,
  FitnessProfile,
} from '@/lib/types/fitness';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import { FitnessDetailDrawer } from '@/components/drawers';

/**
 * 프로필 피트니스 섹션
 *
 * Hero(목표+경험) + 요약 텍스트 라인 + 집중 부위 태그
 */
interface ProfileFitnessSectionProps {
  isOwnProfile?: boolean;
  userId?: string;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

export default function ProfileFitnessSection({
  isOwnProfile = true,
  userId,
  renderHeader = true,
}: ProfileFitnessSectionProps = {}) {
  return isOwnProfile
    ? <OwnFitnessData renderHeader={renderHeader} />
    : <OtherFitnessData userId={userId!} renderHeader={renderHeader} />;
}

function OwnFitnessData({ renderHeader }: { renderHeader: boolean }) {
  const { data: profile } = useFitnessProfileSuspense();
  return <FitnessDisplay profile={profile} isOwnProfile renderHeader={renderHeader} />;
}

function OtherFitnessData({ userId, renderHeader }: { userId: string; renderHeader: boolean }) {
  const { data } = useUserFitnessProfileSuspense(userId);
  return <FitnessDisplay profile={data.profile ?? undefined} isOwnProfile={false} renderHeader={renderHeader} />;
}

// ============================================================
// Shared Display Component
// ============================================================

interface FitnessDisplayProps {
  profile: FitnessProfile | undefined;
  isOwnProfile: boolean;
  renderHeader: boolean;
}

function FitnessDisplay({ profile, isOwnProfile, renderHeader }: FitnessDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasData = hasFitnessProfileData(profile);
  const compact = !renderHeader;

  const renderEmpty = () => (
    <EmptyState
      {...EMPTY_STATE.workout.noProfile}
      size="sm"
      action={isOwnProfile ? { label: '등록하기', href: '/profile/fitness' } : undefined}
    />
  );

  // 스케줄 요약 텍스트 생성 (주 3회 · 90분/회)
  const getScheduleText = (p: FitnessProfile) => {
    const parts: string[] = [];
    if (p.preferredDaysPerWeek) parts.push(`주 ${p.preferredDaysPerWeek}회`);
    if (p.sessionDurationMinutes) parts.push(`${p.sessionDurationMinutes}분/회`);
    return parts.join(' · ');
  };

  const renderData = () => {
    if (!profile) return null;

    const scheduleText = getScheduleText(profile);
    const equipmentText = profile.equipmentAccess
      ? EQUIPMENT_ACCESS_LABELS[profile.equipmentAccess]
      : null;
    const focusAreas = profile.focusAreas ?? [];

    return (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left active:scale-[0.99] transition-transform duration-150"
      >
        {/* Hero: 아이콘 + 목표/경험 + chevron */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-accent flex items-center justify-center shrink-0">
            <BarbellIcon size={20} className="text-foreground" weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile.fitnessGoal
                ? FITNESS_GOAL_LABELS[profile.fitnessGoal]
                : '목표 미설정'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.experienceLevel
                ? EXPERIENCE_LEVEL_LABELS[profile.experienceLevel]
                : '경험 미설정'}
            </p>
          </div>
          <CaretRightIcon size={16} className="text-muted-foreground shrink-0" />
        </div>

        {/* 구분선 */}
        {(scheduleText || equipmentText || focusAreas.length > 0) && (
          <div className="border-t border-edge-faint mt-3 pt-3 space-y-2">
            {/* 스케줄 + 장비 (한 줄 텍스트) */}
            {(scheduleText || equipmentText) && (
              <p className="text-xs text-muted-foreground">
                {[scheduleText, equipmentText].filter(Boolean).join(' · ')}
              </p>
            )}

            {/* 집중 부위 태그 */}
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {focusAreas.map((area) => (
                  <span
                    key={area}
                    className="px-2 py-0.5 text-xs rounded-md bg-surface-muted text-muted-foreground"
                  >
                    {FOCUS_AREA_LABELS[area]}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </button>
    );
  };

  const content = !hasData ? renderEmpty() : renderData();

  return (
    <>
      {renderHeader ? (
        <div className="space-y-3">
          <SectionHeader
            title="운동 프로필"
            action={{ label: '관리', href: '/profile/fitness' }}
          />
          <div className="bg-surface-secondary rounded-2xl p-4">
            {content}
          </div>
        </div>
      ) : (
        content
      )}

      {profile && hasData && (
        <FitnessDetailDrawer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profile={profile}
          readOnly={!isOwnProfile}
        />
      )}
    </>
  );
}
