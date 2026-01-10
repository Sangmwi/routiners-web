'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import {
  ExerciseCard,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import {
  useRoutineEventByDate,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
} from '@/hooks/routine';
import { Loader2, Dumbbell, Calendar } from 'lucide-react';
import Button from '@/components/ui/Button';

interface WorkoutDetailPageProps {
  params: Promise<{ date: string }>;
}

/**
 * 운동 루틴 상세 페이지
 *
 * 특정 날짜의 운동 루틴 이벤트를 표시하고
 * 완료/건너뛰기 기능 제공
 */
export default function WorkoutDetailPage({ params }: WorkoutDetailPageProps) {
  const { date } = use(params);
  const router = useRouter();

  // 운동 이벤트 조회
  const {
    data: event,
    isLoading,
    error,
  } = useRoutineEventByDate(date, 'workout');

  // 완료/건너뛰기 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();

  // 날짜 포맷
  const formattedDate = new Date(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  // 완료 처리
  const handleComplete = async () => {
    if (!event) return;
    try {
      await completeEvent.mutateAsync(event.id);
    } catch (err) {
      console.error('Failed to complete event:', err);
    }
  };

  // 건너뛰기 처리
  const handleSkip = async () => {
    if (!event) return;
    try {
      await skipEvent.mutateAsync(event.id);
    } catch (err) {
      console.error('Failed to skip event:', err);
    }
  };

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="운동 루틴" />
        <div className="flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-muted-foreground">
            운동 정보를 불러오는데 실패했습니다.
          </p>
          <Button onClick={() => router.back()}>돌아가기</Button>
        </div>
      </div>
    );
  }

  // 이벤트 없음
  if (!event) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="운동 루틴" />
        <div className="flex flex-col items-center justify-center gap-6 p-8 mt-12">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <Calendar className="w-10 h-10 text-muted-foreground" />
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      <PageHeader title="운동 루틴" />

      <div className="p-4 space-y-6">
        {/* 헤더 섹션 */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-start justify-between mb-3">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center flex-shrink-0">
              <Dumbbell className="w-6 h-6 text-teal-500" />
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
        {event.data && event.data.exercises.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              운동 목록 ({event.data.exercises.length}개)
            </h2>
            <div className="space-y-3">
              {event.data.exercises.map((exercise, index) => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  index={index}
                  isCompleted={event.status === 'completed'}
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
        {event.data?.notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{event.data.notes}</p>
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
    </div>
  );
}
