/**
 * Date Helper Utilities
 *
 * 날짜 관련 공통 유틸리티 함수
 */

/**
 * 한국어 날짜 포맷 옵션
 */
export interface FormatKoreanDateOptions {
  /** 년도 포함 (default: true) */
  year?: boolean;
  /** 월 포함 (default: true) */
  month?: boolean;
  /** 일 포함 (default: true) */
  day?: boolean;
  /** 요일 포함 (default: false) */
  weekday?: boolean;
  /** 월 포맷: 'long'='1월', 'short'='1' (default: 'long') */
  monthFormat?: 'long' | 'short';
  /** 요일 포맷: 'long'='수요일', 'short'='(수)' (default: 'long') */
  weekdayFormat?: 'long' | 'short';
}

/**
 * 날짜를 한국어 형식으로 포맷
 *
 * @param date - Date 객체 또는 YYYY-MM-DD 문자열
 * @param options - 포맷 옵션
 * @returns 한국어 날짜 문자열
 *
 * @example
 * formatKoreanDate(new Date()) // "2025년 1월 15일"
 * formatKoreanDate('2025-01-15', { day: false }) // "2025년 1월"
 * formatKoreanDate('2025-01-15', { year: false, weekday: true }) // "1월 15일 수요일"
 * formatKoreanDate('2025-01-15', { year: false, weekday: true, weekdayFormat: 'short' }) // "1월 15일 (수)" 
 * formatKoreanDate('2025-01-15', { weekday: true }) // "2025년 1월 15일 수요일"
 */
export function formatKoreanDate(
  date: Date | string,
  options: FormatKoreanDateOptions = {}
): string {
  const {
    year = true,
    month = true,
    day = true,
    weekday = false,
    monthFormat = 'long',
    weekdayFormat = 'long'
  } = options;

  const d = typeof date === 'string' ? new Date(date) : date;

  const parts: Intl.DateTimeFormatOptions = {};
  if (year) parts.year = 'numeric';
  if (month) parts.month = monthFormat;
  if (day) parts.day = 'numeric';
  if (weekday) parts.weekday = weekdayFormat;

  return d.toLocaleDateString('ko-KR', parts);
}

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

/**
 * 주간 범위 반환 (월요일 ~ 일요일)
 *
 * @param date - 기준 Date 객체 (기본값: 오늘)
 * @returns { startDate, endDate, weekLabel } 주간 범위 정보
 *
 * @example
 * getWeekRange() // { startDate: '2025-01-13', endDate: '2025-01-19', weekLabel: '1월 13일 ~ 1월 19일' }
 */
export function getWeekRange(date: Date = new Date()): {
  startDate: string;
  endDate: string;
  weekLabel: string;
} {
  const day = date.getDay();
  // 월요일을 주의 시작으로 (0=일요일이면 -6, 1=월요일이면 0, ...)
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = addDays(date, diffToMonday);
  const sunday = addDays(monday, 6);

  const startMonth = monday.getMonth() + 1;
  const startDay = monday.getDate();
  const endMonth = sunday.getMonth() + 1;
  const endDay = sunday.getDate();

  return {
    startDate: formatDate(monday),
    endDate: formatDate(sunday),
    weekLabel: `${startMonth}월 ${startDay}일 ~ ${endMonth}월 ${endDay}일`,
  };
}

/**
 * 월간 범위 반환 (1일 ~ 말일)
 *
 * @param year - 연도
 * @param month - 월 (1-12)
 * @returns { startDate, endDate, monthLabel } 월간 범위 정보
 *
 * @example
 * getMonthRange(2026, 2) // { startDate: '2026-02-01', endDate: '2026-02-28', monthLabel: '2026년 2월' }
 */
export function getMonthRange(year: number, month: number): {
  startDate: string;
  endDate: string;
  monthLabel: string;
} {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0); // 다음 달 0일 = 이번 달 마지막 날

  return {
    startDate: formatDate(firstDay),
    endDate: formatDate(lastDay),
    monthLabel: `${year}년 ${month}월`,
  };
}

/**
 * 요일 레이블 반환
 *
 * @param date - Date 객체 또는 YYYY-MM-DD 문자열
 * @returns 요일 레이블 (월, 화, 수, 목, 금, 토, 일)
 */
export function getDayOfWeek(date: Date | string): string {
  const d = typeof date === 'string' ? parseDate(date) : date;
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[d.getDay()];
}
