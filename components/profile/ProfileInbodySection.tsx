'use client';

import { useState } from 'react';
import { useInBodySummarySuspense, useUserInBodySummarySuspense } from '@/hooks/inbody';
import { EMPTY_STATE } from '@/lib/config/theme';
import { InBodyDetailModal } from '@/components/inbody';
import { MetricsGrid } from '@/components/inbody/MetricsGrid';
import { InBodyRecord, InBodySummary } from '@/lib/types';
import SectionHeader from '@/components/ui/SectionHeader';
import EmptyState from '@/components/common/EmptyState';
import Surface from '@/components/ui/Surface';

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

export default function ProfileInbodySection({
  isOwnProfile = false,
  userName,
  userId,
  renderHeader = true,
}: ProfileInbodySectionProps) {
  return isOwnProfile
    ? <OwnInbodyData userName={userName} renderHeader={renderHeader} />
    : <OtherInbodyData userId={userId!} userName={userName} renderHeader={renderHeader} />;
}

function OwnInbodyData({ userName, renderHeader }: { userName?: string; renderHeader: boolean }) {
  const { data: summary } = useInBodySummarySuspense();
  return <InbodyDisplay summary={summary} isOwnProfile userName={userName} renderHeader={renderHeader} />;
}

function OtherInbodyData({ userId, userName, renderHeader }: { userId: string; userName?: string; renderHeader: boolean }) {
  const { data: summary } = useUserInBodySummarySuspense(userId);
  return <InbodyDisplay summary={summary} isOwnProfile={false} userName={userName} renderHeader={renderHeader} />;
}

// ============================================================
// Shared Display Component
// ============================================================

interface InbodyDisplayProps {
  summary: InBodySummary;
  isOwnProfile: boolean;
  userName?: string;
  renderHeader: boolean;
}

function InbodyDisplay({ summary, isOwnProfile, userName, renderHeader }: InbodyDisplayProps) {
  // 비공개 여부 (API 응답에서 확인)
  const isPrivate = summary?.isPrivate ?? false;
  const canViewData = !isPrivate || isOwnProfile;

  // 모달 상태 (타인 프로필에서만 사용 - 상세보기만)
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const latest = summary?.latest;
  const compact = !renderHeader;

  // 비공개 상태 렌더링
  const renderPrivateState = () => {
    const displayName = userName || '사용자';

    return (
      <EmptyState
        {...EMPTY_STATE.inbody.private}
        size="sm"
        message={
          isOwnProfile
            ? EMPTY_STATE.inbody.private.message
            : `${displayName}님이 인바디를 공유하지 않았어요`
        }
        hint={isOwnProfile ? EMPTY_STATE.inbody.private.hint : undefined}
      />
    );
  };

  // 데이터 없음 상태 렌더링
  const renderEmptyState = () => (
    <EmptyState
      {...EMPTY_STATE.inbody.noRecord}
      size="sm"
      hint={isOwnProfile ? '관리에서 인바디 기록을 추가해보세요' : undefined}
      action={isOwnProfile ? { label: '등록하기', href: '/profile/inbody' } : undefined}
    />
  );

  // 데이터 표시 렌더링 — 메트릭 그리드 (헤더는 ProfileInfoTab의 BodyCompositionSummary에서 처리)
  const renderDataState = () => (
    <MetricsGrid data={latest} />
  );

  // 타인 프로필에서 카드 클릭 시 상세보기
  const handleCardClick = () => {
    if (!isOwnProfile && canViewData && latest) {
      setSelectedRecord(latest);
      setIsModalOpen(true);
    }
  };

  // 타인 프로필에서만 클릭 가능
  const isClickable = !isOwnProfile && canViewData && !!latest;

  const content = (
    <div
      className={isClickable ? 'cursor-pointer' : ''}
      onClick={isClickable ? handleCardClick : undefined}
    >
      {!canViewData ? (
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
          <Surface rounded="2xl">
            {content}
          </Surface>
        </div>
      ) : (
        content
      )}

      <InBodyDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        record={selectedRecord}
      />
    </>
  );
}
