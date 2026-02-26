'use client';

import { useProgressSummarySuspense, useUserProgressSummarySuspense } from '@/hooks/progress';
import { Big3SummaryCard } from '@/components/progress/Big3SummaryCard';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import { EMPTY_STATE } from '@/lib/config/theme';
import type { Big3Summary } from '@/lib/types/progress';

interface ProfileBig3SectionProps {
  isOwnProfile?: boolean;
  userId?: string;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

export default function ProfileBig3Section({
  isOwnProfile = false,
  userId,
  renderHeader = true,
}: ProfileBig3SectionProps) {
  return isOwnProfile
    ? <OwnBig3Data isOwnProfile renderHeader={renderHeader} />
    : <OtherBig3Data userId={userId!} renderHeader={renderHeader} />;
}

function OwnBig3Data({ isOwnProfile, renderHeader }: { isOwnProfile: boolean; renderHeader: boolean }) {
  const { data } = useProgressSummarySuspense(6);
  return <Big3Display big3={data.big3} isOwnProfile={isOwnProfile} renderHeader={renderHeader} />;
}

function OtherBig3Data({ userId, renderHeader }: { userId: string; renderHeader: boolean }) {
  const { data } = useUserProgressSummarySuspense(userId, 6);
  return <Big3Display big3={data.big3} isOwnProfile={false} renderHeader={renderHeader} />;
}

// ============================================================
// Shared Display Component
// ============================================================

interface Big3DisplayProps {
  big3: Big3Summary;
  isOwnProfile: boolean;
  renderHeader: boolean;
}

function Big3Display({ big3, isOwnProfile, renderHeader }: Big3DisplayProps) {
  const content = !big3?.latest ? (
    <EmptyState
      {...EMPTY_STATE.big3.noRecord}
      size="sm"
      hint={isOwnProfile ? EMPTY_STATE.big3.noRecord.hint : undefined}
    />
  ) : (
    <Big3SummaryCard
      summary={big3}
      cardClassName=""
    />
  );

  if (!renderHeader) return content;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="3대운동"
        action={isOwnProfile ? { label: '관리', href: '/profile/big3' } : undefined}
      />
      <div className="bg-surface-secondary rounded-2xl p-4">
        {content}
      </div>
    </div>
  );
}
