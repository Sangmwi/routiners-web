'use client';

import { use, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/common/PageHeader';
import { QueryErrorBoundary } from '@/components/common/QueryErrorBoundary';
import { useShowError } from '@/lib/stores/errorStore';
import {
  MealCard,
  NutritionSummary,
  EventStatusBadge,
  EventActionButtons,
} from '@/components/routine';
import {
  useRoutineEventByDateSuspense,
  useCompleteRoutineEvent,
  useSkipRoutineEvent,
} from '@/hooks/routine';
import { SparkleIcon } from '@phosphor-icons/react';
import { PulseLoader } from '@/components/ui/PulseLoader';
import { getEventConfig } from '@/lib/config/theme';
import Button from '@/components/ui/Button';
import type { MealData } from '@/lib/types/meal';
import { formatKoreanDate } from '@/lib/utils/dateHelpers';

// ============================================================
// Type Guard
// ============================================================

function isMealData(data: unknown): data is MealData {
  return (
    data !== null &&
    typeof data === 'object' &&
    'meals' in data &&
    Array.isArray((data as MealData).meals)
  );
}

// ============================================================
// Content Component (Suspense 내부)
// ============================================================

function MealContent({ date }: { date: string }) {
  const router = useRouter();
  const showError = useShowError();

  // Suspense 버전 - { data } 구조분해 (null 가능)
  const { data: event } = useRoutineEventByDateSuspense(date, 'meal');

  // 완료/건너뛰기 뮤테이션
  const completeEvent = useCompleteRoutineEvent();
  const skipEvent = useSkipRoutineEvent();

  // 날짜 포맷 & 이벤트 설정
  const formattedDate = formatKoreanDate(date, { weekday: true });
  const eventConfig = getEventConfig('meal');

  // 완료 처리
  const handleComplete = () => {
    if (!event) return;
    completeEvent.mutate(event.id, {
      onError: () => showError('식단 완료에 실패했습니다'),
    });
  };

  // 건너뛰기 처리
  const handleSkip = () => {
    if (!event) return;
    skipEvent.mutate(event.id, {
      onError: () => showError('식단 스킵에 실패했습니다'),
    });
  };

  // 이벤트 없음 - 플레이스홀더 표시
  if (!event) {
    return (
      <>
        <PageHeader title={eventConfig.description} />

        <div className="flex flex-col items-center justify-center gap-6 p-8 mt-12">
          {/* 아이콘 */}
          <div className="relative">
            <div className={`w-24 h-24 rounded-full ${eventConfig.bgColor} flex items-center justify-center`}>
              <eventConfig.icon size={48} className={eventConfig.color} />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center">
              <SparkleIcon size={16} className="text-white" weight="fill" />
            </div>
          </div>

          {/* 텍스트 */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">{formattedDate}</p>
            <h2 className="text-xl font-bold text-foreground">
              이 날짜에 예정된 식단이 없습니다
            </h2>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              AI 영양사와 대화하여 맞춤형 식단을 생성해보세요.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/routine')}>
              돌아가기
            </Button>
            <Button onClick={() => router.push('/routine/coach')}>
              AI와 대화하기
            </Button>
          </div>
        </div>
      </>
    );
  }

  // 식단 데이터 확인
  const mealData = isMealData(event.data) ? event.data : null;

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
              <h1 className="text-xl font-bold text-foreground">{event.title}</h1>
              {event.rationale && (
                <p className="text-sm text-muted-foreground mt-1">
                  {event.rationale}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* 영양소 요약 */}
        {mealData && <NutritionSummary data={mealData} />}

        {/* 식사 목록 */}
        {mealData && mealData.meals.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground">
              식사 목록 ({mealData.meals.length}끼)
            </h2>
            <div className="space-y-3">
              {mealData.meals.map((meal, index) => (
                <MealCard
                  key={`${meal.type}-${index}`}
                  meal={meal}
                  isCompleted={event.status === 'completed'}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-muted/50 rounded-xl p-6 text-center">
            <p className="text-muted-foreground">상세 식단 정보가 없습니다.</p>
          </div>
        )}

        {/* 추가 정보 */}
        {mealData?.notes && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">
              메모
            </h3>
            <p className="text-foreground">{mealData.notes}</p>
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
  const eventConfig = getEventConfig('meal');
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

interface MealClientProps {
  params: Promise<{ date: string }>;
}

export default function MealClient({ params }: MealClientProps) {
  const { date } = use(params);

  return (
    <div className="min-h-screen bg-background pb-32">
      <QueryErrorBoundary>
        <Suspense fallback={<LoadingFallback />}>
          <MealContent date={date} />
        </Suspense>
      </QueryErrorBoundary>
    </div>
  );
}
