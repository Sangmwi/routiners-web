'use client';

import { useState } from 'react';
import { BarbellIcon, CaretRightIcon } from '@phosphor-icons/react';
import { useFitnessProfile, hasFitnessProfileData } from '@/hooks/fitnessProfile';
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
export default function ProfileFitnessSection() {
  const { data: profile, isPending: isLoading } = useFitnessProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasData = hasFitnessProfileData(profile);

  const renderLoading = () => (
    <div className="flex items-center justify-center py-6">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const renderEmpty = () => (
    <EmptyState
      icon={BarbellIcon}
      message="아직 운동 프로필이 없어요"
      hint="AI 트레이너와 대화하거나 직접 등록해보세요"
    />
  );

  // 스케줄 요약 텍스트 생성 (주 3회 · 90분/회)
  const getScheduleText = (profile: FitnessProfile) => {
    const parts: string[] = [];
    if (profile.preferredDaysPerWeek) parts.push(`주 ${profile.preferredDaysPerWeek}회`);
    if (profile.sessionDurationMinutes) parts.push(`${profile.sessionDurationMinutes}분/회`);
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
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <BarbellIcon size={20} className="text-primary" weight="duotone" />
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
          <div className="border-t border-border/30 mt-3 pt-3 space-y-2">
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
                    className="px-2 py-0.5 text-[11px] rounded-md bg-muted/50 text-muted-foreground"
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

  return (
    <>
      <div className="space-y-3">
        <SectionHeader
          title="운동 프로필"
          action={{ label: '관리', href: '/profile/fitness' }}
        />

        <div className="bg-muted/20 rounded-2xl p-4">
          {isLoading ? renderLoading() : !hasData ? renderEmpty() : renderData()}
        </div>
      </div>

      {profile && hasData && (
        <FitnessDetailDrawer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profile={profile}
        />
      )}
    </>
  );
}
