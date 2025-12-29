'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Activity, Scale, Percent, ChevronRight, TrendingUp, TrendingDown, Lock } from 'lucide-react';
import { useInBodySummary, useUserInBodySummary } from '@/hooks/inbody';
import { InBodyDetailModal } from '@/components/inbody';
import { InBodyRecord } from '@/lib/types';

interface ProfileInbodySectionProps {
  showInbodyPublic?: boolean;
  /** 내 프로필인지 여부 */
  isOwnProfile?: boolean;
  /** 프로필 소유자 이름 (타인 프로필에서 사용) */
  userName?: string;
  /** 프로필 소유자 ID (타인 프로필에서 사용) */
  userId?: string;
}

export default function ProfileInbodySection({
  showInbodyPublic = true,
  isOwnProfile = false,
  userName,
  userId,
}: ProfileInbodySectionProps) {
  const router = useRouter();

  // 내 프로필: useInBodySummary, 타인 프로필: useUserInBodySummary
  const ownSummaryQuery = useInBodySummary({
    enabled: isOwnProfile,
  });

  const otherSummaryQuery = useUserInBodySummary(userId, {
    enabled: !isOwnProfile && !!userId,
  });

  // 사용할 데이터 선택
  const { data: summary, isLoading } = isOwnProfile ? ownSummaryQuery : otherSummaryQuery;

  // 비공개 여부 (API 응답에서 확인)
  const isPrivate = summary?.isPrivate ?? !showInbodyPublic;
  const canViewData = !isPrivate || isOwnProfile;

  // 모달 상태 (타인 프로필에서만 사용 - 상세보기만)
  const [selectedRecord, setSelectedRecord] = useState<InBodyRecord | null>(null);

  const latest = summary?.latest;
  const changes = summary?.changes;
  const totalRecords = summary?.totalRecords ?? 0;

  // 변화량 표시 헬퍼
  const renderChange = (value: number | undefined, unit: string, inverse = false) => {
    if (value === undefined || value === 0) return null;

    const isPositive = inverse ? value < 0 : value > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
    const displayValue = Math.abs(value);

    return (
      <span className={`inline-flex items-center gap-0.5 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {displayValue}{unit}
      </span>
    );
  };


  // 비공개 상태 렌더링
  const renderPrivateState = () => {
    const displayName = userName || '사용자';

    return (
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <Lock className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {isOwnProfile
            ? '인바디 정보가 비공개 상태입니다'
            : `아직 ${displayName}님이 인바디 정보를 공유하지 않았어요`
          }
        </p>
        {isOwnProfile && (
          <p className="text-xs text-muted-foreground/70 mt-1">
            탭하여 공개 설정을 변경할 수 있어요
          </p>
        )}
      </div>
    );
  };

  // 데이터 없음 상태 렌더링
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-6 text-center">
      <Scale className="w-8 h-8 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground">
        {isOwnProfile
          ? '아직 등록된 인바디 기록이 없어요'
          : '등록된 인바디 기록이 없습니다'
        }
      </p>
      {isOwnProfile && (
        <p className="text-xs text-muted-foreground/70 mt-1">
          탭하여 인바디 기록을 추가해보세요
        </p>
      )}
    </div>
  );

  // 데이터 표시 렌더링
  const renderDataState = () => (
    <>
      <div className="grid grid-cols-3 gap-4">
        {/* Weight */}
        <div className="flex flex-col items-center gap-2">
          <Scale className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">체중</p>
            <p
              className={`text-sm font-semibold ${
                !latest?.weight ? 'text-muted-foreground' : 'text-card-foreground'
              }`}
            >
              {latest?.weight ? `${latest.weight}kg` : '-'}
            </p>
            {renderChange(changes?.weight, 'kg', true)}
          </div>
        </div>

        {/* Muscle Mass */}
        <div className="flex flex-col items-center gap-2">
          <Activity className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">골격근량</p>
            <p
              className={`text-sm font-semibold ${
                !latest?.skeletalMuscleMass
                  ? 'text-muted-foreground'
                  : 'text-card-foreground'
              }`}
            >
              {latest?.skeletalMuscleMass
                ? `${latest.skeletalMuscleMass}kg`
                : '-'}
            </p>
            {renderChange(changes?.skeletalMuscleMass, 'kg')}
          </div>
        </div>

        {/* Body Fat Percentage */}
        <div className="flex flex-col items-center gap-2">
          <Percent className="w-5 h-5 text-muted-foreground" />
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">체지방률</p>
            <p
              className={`text-sm font-semibold ${
                !latest?.bodyFatPercentage
                  ? 'text-muted-foreground'
                  : 'text-card-foreground'
              }`}
            >
              {latest?.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : '-'}
            </p>
            {renderChange(changes?.bodyFatPercentage, '%', true)}
          </div>
        </div>
      </div>

      {/* 변화 기간 표시 */}
      {changes?.periodDays && (
        <p className="text-center text-xs text-muted-foreground mt-3">
          {changes.periodDays}일 전 대비 변화
        </p>
      )}

      {/* 기록 보기 버튼 */}
      {totalRecords > 0 && (
        <div className="flex items-center justify-center gap-1 mt-3 text-xs text-muted-foreground">
          <span>총 {totalRecords}개의 기록</span>
          <ChevronRight className="w-3 h-3" />
        </div>
      )}
    </>
  );

  // 카드 클릭 가능 여부
  const isClickable = canViewData && (isOwnProfile || totalRecords > 0);

  // 클릭 핸들러 - 내 프로필이면 페이지 이동, 타인이면 상세 모달
  const handleCardClick = () => {
    if (!isClickable) return;

    if (isOwnProfile) {
      router.push('/profile/inbody');
    } else if (latest) {
      // 타인 프로필: 최신 기록 상세보기
      setSelectedRecord(latest);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-card-foreground">인바디 정보</h2>

        <div
          className={`rounded-[20px] bg-card p-4 shadow-sm border border-border/50 transition-colors ${
            isClickable ? 'cursor-pointer hover:bg-card/80' : ''
          }`}
          onClick={handleCardClick}
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
