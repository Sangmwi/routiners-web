/**
 * Tool Utils
 *
 * AI Tool Executor 공통 유틸리티 함수
 * - 날짜 계산, 포맷팅
 * - 충돌 체크
 * - 에러 핸들링
 */

import { SupabaseClient } from '@supabase/supabase-js';

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
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 미리보기 데이터에서 적용될 날짜 목록 계산
 */
export function calculatePreviewDates(previewData: PreviewDataWithWeeks): string[] {
  const nextMonday = getNextMonday();
  const dates: string[] = [];

  for (const week of previewData.weeks) {
    for (const day of week.days) {
      const weekOffset = week.weekNumber - 1;
      const dayOffset = day.dayOfWeek - 1;

      const targetDate = new Date(nextMonday);
      targetDate.setDate(targetDate.getDate() + weekOffset * 7 + dayOffset);
      dates.push(formatDate(targetDate));
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
