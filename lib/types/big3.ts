/**
 * Big3 Types
 *
 * 3대운동 (벤치프레스, 데드리프트, 스쿼트) 기록 관련 타입 정의
 * DB 타입(snake_case) ↔ 도메인 타입(camelCase) 변환 포함
 */

import type { Big3LiftType } from '@/lib/data/exercises';

export type { Big3LiftType };

export type Big3RecordSource = 'manual' | 'auto';

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/** DB big3_records 테이블 Row 타입 */
export interface DbBig3Record {
  id: string;
  user_id: string;
  recorded_at: string; // DATE as string
  lift_type: Big3LiftType;
  weight: number;
  reps: number | null;
  rpe: number | null;
  notes: string | null;
  source: Big3RecordSource;
  routine_event_id: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

/** 클라이언트용 Big3 기록 타입 (camelCase) */
export interface Big3Record {
  id: string;
  userId: string;
  recordedAt: string;
  liftType: Big3LiftType;
  weight: number;
  reps?: number;
  rpe?: number;
  notes?: string;
  source: Big3RecordSource;
  routineEventId?: string;
  createdAt: string;
  updatedAt: string;
}

/** Big3 기록 생성용 데이터 (클라이언트 → API) */
export interface Big3CreateData {
  recordedAt: string;
  liftType: Big3LiftType;
  weight: number;
  reps?: number;
  rpe?: number;
  notes?: string;
}

/** Big3 기록 수정용 데이터 (부분 업데이트) */
export type Big3UpdateData = Partial<Big3CreateData>;

// ============================================================================
// Summary Types
// ============================================================================

/** 종목별 요약 */
export interface Big3LiftSummary {
  liftType: Big3LiftType;
  /** 역대 최고 기록 (kg) */
  allTimePr: number | null;
  allTimePrDate: string | null;
  /** 최근 기록 (kg) */
  latest: number | null;
  latestDate: string | null;
  /** 직전 기록 대비 변화 (kg) */
  change: number;
  /** 총 기록 수 */
  totalRecords: number;
}

/** 전체 3대운동 요약 */
export interface Big3RecordsSummary {
  lifts: Big3LiftSummary[];
  /** 합계 (각 종목 최신 기록 합산, kg) */
  latestTotal: number;
  /** 합계 변화량 (kg) */
  totalChange: number;
  /** 전체 기록 수 */
  totalRecords: number;
  /** 시계열 히스토리 (스파크라인용) */
  history?: import('./progress').Big3DataPoint[];
  /** 비공개 상태 여부 (타인 프로필 조회 시) */
  isPrivate?: boolean;
}

// ============================================================================
// Type Transformers
// ============================================================================

/** DbBig3Record (snake_case) → Big3Record (camelCase) 변환 */
export function toBig3Record(db: DbBig3Record): Big3Record {
  return {
    id: db.id,
    userId: db.user_id,
    recordedAt: db.recorded_at,
    liftType: db.lift_type,
    weight: db.weight,
    reps: db.reps ?? undefined,
    rpe: db.rpe ?? undefined,
    notes: db.notes ?? undefined,
    source: db.source,
    routineEventId: db.routine_event_id ?? undefined,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

/** Big3CreateData (camelCase) → DB Insert 데이터 (snake_case) 변환 */
export function transformBig3ToDbInsert(
  data: Big3CreateData,
): Omit<DbBig3Record, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'source' | 'routine_event_id'> {
  return {
    recorded_at: data.recordedAt,
    lift_type: data.liftType,
    weight: data.weight,
    reps: data.reps ?? null,
    rpe: data.rpe ?? null,
    notes: data.notes ?? null,
  };
}
