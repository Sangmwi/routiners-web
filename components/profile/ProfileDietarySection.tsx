'use client';

import { useState } from 'react';
import { BowlFoodIcon } from '@phosphor-icons/react';
import { ExpandIcon } from '@/components/ui/icons';
import { useDietaryProfile, hasDietaryProfileData } from '@/hooks/dietaryProfile';
import {
  DIETARY_GOAL_LABELS,
  DIET_TYPE_LABELS,
  FOOD_RESTRICTION_LABELS,
  AVAILABLE_SOURCE_LABELS,
  DietaryProfile,
} from '@/lib/types/meal';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import { DietaryDetailDrawer } from '@/components/drawers';

/**
 * 프로필 식단 섹션
 *
 * 운동 프로필 섹션(ProfileFitnessSection) 아래에 위치
 * 태그 형태로 요약 정보 표시
 */
export default function ProfileDietarySection() {
  const { data: profile, isPending: isLoading } = useDietaryProfile();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasData = hasDietaryProfileData(profile);

  const getSummaryTags = (profile: DietaryProfile) => {
    const tags: { label: string; value: string }[] = [];

    if (profile.dietaryGoal) {
      tags.push({
        label: '목표',
        value: DIETARY_GOAL_LABELS[profile.dietaryGoal],
      });
    }

    if (profile.dietType) {
      tags.push({
        label: '유형',
        value: DIET_TYPE_LABELS[profile.dietType],
      });
    }

    if (profile.mealsPerDay) {
      tags.push({
        label: '식사',
        value: `${profile.mealsPerDay}끼/일`,
      });
    }

    if (profile.targetCalories) {
      tags.push({
        label: '목표 칼로리',
        value: `${profile.targetCalories}kcal`,
      });
    }

    return tags;
  };

  const renderLoading = () => (
    <div className="flex items-center justify-center py-6">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const renderEmpty = () => (
    <EmptyState
      icon={BowlFoodIcon}
      message="아직 식단 프로필이 없어요"
      hint="AI 상담사와 대화하거나 직접 등록해보세요"
    />
  );

  const renderData = () => {
    if (!profile) return null;

    const tags = getSummaryTags(profile);
    const restrictionsCount = profile.foodRestrictions?.length || 0;
    const sourcesCount = profile.availableSources?.length || 0;

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
        {(restrictionsCount > 0 || sourcesCount > 0) && (
          <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
            {restrictionsCount > 0 && (
              <span>
                제한사항: {profile.foodRestrictions!.slice(0, 2).map(r => FOOD_RESTRICTION_LABELS[r]).join(', ')}
                {restrictionsCount > 2 && ` 외 ${restrictionsCount - 2}개`}
              </span>
            )}
            {sourcesCount > 0 && (
              <span>
                식단 출처: {profile.availableSources!.slice(0, 2).map(s => AVAILABLE_SOURCE_LABELS[s]).join(', ')}
                {sourcesCount > 2 && ` 외 ${sourcesCount - 2}개`}
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
          title="식단 프로필"
          action={{ label: '관리', href: '/profile/dietary' }}
        />

        <div className="bg-muted/20 rounded-2xl p-4">
          {isLoading ? renderLoading() : !hasData ? renderEmpty() : renderData()}
        </div>
      </div>

      {/* 상세 드로어 */}
      {profile && hasData && (
        <DietaryDetailDrawer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profile={profile}
        />
      )}
    </>
  );
}
