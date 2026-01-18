'use client';

import { useState } from 'react';
import { BarbellIcon } from '@phosphor-icons/react';
import { ExpandIcon } from '@/components/ui/icons';
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
 * 인바디 섹션 바로 아래에 위치
 * 태그 형태로 요약 정보 표시 + "자세히 보기" 버튼으로 상세 모달
 */
export default function ProfileFitnessSection() {
  const { data: profile, isPending: isLoading } = useFitnessProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasData = hasFitnessProfileData(profile);

  // 요약 태그 생성
  const getSummaryTags = (profile: FitnessProfile) => {
    const tags: { label: string; value: string }[] = [];

    if (profile.fitnessGoal) {
      tags.push({
        label: '목표',
        value: FITNESS_GOAL_LABELS[profile.fitnessGoal],
      });
    }

    if (profile.experienceLevel) {
      tags.push({
        label: '경험',
        value: EXPERIENCE_LEVEL_LABELS[profile.experienceLevel],
      });
    }

    if (profile.preferredDaysPerWeek) {
      tags.push({
        label: '빈도',
        value: `${profile.preferredDaysPerWeek}회/주`,
      });
    }

    if (profile.sessionDurationMinutes) {
      tags.push({
        label: '시간',
        value: `${profile.sessionDurationMinutes}분`,
      });
    }

    if (profile.equipmentAccess) {
      tags.push({
        label: '장비',
        value: EQUIPMENT_ACCESS_LABELS[profile.equipmentAccess],
      });
    }

    return tags;
  };

  // 로딩 상태
  const renderLoading = () => (
    <div className="flex items-center justify-center py-6">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // 빈 상태
  const renderEmpty = () => (
    <EmptyState
      icon={BarbellIcon}
      message="아직 운동 프로필이 없어요"
      hint="AI 트레이너와 대화하거나 직접 등록해보세요"
    />
  );

  // 데이터 상태
  const renderData = () => {
    if (!profile) return null;

    const tags = getSummaryTags(profile);
    const focusAreasCount = profile.focusAreas?.length || 0;
    const injuriesCount = profile.injuries?.length || 0;

    return (
      <>
        {/* 태그 목록 */}
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted text-sm"
            >
              <span className="text-muted-foreground">{tag.label}:</span>
              <span className="font-medium text-foreground">{tag.value}</span>
            </span>
          ))}
        </div>

        {/* 추가 정보 요약 */}
        {(focusAreasCount > 0 || injuriesCount > 0) && (
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {focusAreasCount > 0 && (
              <span>
                집중 부위: {profile.focusAreas!.slice(0, 2).map(a => FOCUS_AREA_LABELS[a]).join(', ')}
                {focusAreasCount > 2 && ` 외 ${focusAreasCount - 2}개`}
              </span>
            )}
            {injuriesCount > 0 && (
              <span>
                부상/제한: {injuriesCount}개
              </span>
            )}
          </div>
        )}

        {/* 자세히 보기 버튼 */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="mt-4 w-full flex items-center justify-center gap-1 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          자세히 보기
          <ExpandIcon size="sm" />
        </button>
      </>
    );
  };

  return (
    <>
      <div className="space-y-3">
        <SectionHeader
          title="운동 프로필"
          action={{ label: '관리', href: '/profile/fitness' }}
        />

        <div className="rounded-[20px] bg-card p-4 shadow-sm border border-border/50">
          {isLoading ? renderLoading() : !hasData ? renderEmpty() : renderData()}
        </div>
      </div>

      {/* 상세 드로어 */}
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
