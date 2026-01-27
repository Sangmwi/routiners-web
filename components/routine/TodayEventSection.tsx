'use client';

import { useRouter } from 'next/navigation';
import { RoutineEvent, WorkoutData } from '@/lib/types/routine';
import { CheckIcon, SkipForwardIcon, PlayIcon } from '@phosphor-icons/react';
import { NextIcon } from '@/components/ui/icons';
import Button from '@/components/ui/Button';
import { getEventIcon, getStatusConfig } from '@/lib/config/eventTheme';

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

interface TodayEventSectionProps {
  event: RoutineEvent | null;
  isLoading?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  isActionLoading?: boolean;
}

/**
 * 오늘의 운동 섹션
 */
export default function TodayEventSection({
  event,
  isLoading = false,
  onComplete,
  onSkip,
  isActionLoading = false,
}: TodayEventSectionProps) {
  const router = useRouter();
  const today = new Date().toISOString().split('T')[0];

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-20 bg-muted rounded" />
        </div>
      </div>
    );
  }

  // 이벤트 없음
  if (!event) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-4">오늘의 운동</h2>
        <div className="text-center py-6">
          {(() => {
            const Icon = getEventIcon('workout');
            return (
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center mb-3">
                <Icon className="w-8 h-8 text-muted-foreground" />
              </div>
            );
          })()}
          <p className="text-muted-foreground mb-4">
            오늘 예정된 운동이 없습니다.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/routine/coach')}
          >
            AI 트레이너와 루틴 만들기
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = {
    scheduled: {
      label: '오늘 할 운동',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary/20',
    },
    completed: {
      label: '운동 완료!',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      borderColor: 'border-primary/30',
    },
    skipped: {
      label: '건너뜀',
      bgColor: 'bg-muted',
      textColor: 'text-muted-foreground',
      borderColor: 'border-border',
    },
  };

  const status = statusConfig[event.status];
  const workoutData = isWorkoutData(event.data) ? event.data : null;
  const exerciseCount = workoutData?.exercises?.length ?? 0;

  return (
    <div className={`bg-card border ${status.borderColor} rounded-xl overflow-hidden`}>
      {/* 상태 배너 */}
      <div className={`${status.bgColor} px-4 py-2`}>
        <span className={`text-sm font-medium ${status.textColor}`}>
          {status.label}
        </span>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="p-4">
        <button
          onClick={() => router.push(`/routine/${today}`)}
          className="w-full flex items-center gap-4 text-left"
        >
          {/* 아이콘 */}
          <div className={`w-14 h-14 rounded-xl ${status.bgColor} flex items-center justify-center flex-shrink-0`}>
            {event.status === 'completed' ? (
              <CheckIcon size={28} weight="bold" className="text-primary" />
            ) : event.status === 'skipped' ? (
              <SkipForwardIcon size={28} weight="bold" className="text-muted-foreground" />
            ) : (
              (() => {
                const Icon = getEventIcon('workout');
                return <Icon className="w-7 h-7 text-primary" />;
              })()
            )}
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-foreground truncate">
              {event.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {exerciseCount}개 운동
              {workoutData?.estimatedDuration && (
                <> • 약 {workoutData.estimatedDuration}분</>
              )}
            </p>
          </div>

          <NextIcon size="md" weight="emphasis" className="text-muted-foreground flex-shrink-0" />
        </button>

        {/* 액션 버튼 (scheduled 상태일 때만) */}
        {event.status === 'scheduled' && onComplete && onSkip && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={onSkip}
              disabled={isActionLoading}
              className="flex-1"
            >
              <SkipForwardIcon size={16} weight="bold" />
              건너뛰기
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onComplete}
              isLoading={isActionLoading}
              className="flex-1"
            >
              <PlayIcon size={16} weight="fill" />
              시작하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
