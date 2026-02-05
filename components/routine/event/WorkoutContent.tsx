'use client';

import { useRouter } from 'next/navigation';
import EmptyState from '@/components/common/EmptyState';
import { useShowError } from '@/lib/stores/errorStore';
import {
  ExerciseCard,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import {
  useRoutineEventByDateSuspense,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
  useUpdateWorkoutData,
} from '@/hooks/routine';
import type { WorkoutSet, WorkoutData } from '@/lib/types/routine';
import { CalendarIcon } from '@phosphor-icons/react';
import { getEventConfig } from '@/lib/config/theme';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Type Guard
// ============================================================

function isWorkoutData(data: unknown): data is WorkoutData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'exercises' in data &&
    Array.isArray((data as WorkoutData).exercises)
  );
}

// ============================================================
// Content Component (Suspense 내부)
// ============================================================

interface WorkoutContentProps {
  date: string;
}

/**
 * 운동 상세 콘텐츠 (Suspense 내부)
 *
 * - useSuspenseQuery로 운동 이벤트 조회
 * - 상위 page.tsx의 DetailLayout에서 Header + Suspense 처리
 */
export default function WorkoutContent({ date }: WorkoutContentProps) {
  const router = useRouter();
  const showError = useShowError();

  // Suspense 버전 - { data } 구조분해 (null 가능)
  const { data: event } = useRoutineEventByDateSuspense(date, 'workout');

  // 완료/건너뛰기 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();
  const updateWorkout = useUpdateWorkoutData();

  // 날짜 포맷 & 이벤트 설정
  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('workout');

  // 완료 처리
  const handleComplete = () => {
    if (!event) return;
    completeEvent.mutate(event.id, {
      onError: () => showError('운동 완료에 실패했습니다'),
    });
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    if (!event) return;
    skipEvent.mutate(event.id, {
      onError: () => showError('운동 스킵에 실패했습니다'),
    });
  };

  // 세트 변경 처리
  const handleSetsChange = (exerciseId: string, sets: WorkoutSet[]) => {
    if (!event) return;

    const currentData = isWorkoutData(event.data) ? event.data : null;
    if (!currentData) return;

    const updatedExercises = currentData.exercises.map((ex) =>
      ex.id === exerciseId ? { ...ex, sets } : ex
    );

    updateWorkout.mutate(
      { id: event.id, data: { ...currentData, exercises: updatedExercises } },
      { onError: () => showError('운동 기록 저장에 실패했습니다') }
    );
  };

  // 이벤트 없음 (예정된 운동 없음)
  if (!event) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={CalendarIcon}
          message={`${formattedDate}에 예정된 운동이 없습니다`}
          hint="AI 코치와 대화하여 맞춤 운동을 생성해보세요"
          showIconBackground
          size="lg"
          action={{
            label: '돌아가기',
            onClick: () => router.push('/routine'),
          }}
        />
      </div>
    );
  }

  // 운동 데이터 확인
  const workoutData = isWorkoutData(event.data) ? event.data : null;

  return (
    <>
      <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-xl ${eventConfig.bgColor} flex items-center justify-center shrink-0`}>
              <eventConfig.icon size={24} className={eventConfig.color} weight="fill" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground">
                {event.title}
              </h1>
              {event.rationale && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.rationale}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 운동 목록 */}
        {workoutData && workoutData.exercises.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              운동 목록 ({workoutData.exercises.length}개)
            </h2>
            <div className="space-y-3">
              {workoutData.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isCompleted={event.status === 'completed'}
                  editable={event.status === 'scheduled'}
                  onSetsChange={handleSetsChange}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground">
              상세 운동 정보가 없습니다.
            </p>
          </div>
        )}

        {/* 추가 정보 */}
        {workoutData?.notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{workoutData.notes}</p>
          </div>
        )}
      </div>

      {/* 하단 액션 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 pb-safe bg-background border-t border-border">
        <EventActionButtons
          status={event.status}
          onComplete={handleComplete}
          onSkip={handleSkip}
          isLoading={completeEvent.isPending || skipEvent.isPending}
        />
      </div>
    </>
  );
}
