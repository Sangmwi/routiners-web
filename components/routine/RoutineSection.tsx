'use client';

import SectionHeader from '@/components/ui/SectionHeader';
import RoutineEventCarousel from './RoutineEventCarousel';
import type { RoutineEvent, EventType } from '@/lib/types/routine';

interface RoutineSectionProps {
  /** 이벤트 타입 */
  type: EventType;
  /** 이벤트 목록 */
  events: RoutineEvent[];
  /** 로딩 상태 */
  isLoading?: boolean;
}

// 타입별 설정
const typeConfig = {
  workout: {
    title: '운동',
    calendarPath: '/routine/calendar?type=workout',
  },
  meal: {
    title: '식단',
    calendarPath: '/routine/calendar?type=meal',
  },
};

/**
 * 루틴 섹션 컴포넌트
 *
 * - SectionHeader (타입별 제목 + 전체보기 버튼)
 * - RoutineEventCarousel (가로 스크롤 캐러셀)
 *
 * @example
 * <RoutineSection
 *   type="workout"
 *   events={workoutEvents}
 *   isLoading={isLoading}
 * />
 */
export default function RoutineSection({
  type,
  events,
  isLoading = false,
}: RoutineSectionProps) {
  const config = typeConfig[type];

  return (
    <section className="space-y-3">
      <SectionHeader
        title={config.title}
        action={{
          label: '전체보기',
          href: config.calendarPath,
        }}
        size="lg"
      />
      <RoutineEventCarousel
        type={type}
        events={events}
        isLoading={isLoading}
      />
    </section>
  );
}
