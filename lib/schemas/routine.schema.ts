/**
 * Routine Zod Schemas
 *
 * AI 세션 및 루틴 이벤트 관련 유효성 검사 스키마
 * 한글 에러 메시지 포함
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const SessionPurposeSchema = z.enum(['workout', 'meal'], {
  errorMap: () => ({ message: '유효하지 않은 세션 목적입니다.' }),
});


export const EventTypeSchema = z.enum(['workout', 'meal'], {
  errorMap: () => ({ message: '유효하지 않은 이벤트 타입입니다.' }),
});

export const EventStatusSchema = z.enum(['scheduled', 'completed', 'skipped'], {
  errorMap: () => ({ message: '유효하지 않은 이벤트 상태입니다.' }),
});

export const EventSourceSchema = z.enum(['user', 'ai'], {
  errorMap: () => ({ message: '유효하지 않은 이벤트 소스입니다.' }),
});

export const ChatRoleSchema = z.enum(['user', 'assistant', 'system'], {
  errorMap: () => ({ message: '유효하지 않은 채팅 역할입니다.' }),
});

export const ExerciseCategorySchema = z.string().max(20);

export const WorkoutTypeSchema = z.string().max(20);

// ============================================================================
// Workout Detail Schemas
// ============================================================================

/**
 * 개별 세트 스키마
 */
export const WorkoutSetSchema = z.object({
  setNumber: z.number().int().min(1, '세트 번호는 1 이상이어야 합니다.'),
  targetReps: z.number().int().min(1, '목표 반복 횟수는 1 이상이어야 합니다.').max(100),
  targetWeight: z.number().min(0).max(500).optional(),
  actualReps: z.number().int().min(0).max(100).optional(),
  actualWeight: z.number().min(0).max(500).optional(),
  completed: z.boolean().optional(),
});

/**
 * 개별 운동 스키마
 */
export const WorkoutExerciseSchema = z.object({
  id: z.string().min(1, '운동 ID는 필수입니다.'),
  name: z.string().min(1, '운동명은 필수입니다.').max(100, '운동명은 100자 이내여야 합니다.'),
  category: ExerciseCategorySchema.optional(),
  targetMuscle: z.string().max(50).optional(),
  sets: z.array(WorkoutSetSchema).min(1, '최소 1개의 세트가 필요합니다.'),
  restSeconds: z.number().int().min(0).max(600).optional(),
  tempo: z
    .string()
    .regex(/^\d+-\d+-\d+$/, '템포 형식은 "3-1-2"와 같이 입력해주세요.')
    .optional(),
  rir: z.number().int().min(0).max(5).optional(),
  technique: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  distance: z.number().min(0).max(200).optional(),
  completed: z.boolean().optional(),
  skipped: z.boolean().optional(),
});

/**
 * 워크아웃 데이터 스키마 (routine_events.data)
 */
export const WorkoutDataSchema = z.object({
  exercises: z.array(WorkoutExerciseSchema),
  estimatedDuration: z.number().int().min(1).max(180).optional(),
  workoutType: WorkoutTypeSchema.optional(),
  intensity: z.number().int().min(1).max(10).optional(),
  warmup: z.string().max(500).optional(),
  cooldown: z.string().max(500).optional(),
  estimatedCaloriesBurned: z.number().int().min(0).max(5000).optional(),
  tips: z.array(z.string().max(200)).max(5).optional(),
});

// ============================================================================
// Chat Message Schema
// ============================================================================

export const ChatMessageSchema = z.object({
  id: z.string().min(1),
  role: ChatRoleSchema,
  content: z.string().min(1, '메시지 내용은 필수입니다.'),
  createdAt: z.string().datetime({ message: '유효하지 않은 날짜 형식입니다.' }),
});


// ============================================================================
// Routine Event Schemas
// ============================================================================

/**
 * 루틴 이벤트 전체 스키마
 */
export const RoutineEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: EventTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
  title: z.string().min(1, '제목은 필수입니다.').max(100),
  data: WorkoutDataSchema,
  rationale: z.string().max(1000).optional(),
  status: EventStatusSchema,
  completedAt: z.string().datetime().optional(),
  source: EventSourceSchema,
  aiSessionId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
});

/**
 * 루틴 이벤트 생성 요청 스키마
 */
export const RoutineEventCreateSchema = z.object({
  type: EventTypeSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜 형식은 YYYY-MM-DD여야 합니다.'),
  title: z.string().min(1, '제목은 필수입니다.').max(100),
  data: WorkoutDataSchema,
  rationale: z.string().max(1000).optional(),
  source: EventSourceSchema,
  aiSessionId: z.string().uuid().optional(),
});

/**
 * 루틴 이벤트 업데이트 스키마
 */
export const RoutineEventUpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  data: WorkoutDataSchema.optional(),
  status: EventStatusSchema.optional(),
});

/**
 * 4주치 루틴 일괄 생성 스키마
 */
export const RoutineBatchCreateSchema = z.object({
  events: z.array(RoutineEventCreateSchema).min(1, '최소 1개의 이벤트가 필요합니다.'),
  aiSessionId: z.string().uuid(),
});


// ============================================================================
// Query Params Schemas
// ============================================================================

/**
 * 이벤트 조회 쿼리 파라미터
 */
export const EventQueryParamsSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: EventTypeSchema.optional(),
  status: EventStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});


// ============================================================================
// Type Exports
// ============================================================================

export type SessionPurposeSchemaType = z.infer<typeof SessionPurposeSchema>;
export type EventTypeSchemaType = z.infer<typeof EventTypeSchema>;
export type EventStatusSchemaType = z.infer<typeof EventStatusSchema>;
export type WorkoutSetSchemaType = z.infer<typeof WorkoutSetSchema>;
export type WorkoutExerciseSchemaType = z.infer<typeof WorkoutExerciseSchema>;
export type WorkoutDataSchemaType = z.infer<typeof WorkoutDataSchema>;
export type ChatMessageSchemaType = z.infer<typeof ChatMessageSchema>;
export type RoutineEventSchemaType = z.infer<typeof RoutineEventSchema>;
export type RoutineEventCreateSchemaType = z.infer<typeof RoutineEventCreateSchema>;
export type RoutineBatchCreateSchemaType = z.infer<typeof RoutineBatchCreateSchema>;
export type EventQueryParamsSchemaType = z.infer<typeof EventQueryParamsSchema>;
