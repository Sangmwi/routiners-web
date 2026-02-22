'use client';

import { useState } from 'react';
import { ScalesIcon, LockIcon } from '@phosphor-icons/react';
import { useInBodySummary, useUserInBodySummary } from '@/hooks/inbody';
import { InBodyDetailModal } from '@/components/inbody';
import { MetricItem } from '@/components/inbody/MetricItem';
import { InBodyRecord } from '@/lib/types';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';

interface ProfileInbodySectionProps {
  /** 내 프로필인지 여부 */
  isOwnProfile?: boolean;
  /** 프로필 소유자 이름 (타인 프로필에서 사용) */
  userName?: string;
  /** 프로필 소유자 ID (타인 프로필에서 사용) */
  userId?: string;
  /** false이면 SectionHeader와 카드 컨테이너 없이 콘텐츠만 반환 */
  renderHeader?: boolean;
}

const INBODY_METRICS = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

export default function ProfileInbodySection({
  isOwnProfile = false,
  userName,
  userId,
  renderHeader = true,
}: ProfileInbodySectionProps) {

  // 내 프로필: useInBodySummary, 타인 프로필: useUserInBodySummary
  const ownSummaryQuery = useInBodySummary({
    enabled: isOwnProfile,
  });

  const otherSummaryQuery = useUserInBodySummary(userId, {
    enabled: !isOwnProfile && !!userId,
  });

  // 사용할 데이터 선택
  const { data: summary, isPending: isLoading } = isOwnProfile ? ownSummaryQuery : otherSummaryQuery;

  // 비공개 여부 (API 응답에서 확인)
  const isPrivate = summary?.isPrivate ?? false;
  const canViewData = !isPrivate || isOwnProfile;

  // 모달 상태 (타인 프로필에서만 사용 - 상세보기만)
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);

  const latest = summary?.latest;

  const compact = !renderHeader;

  // 비공개 상태 렌더링
  const renderPrivateState = () => {
    const displayName = userName || '사용자';

    return (
      <EmptyState
        icon={LockIcon}
        size={compact ? 'sm' : 'md'}
        message={
          isOwnProfile
            ? '인바디 정보가 비공개예요'
            : `${displayName}님이 인바디를 공유하지 않았어요`
        }
        hint={isOwnProfile ? '프로필 편집에서 정보 공개를 설정할 수 있어요' : undefined}
        variant="private"
      />
    );
  };

  // 데이터 없음 상태 렌더링
  const renderEmptyState = () => (
    <EmptyState
      icon={ScalesIcon}
      size={compact ? 'sm' : 'md'}
      message={isOwnProfile ? '인바디 기록이 없어요' : '인바디 기록이 없어요'}
      hint={isOwnProfile ? '관리에서 인바디 기록을 추가해보세요' : undefined}
    />
  );

  // 데이터 표시 렌더링
  const renderDataState = () => (
    <>
      <div className="grid grid-cols-3 gap-3">
        {INBODY_METRICS.map(({ key, label, unit }) => (
          <MetricItem
            key={key}
            label={label}
            value={latest?.[key]}
            unit={unit}
          />
        ))}
      </div>

    </>
  );

  // 타인 프로필에서 카드 클릭 시 상세보기
  const handleCardClick = () => {
    if (!isOwnProfile && canViewData && latest) {
      setSelectedRecord(latest);
    }
  };

  // 타인 프로필에서만 클릭 가능
  const isClickable = !isOwnProfile && canViewData && !!latest;

  const content = (
    <div
      className={isClickable ? 'cursor-pointer' : ''}
      onClick={isClickable ? handleCardClick : undefined}
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !canViewData ? (
        renderPrivateState()
      ) : !latest ? (
        renderEmptyState()
      ) : (
        renderDataState()
      )}
    </div>
  );

  return (
    <>
      {renderHeader ? (
        <div className="space-y-3">
          <SectionHeader
            title="인바디 정보"
            action={isOwnProfile ? { label: '관리', href: '/profile/inbody' } : undefined}
          />
          <div className="bg-muted/20 rounded-2xl p-4">
            {content}
          </div>
        </div>
      ) : (
        content
      )}

      {selectedRecord && (
        <InBodyDetailModal
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
          record={selectedRecord}
        />
      )}
    </>
  );
}
