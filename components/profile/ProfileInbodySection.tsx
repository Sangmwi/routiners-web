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
  showInbodyPublic?: boolean;
  /** 내 프로필인지 여부 */
  isOwnProfile?: boolean;
  /** 프로필 소유자 이름 (타인 프로필에서 사용) */
  userName?: string;
  /** 프로필 소유자 ID (타인 프로필에서 사용) */
  userId?: string;
}

const INBODY_METRICS = [
  { key: 'weight', label: '체중', unit: 'kg', positiveIsGood: false },
  { key: 'skeletalMuscleMass', label: '골격근량', unit: 'kg', positiveIsGood: true },
  { key: 'bodyFatPercentage', label: '체지방률', unit: '%', positiveIsGood: false },
] as const;

export default function ProfileInbodySection({
  showInbodyPublic = true,
  isOwnProfile = false,
  userName,
  userId,
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
  const isPrivate = summary?.isPrivate ?? !showInbodyPublic;
  const canViewData = !isPrivate || isOwnProfile;

  // 모달 상태 (타인 프로필에서만 사용 - 상세보기만)
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);

  const latest = summary?.latest;

  // 비공개 상태 렌더링
  const renderPrivateState = () => {
    const displayName = userName || '사용자';

    return (
      <EmptyState
        icon={LockIcon}
        message={
          isOwnProfile
            ? '인바디 정보가 비공개 상태예요'
            : `아직 ${displayName}님이 인바디 정보를 공유하지 않았어요`
        }
        hint={isOwnProfile ? '상단의 관리 버튼에서 공개 설정을 변경할 수 있어요' : undefined}
        variant="private"
      />
    );
  };

  // 데이터 없음 상태 렌더링
  const renderEmptyState = () => (
    <EmptyState
      icon={ScalesIcon}
      message={
        isOwnProfile
          ? '아직 인바디 기록이 없어요'
          : '인바디 기록이 없어요'
      }
      hint={isOwnProfile ? '상단의 관리 버튼에서 인바디 기록을 추가해보세요' : undefined}
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

  return (
    <>
      <div className="space-y-3">
        <SectionHeader
          title="인바디 정보"
          action={isOwnProfile ? { label: '관리', href: '/profile/inbody' } : undefined}
        />

        <div
          className={`bg-muted/20 rounded-2xl p-4 transition-colors ${
            isClickable ? 'cursor-pointer hover:bg-muted/20' : ''
          }`}
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
      </div>

      {/* Detail Modal - 타인 프로필에서 최신 기록 상세보기 */}
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
