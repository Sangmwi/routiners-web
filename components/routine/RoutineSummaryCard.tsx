'use client';

import { ReactNode } from 'react';
import { CheckIcon, ClockIcon } from '@phosphor-icons/react';
import { NextIcon } from '@/components/ui/icons';
import type { EventStatus, EventType } from '@/lib/types/routine';

interface RoutineSummaryCardProps {
  /** 카드 타입 (스타일링 결정) */
  type: EventType;
  /** 카드 제목 */
  title: string;
  /** 부제목/설명 */
  subtitle?: string;
  /** 진행률 */
  progress?: {
    completed: number;
    total: number;
  };
  /** 현재 상태 */
  status?: EventStatus;
  /** 아이콘 */
  icon: ReactNode;
  /** 클릭 핸들러 */
  onClick?: () => void;
  /** 로딩 상태 */
  isLoading?: boolean;
  /** 빈 상태 - 예정된 이벤트 없음 */
  isEmpty?: boolean;
  /** 빈 상태 메시지 */
  emptyMessage?: string;
}

const typeStyles = {
  workout: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    progressBg: 'bg-primary',
    progressTrack: 'bg-primary/20',
    activeBorder: 'border-primary/30',
  },
  meal: {
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    progressBg: 'bg-primary',
    progressTrack: 'bg-primary/20',
    activeBorder: 'border-primary/30',
  },
};

/**
 * 루틴 요약 카드 컴포넌트
 *
 * 운동/식단 루틴의 진행 상태를 표시하는 카드
 * - 진행률 바 표시
 * - 완료 시 체크 아이콘
 * - 빈 상태 처리
 */
export default function RoutineSummaryCard({
  type,
  title,
  subtitle,
  progress,
  status,
  icon,
  onClick,
  isLoading = false,
  isEmpty = false,
  emptyMessage = '예정된 일정이 없습니다',
}: RoutineSummaryCardProps) {
  const styles = typeStyles[type];
  const progressPercent = progress
    ? Math.round((progress.completed / progress.total) * 100)
    : 0;
  const isCompleted = status === 'completed';

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="animate-pulse flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-3 bg-muted rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  // 빈 상태
  if (isEmpty) {
    return (
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center`}
          >
            <div className={styles.iconColor}>{icon}</div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`w-full bg-card border rounded-xl p-4 text-left transition-all hover:shadow-md active:scale-[0.99] ${
        isCompleted ? `${styles.activeBorder} bg-opacity-50` : 'border-border'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* 아이콘 */}
        <div
          className={`w-12 h-12 rounded-xl ${styles.iconBg} flex items-center justify-center shrink-0`}
        >
          {isCompleted ? (
            <CheckIcon size={24} weight="bold" className={styles.iconColor} />
          ) : (
            <div className={styles.iconColor}>{icon}</div>
          )}
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground truncate">{title}</h3>
            {status === 'scheduled' && (
              <ClockIcon size={16} weight="bold" className="text-muted-foreground shrink-0" />
            )}
          </div>

          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}

          {/* 진행률 바 */}
          {progress && progress.total > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className={`flex-1 h-1.5 rounded-full ${styles.progressTrack}`}>
                <div
                  className={`h-full rounded-full ${styles.progressBg} transition-all`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {progress.completed}/{progress.total}
              </span>
            </div>
          )}
        </div>

        <NextIcon size="md" weight="emphasis" className="text-muted-foreground shrink-0" />
      </div>
    </button>
  );
}
