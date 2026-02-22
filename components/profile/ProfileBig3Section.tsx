'use client';

import { BarbellIcon } from '@phosphor-icons/react';
import { useProgressSummary } from '@/hooks/progress';
import { Big3SummaryCard } from '@/components/progress/Big3SummaryCard';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';

interface ProfileBig3SectionProps {
  isOwnProfile?: boolean;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

export default function ProfileBig3Section({
  isOwnProfile = false,
  renderHeader = true,
}: ProfileBig3SectionProps) {
  const { data: progressSummary, isPending: isLoading } = useProgressSummary(6, {
    enabled: isOwnProfile,
  });

  const big3 = progressSummary?.big3;

  const compact = !renderHeader;

  const content = isLoading ? (
    <div className="flex items-center justify-center py-4">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  ) : !big3?.latest ? (
    <EmptyState
      icon={BarbellIcon}
      size={compact ? 'sm' : 'md'}
      message={isOwnProfile ? '3대운동 기록이 없어요' : '3대운동 기록이 없어요'}
      hint={isOwnProfile ? '루틴에서 스쿼트, 벤치프레스, 데드리프트를 기록해보세요' : undefined}
    />
  ) : (
    <Big3SummaryCard
      summary={big3}
      cardClassName=""
      sparklineHeight={36}
      sparklineShowAllDots
    />
  );

  if (!renderHeader) return content;

  return (
    <div className="space-y-3">
      <SectionHeader
        title="3대운동"
        action={isOwnProfile ? { label: '통계', href: '/stats?tab=workout' } : undefined}
      />
      <div className="bg-muted/20 rounded-2xl p-4">
        {content}
      </div>
    </div>
  );
}
