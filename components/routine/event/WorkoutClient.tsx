'use client';

import { use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
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
import { PulseLoader } from '@/components/ui/PulseLoader';
import { getEventConfig } from '@/lib/config/theme';
import Button from '@/components/ui/Button';
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

function WorkoutContent({ date }: { date: string }) {
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
      <>
        <PageHeader title={eventConfig.description} />
        <div className="flex flex-col items-center justify-center gap-6 p-8 mt-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <CalendarIcon size={40} className="text-muted-foreground" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-lg font-bold text-foreground">{formattedDate}</h2>
            <p className="text-muted-foreground text-sm">
              이 날짜에 예정된 운동이 없습니다.
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/routine')}>
            캘린더로 돌아가기
          </Button>
        </div>
      </>
    );
  }

  // 운동 데이터 확인
  const workoutData = isWorkoutData(event.data) ? event.data : null;

  return (
    <>
      <PageHeader title={eventConfig.description} />

      <div className="p-4 space-y-6">
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
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 bg-background border-t border-border">
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

// ============================================================
// Loading Fallback
// ============================================================

function LoadingFallback() {
  const eventConfig = getEventConfig('workout');
  return (
    <>
      <PageHeader title={eventConfig.description} />
      <PulseLoader />
    </>
  );
}

// ============================================================
// Main Export
// ============================================================

interface WorkoutClientProps {
  params: Promise<{ date: string }>;
}

export default function WorkoutClient({ params }: WorkoutClientProps) {
  const { date } = use(params);

  return (
    <div className="min-h-screen bg-background pb-32">
      <QueryErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <WorkoutContent date={date} />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  );
}
