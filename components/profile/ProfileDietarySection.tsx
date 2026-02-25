'use client';

import { useState } from 'react';
import { BowlFoodIcon, CaretRightIcon } from '@phosphor-icons/react';
import { EMPTY_STATE } from '@/lib/config/theme';
import { useDietaryProfileSuspense, useUserDietaryProfileSuspense, hasDietaryProfileData } from '@/hooks/dietaryProfile';
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
 * Hero(목표+유형) + 요약 텍스트 라인 + 제한사항 태그
 */
interface ProfileDietarySectionProps {
  isOwnProfile?: boolean;
  userId?: string;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

export default function ProfileDietarySection({
  isOwnProfile = true,
  userId,
  renderHeader = true,
}: ProfileDietarySectionProps = {}) {
  return isOwnProfile
    ? <OwnDietaryData renderHeader={renderHeader} />
    : <OtherDietaryData userId={userId!} renderHeader={renderHeader} />;
}

function OwnDietaryData({ renderHeader }: { renderHeader: boolean }) {
  const { data: profile } = useDietaryProfileSuspense();
  return <DietaryDisplay profile={profile ?? undefined} isOwnProfile renderHeader={renderHeader} />;
}

function OtherDietaryData({ userId, renderHeader }: { userId: string; renderHeader: boolean }) {
  const { data } = useUserDietaryProfileSuspense(userId);
  return <DietaryDisplay profile={data.profile ?? undefined} isOwnProfile={false} renderHeader={renderHeader} />;
}

// ============================================================
// Shared Display Component
// ============================================================

interface DietaryDisplayProps {
  profile: DietaryProfile | undefined;
  isOwnProfile: boolean;
  renderHeader: boolean;
}

function DietaryDisplay({ profile, isOwnProfile, renderHeader }: DietaryDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const hasData = hasDietaryProfileData(profile);
  const compact = !renderHeader;

  const renderEmpty = () => (
    <EmptyState
      {...EMPTY_STATE.meal.noProfile}
      size="sm"
      action={isOwnProfile ? { label: '등록하기', href: '/profile/dietary' } : undefined}
    />
  );

  // 수치 요약 텍스트 (3끼/일 · 2,500kcal)
  const getSummaryText = (p: DietaryProfile) => {
    const parts: string[] = [];
    if (p.mealsPerDay) parts.push(`${p.mealsPerDay}끼/일`);
    if (p.targetCalories) parts.push(`${p.targetCalories.toLocaleString()}kcal`);
    if (p.budgetPerMonth) parts.push(`월 ${p.budgetPerMonth.toLocaleString()}원`);
    return parts.join(' · ');
  };

  const renderData = () => {
    if (!profile) return null;

    const summaryText = getSummaryText(profile);
    const restrictions = profile.foodRestrictions?.filter(r => r !== 'none') ?? [];
    const sources = profile.availableSources ?? [];

    return (
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full text-left active:scale-[0.99] transition-transform duration-150"
      >
        {/* Hero: 아이콘 + 목표/유형 + chevron */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-accent flex items-center justify-center shrink-0">
            <BowlFoodIcon size={20} className="text-foreground" weight="duotone" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile.dietaryGoal
                ? DIETARY_GOAL_LABELS[profile.dietaryGoal]
                : '목표 미설정'}
            </p>
            <p className="text-xs text-muted-foreground">
              {profile.dietType
                ? DIET_TYPE_LABELS[profile.dietType]
                : '유형 미설정'}
            </p>
          </div>
          <CaretRightIcon size={16} className="text-muted-foreground shrink-0" />
        </div>

        {/* 구분선 아래 요약 정보 */}
        {(summaryText || restrictions.length > 0 || sources.length > 0) && (
          <div className="border-t border-edge-faint mt-3 pt-3 space-y-2">
            {/* 수치 요약 */}
            {summaryText && (
              <p className="text-xs text-muted-foreground">{summaryText}</p>
            )}

            {/* 제한사항 태그 (warning 톤) */}
            {restrictions.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {restrictions.map((r) => (
                  <span
                    key={r}
                    className="px-2 py-0.5 text-xs rounded-md bg-warning/10 text-warning"
                  >
                    {FOOD_RESTRICTION_LABELS[r]}
                  </span>
                ))}
              </div>
            )}

            {/* 식단 출처 태그 */}
            {sources.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sources.map((s) => (
                  <span
                    key={s}
                    className="px-2 py-0.5 text-xs rounded-md bg-surface-muted text-muted-foreground"
                  >
                    {AVAILABLE_SOURCE_LABELS[s]}
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
            title="식단 프로필"
            action={{ label: '관리', href: '/profile/dietary' }}
          />
          <div className="bg-surface-secondary rounded-2xl p-4">
            {content}
          </div>
        </div>
      ) : (
        content
      )}

      {profile && hasData && (
        <DietaryDetailDrawer
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          profile={profile}
          readOnly={!isOwnProfile}
        />
      )}
    </>
  );
}
