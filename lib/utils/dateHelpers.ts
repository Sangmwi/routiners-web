/**
 * Date Helper Utilities
 *
 * 날짜 관련 공통 유틸리티 함수
 */

/**
 * Date 객체를 YYYY-MM-DD 형식의 문자열로 변환
 *
 * @param date - 변환할 Date 객체
 * @returns YYYY-MM-DD 형식 문자열
 *
 * @example
 * formatDate(new Date('2025-01-15')) // '2025-01-15'
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 날짜에 일수를 더하거나 빼기
 *
 * @param date - 기준 Date 객체
 * @param days - 더할 일수 (음수면 빼기)
 * @returns 새로운 Date 객체
 *
 * @example
 * addDays(new Date('2025-01-15'), 7)  // 2025-01-22
 * addDays(new Date('2025-01-15'), -7) // 2025-01-08
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * 오늘 기준 날짜 범위의 시작/종료일 반환
 *
 * @param pastDays - 과거 일수
 * @param futureDays - 미래 일수
 * @returns { startDate, endDate } YYYY-MM-DD 형식
 *
 * @example
 * getDateRange(7, 14) // { startDate: '2025-01-08', endDate: '2025-01-29' }
 */
export function getDateRange(
  pastDays: number,
  futureDays: number
): { startDate: string; endDate: string } {
  const today = new Date();
  return {
    startDate: formatDate(addDays(today, -pastDays)),
    endDate: formatDate(addDays(today, futureDays)),
  };
}

/**
 * YYYY-MM-DD 문자열을 Date 객체로 변환
 *
 * @param dateStr - YYYY-MM-DD 형식 문자열
 * @returns Date 객체
 *
 * @example
 * parseDate('2025-01-15') // Date object
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
 *
 * @returns YYYY-MM-DD 형식 문자열
 *
 * @example
 * getToday() // '2025-01-15'
 */
export function getToday(): string {
  return formatDate(new Date());
}
