'use client';

import { useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EventCarouselCard from './EventCarouselCard';
import type { RoutineEvent, EventType } from '@/lib/types/routine';

interface RoutineEventCarouselProps {
  /** 이벤트 타입 */
  type: EventType;
  /** 이벤트 목록 */
  events: RoutineEvent[];
  /** 과거 표시 일수 (기본 7일) */
  pastDays?: number;
  /** 미래 표시 일수 (기본 14일) */
  futureDays?: number;
  /** 로딩 상태 */
  isLoading?: boolean;
}

/**
 * 루틴 이벤트 캐러셀
 *
 * - 가로 스크롤 + snap
 * - 과거 N일 + 오늘 + 미래 N일 표시
 * - 초기 로드 시 "어제" 카드로 스크롤 → 오늘이 보이면서 왼쪽 과거 힌트
 * - 이벤트 없는 날은 "쉬는 날" 카드
 * - 오늘/어제/내일 뱃지 표시
 */
export default function RoutineEventCarousel({
  type,
  events,
  pastDays = 7,
  futureDays = 14,
  isLoading = false,
}: RoutineEventCarouselProps) {
  const router = useRouter();
  const scrollTargetRef = useRef<HTMLDivElement>(null);

  // 과거 + 오늘 + 미래 날짜 배열 생성
  const dateRange = generateDateRange(events, pastDays, futureDays);

  // 어제 카드로 스크롤 → 오늘이 보이면서 왼쪽에 과거 힌트
  useEffect(() => {
    // 데이터 로딩 후 스크롤 (약간의 지연으로 DOM 렌더링 보장)
    const timer = setTimeout(() => {
      if (scrollTargetRef.current) {
        scrollTargetRef.current.scrollIntoView({
          behavior: 'instant',
          block: 'nearest',
          inline: 'start',
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [dateRange.length]);

  // 로딩 스켈레톤
  if (isLoading) {
    return (
      <div className="-mx-4 px-4">
        <div className="flex gap-3 overflow-hidden py-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="w-[120px] h-[140px] bg-muted rounded-xl animate-pulse shrink-0"
            />
          ))}
        </div>
      </div>
    );
  }

  const handleCardClick = (dateStr: string) => {
    router.push(`/routine/${type}/${dateStr}`);
  };

  return (
    <div className="-mx-4 px-4">
      <div
        className="flex gap-3 overflow-x-scroll py-2 snap-x snap-mandatory scrollbar-hide"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {dateRange.map(
          ({ date, isToday, isYesterday, isTomorrow, isScrollTarget, event }) => (
            <div
              key={date}
              ref={isScrollTarget ? scrollTargetRef : null}
              className="shrink-0 snap-start"
            >
              <EventCarouselCard
                event={event}
                date={date}
                type={type}
                isToday={isToday}
                isYesterday={isYesterday}
                isTomorrow={isTomorrow}
                onClick={() => handleCardClick(date)}
              />
            </div>
          )
        )}
        {/* 오른쪽 끝 여백 */}
        <div className="shrink-0 w-1" aria-hidden="true" />
      </div>
    </div>
  );
}

// ============================================================================
// Types & Helpers
// ============================================================================

interface DateSlot {
  date: string;
  isToday: boolean;
  isYesterday: boolean;
  isTomorrow: boolean;
  isScrollTarget: boolean;
  event: RoutineEvent | null;
}

// 과거 + 오늘 + 미래 날짜 배열 생성
function generateDateRange(
  events: RoutineEvent[],
  pastDays: number,
  futureDays: number
): DateSlot[] {
  const today = new Date();
  const todayStr = formatDate(today);
  const yesterdayStr = formatDate(addDays(today, -1));
  const tomorrowStr = formatDate(addDays(today, 1));
  const dates: DateSlot[] = [];

  // 과거 날짜들 (pastDays일 전부터)
  for (let i = pastDays; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = formatDate(date);

    dates.push({
      date: dateStr,
      isToday: false,
      isYesterday: dateStr === yesterdayStr,
      isTomorrow: false,
      isScrollTarget: dateStr === yesterdayStr,
      event: events.find((e) => e.date === dateStr) ?? null,
    });
  }

  // 오늘 + 미래 날짜들
  for (let i = 0; i < futureDays; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const dateStr = formatDate(date);

    dates.push({
      date: dateStr,
      isToday: dateStr === todayStr,
      isYesterday: false,
      isTomorrow: dateStr === tomorrowStr,
      isScrollTarget: false,
      event: events.find((e) => e.date === dateStr) ?? null,
    });
  }

  return dates;
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
