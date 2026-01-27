/**
 * Routine Types
 *
 * 루틴 이벤트 관련 타입 정의
 * DB 타입(snake_case) ↔ 도메인 타입(camelCase) 변환 포함
 */

import type { MealData } from './meal';

// ============================================================================
// Enums & Constants
// ============================================================================

export type SessionPurpose = 'workout' | 'coach';
export type EventType = 'workout' | 'meal';
export type EventStatus = 'scheduled' | 'completed' | 'skipped';
export type EventSource = 'user' | 'ai';

// ============================================================================
// Workout Exercise Types (JSONB 내부 구조)
// ============================================================================

/**
 * 개별 운동 세트 정보
 */
export interface WorkoutSet {
  /** 세트 번호 (1부터 시작) */
  setNumber: number;
  /** 목표 반복 횟수 */
  targetReps: number;
  /** 목표 중량 (kg) */
  targetWeight?: number;
  /** 세트 간 휴식 시간 (초) - 세트별로 다를 수 있음 */
  restSeconds?: number;
  /** 실제 수행 반복 횟수 (완료 시) */
  actualReps?: number;
  /** 실제 수행 중량 (완료 시) */
  actualWeight?: number;
  /** 세트 완료 여부 */
  completed?: boolean;
}

/**
 * 개별 운동 정보
 */
export interface WorkoutExercise {
  /** 운동 ID (고유 식별자) */
  id: string;
  /** 운동명 (예: 벤치프레스, 스쿼트) */
  name: string;
  /** 운동 카테고리 (AI가 다양한 값 생성 가능) */
  category?: string;
  /** 주요 타겟 근육 */
  targetMuscle?: string;
  /** 세트 정보 */
  sets: WorkoutSet[];
  /** 세트 간 휴식 시간 (초) */
  restSeconds?: number;
  /** 템포 (예: "3-1-2" = 3초 하강, 1초 유지, 2초 상승) */
  tempo?: string;
  /** RIR (Reps In Reserve, 여유 반복 수) */
  rir?: number;
  /** 특별 기법 (드롭셋, 슈퍼셋 등) */
  technique?: string;
  /** 메모/주의사항 */
  notes?: string;
  /** 운동 완료 여부 */
  completed?: boolean;
  /** 건너뛰기 여부 */
  skipped?: boolean;
}

/**
 * 워크아웃 데이터 (routine_events.data JSONB)
 */
export interface WorkoutData {
  /** 운동 목록 */
  exercises: WorkoutExercise[];
  /** 총 예상 시간 (분) */
  estimatedDuration?: number;
  /** 워크아웃 유형 (AI가 다양한 값 생성 가능) */
  workoutType?: string;
  /** 강도 (1-10) */
  intensity?: number;
  /** 워밍업 지침 */
  warmup?: string;
  /** 쿨다운 지침 */
  cooldown?: string;
  /** AI가 생성한 추가 조언 */
  tips?: string[];
  /** 전체 메모/설명 */
  notes?: string;
}

/**
 * 이벤트 데이터 타입 (운동 또는 식단)
 * routine_events.data JSONB 필드에 저장되는 데이터 타입
 */
export type EventData = WorkoutData | MealData;

// ============================================================================
// Chat Message Types
// ============================================================================

export type ChatRole = 'user' | 'assistant' | 'system';

/**
 * 채팅 메시지
 */
export interface ChatMessage {
  /** 메시지 ID */
  id: string;
  /** 역할 */
  role: ChatRole;
  /** 메시지 내용 */
  content: string;
  /** 생성 시간 */
  createdAt: string;
}

// ============================================================================
// Database Types (snake_case - DB 직접 사용용)
// ============================================================================

/**
 * DB routine_events 테이블 Row 타입
 */
export interface DbRoutineEvent {
  id: string;
  user_id: string;
  type: EventType;
  date: string; // DATE as string (YYYY-MM-DD)
  title: string;
  data: EventData; // JSONB - WorkoutData or MealData
  rationale: string | null;
  status: EventStatus;
  completed_at: string | null;
  source: EventSource;
  ai_session_id: string | null;
  created_at: string;
}

// ============================================================================
// Domain Types (camelCase - 클라이언트 사용용)
// ============================================================================

/**
 * 클라이언트용 루틴 이벤트 타입
 */
export interface RoutineEvent {
  id: string;
  userId: string;
  type: EventType;
  date: string;
  title: string;
  data: EventData; // WorkoutData or MealData based on type
  rationale?: string;
  status: EventStatus;
  completedAt?: string;
  source: EventSource;
  aiSessionId?: string;
  createdAt: string;
}

// ============================================================================
// Create/Update Types
// ============================================================================

/**
 * 루틴 이벤트 생성용 데이터 (AI 생성)
 */
export interface RoutineEventCreateData {
  type: EventType;
  date: string;
  title: string;
  data: EventData;
  rationale?: string;
  source: EventSource;
  aiSessionId?: string;
}

/**
 * 루틴 이벤트 업데이트용 데이터
 */
export interface RoutineEventUpdateData {
  title?: string;
  data?: EventData;
  status?: EventStatus;
  completedAt?: string;
}

/**
 * 4주치 루틴 일괄 생성용 데이터
 */
export interface RoutineBatchCreateData {
  events: RoutineEventCreateData[];
  aiSessionId: string;
}

// ============================================================================
// Type Transformers
// ============================================================================

/**
 * DbRoutineEvent (snake_case) → RoutineEvent (camelCase) 변환
 */
export function toRoutineEvent(db: DbRoutineEvent): RoutineEvent {
  return {
    id: db.id,
    userId: db.user_id,
    type: db.type,
    date: db.date,
    title: db.title,
    data: db.data,
    rationale: db.rationale ?? undefined,
    status: db.status,
    completedAt: db.completed_at ?? undefined,
    source: db.source,
    aiSessionId: db.ai_session_id ?? undefined,
    createdAt: db.created_at,
  };
}

/**
 * RoutineEventCreateData → DB Insert 데이터 변환
 *
 * ⚠️ user_id는 DB DEFAULT current_user_id()가 자동 채움
 */
export function transformEventToDbInsert(
  data: RoutineEventCreateData
): Omit<DbRoutineEvent, 'id' | 'user_id' | 'created_at' | 'completed_at'> {
  return {
    type: data.type,
    date: data.date,
    title: data.title,
    data: data.data,
    rationale: data.rationale ?? null,
    status: 'scheduled',
    source: data.source,
    ai_session_id: data.aiSessionId ?? null,
  };
}

// ============================================================================
// Calendar View Types
// ============================================================================

/**
 * 캘린더 표시용 이벤트 요약
 */
export interface CalendarEventSummary {
  id: string;
  date: string;
  title: string;
  type: EventType;
  status: EventStatus;
  /** 운동 개수 (workout 타입인 경우) */
  exerciseCount?: number;
  /** 예상 소요 시간 (분) */
  estimatedDuration?: number;
}

/**
 * 타입 가드: WorkoutData인지 확인
 */
function isWorkoutData(data: EventData): data is WorkoutData {
  return 'exercises' in data && Array.isArray((data as WorkoutData).exercises);
}

/**
 * RoutineEvent → CalendarEventSummary 변환
 */
export function transformEventToCalendarSummary(
  event: RoutineEvent
): CalendarEventSummary {
  const workoutData = isWorkoutData(event.data) ? event.data : null;
  return {
    id: event.id,
    date: event.date,
    title: event.title,
    type: event.type,
    status: event.status,
    exerciseCount: workoutData?.exercises?.length,
    estimatedDuration: workoutData?.estimatedDuration,
  };
}

