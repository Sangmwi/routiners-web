/**
 * Tool Utils
 *
 * AI Tool Executor 공통 유틸리티 함수
 * - 날짜 계산, 포맷팅
 * - 충돌 체크
 * - 에러 핸들링
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { formatDate } from '@/lib/utils/dateHelpers';

// Re-export formatDate for backward compatibility
export { formatDate };

// =============================================================================
// Types
// =============================================================================

/**
 * 이벤트 충돌 정보 (routine/meal 공통)
 */
export interface EventConflict {
  date: string; // YYYY-MM-DD
  existingTitle: string;
}

/**
 * 날짜 계산에 필요한 미리보기 데이터 구조
 */
interface PreviewWeekDay {
  dayOfWeek: number; // 1=월, 2=화, ..., 7=일
}

interface PreviewWeek {
  weekNumber: number;
  days: PreviewWeekDay[];
}

interface PreviewDataWithWeeks {
  weeks: PreviewWeek[];
}

/**
 * 충돌 체크 컨텍스트
 */
export interface ConflictCheckContext {
  userId: string;
  supabase: SupabaseClient;
}

// =============================================================================
// Date Utilities
// =============================================================================

/**
 * 생년월일로 나이 계산
 */
export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

/**
 * 다음 월요일 날짜 계산
 * @deprecated Phase 11: getRoutineStartDate 사용 권장
 */
export function getNextMonday(): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일, 1=월, ..., 6=토
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek);
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday;
}

/**
 * Phase 11: 루틴 시작일 계산
 * - 오늘부터 가장 가까운 targetDaysOfWeek 중 하나 반환
 * - dayOfWeek: 1=월, 2=화, ..., 7=일 (루틴 데이터 형식)
 *
 * @param targetDaysOfWeek 루틴에 포함된 요일들 (1=월 ~ 7=일)
 * @returns 첫 매칭 요일의 Date 객체
 *
 * @example
 * // 오늘이 화요일이고 루틴이 월/수/금일 때 → 수요일 반환
 * getRoutineStartDate([1, 3, 5])
 */
export function getRoutineStartDate(targetDaysOfWeek: number[]): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayDow = today.getDay(); // JS: 0=일, 1=월, ..., 6=토

  // 루틴 dayOfWeek(1~7)를 JS dayOfWeek(0~6)로 변환
  const jsDays = targetDaysOfWeek.map(d => d % 7); // 7(일) → 0

  // 오늘 포함해서 가장 가까운 매칭 요일 찾기
  for (let offset = 0; offset <= 6; offset++) {
    const checkDow = (todayDow + offset) % 7;
    if (jsDays.includes(checkDow)) {
      const result = new Date(today);
      result.setDate(today.getDate() + offset);
      return result;
    }
  }

  return today; // fallback (이론상 도달 불가)
}

/**
 * Phase 11: 특정 날짜가 속한 주의 월요일 반환
 */
export function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일, 1=월, ..., 6=토
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
}

/**
 * 미리보기 데이터에서 적용될 날짜 목록 계산
 *
 * Phase 11: 오늘부터 첫 매칭 요일 기준으로 계산
 *
 * @param previewData 미리보기 데이터
 * @param weekCount 적용할 주차 수 (기본: 전체 주차)
 */
export function calculatePreviewDates(
  previewData: PreviewDataWithWeeks,
  weekCount?: number
): string[] {
  const dates: string[] = [];

  // 적용할 주차 제한
  const weeksToApply = weekCount
    ? previewData.weeks.slice(0, weekCount)
    : previewData.weeks;

  if (weeksToApply.length === 0 || weeksToApply[0].days.length === 0) {
    return dates;
  }

  // 루틴에 포함된 모든 요일 추출 (첫 주 기준)
  const targetDays = weeksToApply[0].days.map(d => d.dayOfWeek);

  // 오늘부터 첫 매칭 요일
  const startDate = getRoutineStartDate(targetDays);
  // 시작일이 속한 주의 월요일
  const baseMonday = getMondayOfWeek(startDate);

  for (const week of weeksToApply) {
    for (const day of week.days) {
      const weekOffset = week.weekNumber - 1;
      const dayOffset = day.dayOfWeek - 1; // dayOfWeek: 1=월 → 0

      const targetDate = new Date(baseMonday);
      targetDate.setDate(baseMonday.getDate() + weekOffset * 7 + dayOffset);

      // 오늘 이전 날짜는 제외
      if (targetDate >= startDate) {
        dates.push(formatDate(targetDate));
      }
    }
  }

  return dates;
}

// =============================================================================
// Conflict Check
// =============================================================================

type EventType = 'workout' | 'meal';

/**
 * 이벤트 날짜 충돌 체크 (routine/meal 공통)
 *
 * @param ctx - 사용자 컨텍스트
 * @param previewData - 미리보기 데이터 (weeks 포함)
 * @param eventType - 이벤트 타입 ('workout' | 'meal')
 * @returns 충돌 목록
 */
export async function checkEventDateConflicts(
  ctx: ConflictCheckContext,
  previewData: PreviewDataWithWeeks,
  eventType: EventType
): Promise<EventConflict[]> {
  const dates = calculatePreviewDates(previewData);

  if (dates.length === 0) {
    return [];
  }

  const { data: existingEvents, error } = await ctx.supabase
    .from('routine_events')
    .select('date, title')
    .eq('user_id', ctx.userId)
    .eq('type', eventType)
    .in('date', dates);

  if (error) {
    console.error(`[checkEventDateConflicts:${eventType}] Error:`, error);
    return []; // 에러 시 충돌 없음으로 처리 (안전하게)
  }

  if (!existingEvents || existingEvents.length === 0) {
    return [];
  }

  return existingEvents.map((event) => ({
    date: event.date,
    existingTitle: event.title,
  }));
}

// =============================================================================
// Error Handling
// =============================================================================

/**
 * 도구 실행 에러 핸들러
 *
 * @param error - 발생한 에러
 * @param toolName - 도구 이름 (로깅용)
 * @returns 표준화된 에러 결과
 */
export function handleToolError(
  error: unknown,
  toolName: string
): { success: false; error: string } {
  console.error(`[${toolName}] Error:`, error);
  return {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
  };
}
