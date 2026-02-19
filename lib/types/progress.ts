/**
 * Progress Types
 *
 * 3대 운동 추이 등 운동 진행 현황 관련 타입 정의
 */

// ============================================================================
// Big 3 Lifts (스쿼트, 벤치프레스, 데드리프트)
// ============================================================================

/**
 * 특정 시점의 3대 운동 데이터 포인트
 */
export interface Big3DataPoint {
  /** 날짜 (YYYY-MM-DD) */
  date: string;
  /** 스쿼트 최대 중량 (kg), 기록 없으면 null */
  squat: number | null;
  /** 벤치프레스 최대 중량 (kg), 기록 없으면 null */
  bench: number | null;
  /** 데드리프트 최대 중량 (kg), 기록 없으면 null */
  deadlift: number | null;
  /** 3대 합계 (kg) - 각 종목의 최신 최대중량 합산 */
  total: number;
}

/**
 * 3대 운동 요약 정보
 */
export interface Big3Summary {
  /** 가장 최근 데이터 포인트 */
  latest: Big3DataPoint | null;
  /** 시계열 데이터 (시간순, 스파크라인용) */
  history: Big3DataPoint[];
  /** 직전 기록 대비 변화량 */
  changes: {
    squat: number;
    bench: number;
    deadlift: number;
    total: number;
  } | null;
}

// ============================================================================
// Progress Summary (홈 대시보드용)
// ============================================================================

/**
 * 운동 진행 현황 요약
 */
export interface ProgressSummary {
  big3: Big3Summary;
}
